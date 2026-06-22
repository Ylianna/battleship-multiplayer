import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

interface Player {
    id: string;
    username: string;
    baseName: string;
    stats: { wins: number; total: number };
}

interface GameRoom {
    id: string;
    creator: Player;
    opponent: Player | null;
    gridSize: number;
    shipsConfig: { type: string; size: number; count: number }[];
    gameState: 'waiting' | 'placement' | 'playing' | 'finished';
    turn: string | null;
    boards: { [playerId: string]: any };
    history: { [playerId: string]: { x: number; y: number; result: 'hit' | 'miss' }[] };
}

const players = new Map<string, Player>();
const rooms = new Map<string, GameRoom>();

function generateUniqueName(desiredName: string): string {
    let count = 1;
    let currentName = desiredName;
    const activeNames = Array.from(players.values()).map(p => p.username);

    while (activeNames.includes(currentName)) {
        count++;
        currentName = `${desiredName} ${count}`;
    }
    return currentName;
}

io.on('connection', (socket: Socket) => {
    socket.on('login', (baseName: string) => {
        const uniqueName = generateUniqueName(baseName.trim() || 'Guest');
        const player: Player = {
            id: socket.id,
            username: uniqueName,
            baseName: baseName,
            stats: { wins: 0, total: 0 }
        };
        players.set(socket.id, player);
        socket.emit('login_success', player);
        io.emit('update_rooms', Array.from(rooms.values()));
    });

    socket.on('create_room', (config: { gridSize: number; shipsConfig: any[] }) => {
        const player = players.get(socket.id);
        if (!player) return;

        const roomId = Math.random().toString(36).substring(2, 9);
        const room: GameRoom = {
            id: roomId,
            creator: player,
            opponent: null,
            gridSize: config.gridSize,
            shipsConfig: config.shipsConfig,
            gameState: 'waiting',
            turn: null,
            boards: {},
            history: {}
        };

        rooms.set(roomId, room);
        socket.join(roomId);
        socket.emit('room_created', room);
        io.emit('update_rooms', Array.from(rooms.values()));
    });

    socket.on('join_room', (roomId: string) => {
        const player = players.get(socket.id);
        const room = rooms.get(roomId);

        if (!player || !room || room.opponent || room.creator.id === socket.id) return;

        room.opponent = player;
        room.gameState = 'placement';
        rooms.set(roomId, room);

        socket.join(roomId);
        io.to(roomId).emit('game_start', room);
        io.emit('update_rooms', Array.from(rooms.values()));
    });

    socket.on('submit_board', (data: { roomId: string; board: any }) => {
        const room = rooms.get(data.roomId);
        if (!room) return;

        room.boards[socket.id] = data.board;
        room.history[socket.id] = [];

        if (room.boards[room.creator.id] && room.opponent && room.boards[room.opponent.id]) {
            room.gameState = 'playing';
            room.turn = room.creator.id;
            io.to(data.roomId).emit('round_start', room);
        } else {
            socket.emit('waiting_for_opponent');
        }
    });

    socket.on('make_move', (data: { roomId: string; x: number; y: number }) => {
        const room = rooms.get(data.roomId);
        if (!room || room.gameState !== 'playing' || room.turn !== socket.id) return;

        const targetId = socket.id === room.creator.id ? room.opponent!.id : room.creator.id;
        const targetBoard = room.boards[targetId];

        let hit = false;
        let shipSunk = false;

        for (const ship of targetBoard) {
            const part = ship.coordinates.find((c: any) => c.x === data.x && c.y === data.y);
            if (part) {
                part.hit = true;
                hit = true;
                shipSunk = ship.coordinates.every((c: any) => c.hit);
                break;
            }
        }

        const moveResult = hit ? 'hit' : 'miss';
        room.history[targetId].push({ x: data.x, y: data.y, result: moveResult });

        const allSunk = targetBoard.every((ship: any) => ship.coordinates.every((c: any) => c.hit));

        if (allSunk) {
            room.gameState = 'finished';
            const winner = players.get(socket.id);
            const loser = players.get(targetId);
            if (winner) { winner.stats.wins++; winner.stats.total++; }
            if (loser) loser.stats.total++;
            io.to(data.roomId).emit('game_over', { room, winnerId: socket.id });
            rooms.delete(data.roomId);
        } else {
            if (!hit) {
                room.turn = targetId;
            }
            io.to(data.roomId).emit('move_processed', room);
        }
    });

    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (!player) return;

        for (const [roomId, room] of rooms.entries()) {
            if (room.creator.id === socket.id || (room.opponent && room.opponent.id === socket.id)) {
                io.to(roomId).emit('opponent_left');
                rooms.delete(roomId);
            }
        }
        players.delete(socket.id);
        io.emit('update_rooms', Array.from(rooms.values()));
    });
});

server.listen(5001, () => {
    console.log('Backend server running on port 5001');
});