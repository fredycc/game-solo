import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import os from 'os';
import { ExpressPeerServer } from 'peer';

const app = express();
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/ip', (req, res) => {
    res.json({ ip: getLocalIp() });
});

const server = createServer(app);

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});

app.use('/peerjs', peerServer);

// Serve static files in production
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'dist')));

app.get(/(.*)/, (req, res, next) => {
    if (req.path === '/peerjs' || req.path.startsWith('/socket.io')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3005;

// Store connections
const sessions = new Map();

io.on('connection', (socket) => {
    console.log('--- NEW CONNECTION ---');
    console.log('Socket ID:', socket.id);

    socket.on('host-game', (gameId) => {
        console.log(`[HOST] Game ID: ${gameId} (Socket: ${socket.id})`);
        socket.join(gameId);
        sessions.set(gameId, { host: socket.id, players: [] });
    });

    socket.on('join-game', (gameId) => {
        console.log(`[JOIN] Request for Room: ${gameId} (Socket: ${socket.id})`);
        if (sessions.has(gameId)) {
            socket.join(gameId);
            sessions.get(gameId).players.push(socket.id);
            console.log(`[JOIN] Socket ${socket.id} joined Room ${gameId}`);
            io.to(gameId).emit('player-joined', socket.id);
        } else {
            console.log(`[JOIN] FAILED: Room ${gameId} not found`);
            socket.emit('error', 'Game not found');
        }
    });

    socket.on('signal', ({ to, signal }) => {
        console.log('Forwarding signal to:', to);
        io.to(to).emit('signal', { from: socket.id, signal });
    });

    socket.on('game-event', (data) => {
        const { gameId, event } = data;
        if (sessions.has(gameId)) {
            console.log(`[EVENT] from ${socket.id} to Room ${gameId}:`, event);
            socket.to(gameId).emit('game-event', event);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const [gameId, session] of sessions.entries()) {
            if (session.host === socket.id) {
                console.log(`[HOST DISCONNECT] Cleaning up Room ${gameId}`);
                io.to(gameId).emit('host-disconnected');
                sessions.delete(gameId);
            }
        }
    });
});

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIp();
    console.log(`Signaling server running on:`);
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Network: http://${ip}:${PORT}`);
});
