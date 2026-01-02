import { io, Socket } from 'socket.io-client';
import Peer from 'peerjs';

type DataConnection = any;

export type ConnectionState = 'disconnected' | 'signaling' | 'connected';

class ConnectionManager {
    private socket: Socket | null = null;
    private peer: Peer | null = null;
    private conn: DataConnection | null = null;
    private gameId: string = '';
    private state: ConnectionState = 'disconnected';
    private stateListeners: Set<(state: ConnectionState) => void> = new Set();
    private eventListeners: Set<(event: any) => void> = new Set();
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

    subscribeEvents(callback: (event: any) => void) {
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

            this.socket.on('game-event', (event) => {
                this.emitEvent(event);
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
                this.conn = connection;
                this.conn.on('open', () => {
                    console.log('PC: P2P OK');
                    this.updateState('connected');
                });
                this.conn.on('data', (data: any) => this.emitEvent(data));
            });

            this.socket.on('player-joined', () => {
                if (this.state === 'signaling') this.updateState('connected');
            });

        } catch (error) {
            this.updateState('disconnected');
        } finally {
            this.isInitializing = false;
        }
    }

    private updateState(state: ConnectionState) {
        this.state = state;
        this.stateListeners.forEach(cb => cb(state));
    }

    private emitEvent(event: any) {
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
            });

            connection.on('open', () => {
                this.conn = connection;
                console.log('Móvil: WebRTC Ready');
            });
        });

        this.isInitializing = false;
    }

    getConnectionType(): 'P2P' | 'SERVER' | 'NONE' {
        if (this.conn && this.conn.open) return 'P2P';
        if (this.socket && this.socket.connected) return 'SERVER';
        return 'NONE';
    }

    sendEvent(event: any) {
        if (this.conn && this.conn.open) {
            this.conn.send(event);
        } else if (this.socket && this.socket.connected) {
            this.socket.emit('game-event', { gameId: this.gameId, event });
        }
    }
}

export const connectionManager = new ConnectionManager();
