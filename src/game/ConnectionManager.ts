import { io, Socket } from 'socket.io-client';
import Peer from 'peerjs';

export type GameEvent =
    | { type: 'move'; dx: number; dy: number }
    | { type: 'action'; action: string };

type DataConnection = {
    open: boolean;
    close(): void;
    send(data: GameEvent): void;
    on(event: 'open', callback: () => void): void;
    on(event: 'data', callback: (data: unknown) => void): void;
};

const isGameEvent = (value: unknown): value is GameEvent => {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;

    if (v.type === 'move') {
        return typeof v.dx === 'number' && typeof v.dy === 'number';
    }

    if (v.type === 'action') {
        return typeof v.action === 'string';
    }

    return false;
};

export type ConnectionState = 'disconnected' | 'signaling' | 'connected';

class ConnectionManager {
    private socket: Socket | null = null;
    private peer: Peer | null = null;
    private conn: DataConnection | null = null;
    private gameId: string = '';
    private state: ConnectionState = 'disconnected';
    private stateListeners: Set<(state: ConnectionState) => void> = new Set();
    private eventListeners: Set<(event: GameEvent) => void> = new Set();
    private isInitializing: boolean = false;

    constructor() {
        this.gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    getGameId() {
        return this.gameId;
    }

    subscribeState(callback: (state: ConnectionState) => void) {
        this.stateListeners.add(callback);
        callback(this.state);
        return () => {
            this.stateListeners.delete(callback);
        };
    }

    subscribeEvents(callback: (event: GameEvent) => void) {
        this.eventListeners.add(callback);
        return () => {
            this.eventListeners.delete(callback);
        };
    }

    async connect(serverUrl: string) {
        if (this.state !== 'disconnected' || this.isInitializing) return;
        this.isInitializing = true;
        this.updateState('signaling');

        try {
            this.socket = io(serverUrl);
            this.socket.on('connect', () => {
                this.socket?.emit('host-game', this.gameId);
            });

            this.socket.on('game-event', (event: unknown) => {
                if (isGameEvent(event)) this.emitEvent(event);
            });

            const url = new URL(serverUrl);
            const isSecure = url.protocol === 'https:';

            this.peer = new Peer(`host-${this.gameId}`, {
                host: url.hostname,
                port: url.port ? Number(url.port) : (isSecure ? 443 : 80),
                path: '/peerjs',
                secure: isSecure,
                debug: 2,
                config: {
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                }
            });

            this.peer.on('error', (err) => {
                console.error('PeerJS (Host) Error:', err);
            });

            this.peer.on('connection', (connection) => {
                this.conn = connection as unknown as DataConnection;
                this.conn.on('open', () => {
                    console.log('PC: P2P OK');
                    this.updateState('connected');
                });
                this.conn.on('data', (data: unknown) => {
                    if (isGameEvent(data)) this.emitEvent(data);
                });
            });

            this.socket.on('player-joined', () => {
                if (this.state === 'signaling') this.updateState('connected');
            });

        } catch {
            this.updateState('disconnected');
        } finally {
            this.isInitializing = false;
        }
    }

    private updateState(state: ConnectionState) {
        this.state = state;
        this.stateListeners.forEach(cb => cb(state));
    }

    private emitEvent(event: GameEvent) {
        this.eventListeners.forEach(cb => cb(event));
    }

    async connectAsController(serverUrl: string, gameId: string) {
        if (this.isInitializing) return;
        this.isInitializing = true;
        this.updateState('signaling');
        this.gameId = gameId;

        this.socket = io(serverUrl);
        this.socket.on('connect', () => {
            this.socket?.emit('join-game', gameId);
            this.updateState('connected');
        });

        this.socket.on('host-disconnected', () => {
            console.log('[Controller] Host disconnected.');
            this.disconnect();
        });

        const url = new URL(serverUrl);
        const isSecure = url.protocol === 'https:';

        this.peer = new Peer({
            host: url.hostname,
            port: url.port ? Number(url.port) : (isSecure ? 443 : 80),
            path: '/peerjs',
            secure: isSecure,
            debug: 2,
            config: {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            }
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS (Controller) Error:', err);
        });

        this.peer.on('open', () => {
            const connection = this.peer!.connect(`host-${gameId}`, {
                reliable: true
            }) as unknown as DataConnection;

            connection.on('open', () => {
                this.conn = connection;
                console.log('Móvil: WebRTC Ready');
            });
        });

        this.isInitializing = false;
    }

    disconnect() {
        if (this.conn) {
            this.conn.close();
            this.conn = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.updateState('disconnected');
        console.log('[ConnectionManager] Disconnected and cleaned up.');
    }

    getConnectionType(): 'P2P' | 'SERVER' | 'NONE' {
        if (this.conn && this.conn.open) return 'P2P';
        if (this.socket && this.socket.connected) return 'SERVER';
        return 'NONE';
    }

    sendEvent(event: GameEvent) {
        if (this.conn && this.conn.open) {
            this.conn.send(event);
        } else if (this.socket && this.socket.connected) {
            this.socket.emit('game-event', { gameId: this.gameId, event });
        }
    }
}

export const connectionManager = new ConnectionManager();
