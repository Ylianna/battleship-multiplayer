import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { RotateCcw, Play } from 'lucide-react';
import type {Player, Room, Ship} from './types/game';
import { generateAutoBoard } from './utils/boardGenerator';
import { LoginScreen } from './components/LoginScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameBoard } from './components/GameBoard';

const socket: Socket = io('http://localhost:5001');

export function App() {
  const [user, setUser] = useState<Player | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);

  const [gridSize, setGridSize] = useState(10);
  const [myBoard, setMyBoard] = useState<Ship[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    socket.on('login_success', (player: Player) => setUser(player));
    socket.on('update_rooms', (updatedRooms: Room[]) => setRooms(updatedRooms));

    socket.on('game_start', (room: Room) => {
      setActiveRoom(room);
      setMyBoard(generateAutoBoard(room.gridSize));
    });

    socket.on('round_start', (room: Room) => setActiveRoom(room));
    socket.on('move_processed', (room: Room) => setActiveRoom(room));

    socket.on('game_over', ({ room, winnerId }: { room: Room; winnerId: string }) => {
      setActiveRoom(room);
      setWinner(winnerId);
    });

    return () => {
      socket.off('login_success');
      socket.off('update_rooms');
      socket.off('game_start');
      socket.off('round_start');
      socket.off('move_processed');
      socket.off('game_over');
    };
  }, []);

  const handleLogin = () => {
    if (!usernameInput.trim()) return;
    socket.emit('login', usernameInput);
  };

  const createRoom = () => {
    const defaultConfig = [{ type: 'Standard Armada', size: 4, count: 1 }];
    socket.emit('create_room', { gridSize, shipsConfig: defaultConfig });
  };

  const joinRoom = (id: string) => socket.emit('join_room', id);

  const handleScramble = () => {
    if (!activeRoom) return;
    setMyBoard(generateAutoBoard(activeRoom.gridSize));
  };

  const submitBoard = () => {
    if (!activeRoom) return;
    socket.emit('submit_board', { roomId: activeRoom.id, board: myBoard });
    setIsReady(true);
  };

  const makeMove = (x: number, y: number) => {
    if (!activeRoom || activeRoom.turn !== user?.id) return;
    socket.emit('make_move', { roomId: activeRoom.id, x, y });
  };

  if (!user) {
    return <LoginScreen usernameInput={usernameInput} setUsernameInput={setUsernameInput} onLogin={handleLogin} />;
  }

  if (!activeRoom) {
    return <LobbyScreen user={user} rooms={rooms} gridSize={gridSize} setGridSize={setGridSize} onCreateRoom={createRoom} onJoinRoom={joinRoom} />;
  }

  return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center">
        <div className="w-full max-w-6xl flex justify-between items-center mb-8 bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800">
          <div>
            <span className="text-xs text-indigo-400 tracking-wider font-mono">ROOM IDENTITY: {activeRoom.id}</span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {activeRoom.creator.username} <span className="text-slate-500 font-normal">vs</span> {activeRoom.opponent?.username || 'Connecting...'}
            </h2>
          </div>
          <div>
            {activeRoom.gameState === 'playing' && (
                <div className={`px-4 py-2 rounded-xl font-bold text-sm border ${activeRoom.turn === socket.id ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                  {activeRoom.turn === socket.id ? 'Your Strategic Volley' : 'Opponent Calculating Move'}
                </div>
            )}
          </div>
        </div>

        {activeRoom.gameState === 'placement' && (
            <div className="flex flex-col items-center bg-slate-900/50 p-8 rounded-2xl border border-slate-800 w-full max-w-xl text-center">
              <h3 className="text-xl font-bold mb-2 text-white">Fleet Matrix Deployment</h3>
              <p className="text-sm text-slate-400 mb-6">Armada automatically generated. Re-roll or deploy instantly.</p>
              <div className="flex gap-4 w-full">
                <button onClick={handleScramble} disabled={isReady} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50">
                  <RotateCcw size={16} /> Re-Scramble
                </button>
                <button onClick={submitBoard} disabled={isReady} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                  <Play size={16} /> Lock Configurations
                </button>
              </div>
            </div>
        )}

        {activeRoom.gameState === 'playing' && (
            <GameBoard
                activeRoom={activeRoom}
                myBoard={myBoard}
                onMakeMove={makeMove}
                userId={socket.id || ''}
            />
        )}

        {winner && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center max-w-sm w-full shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-2">{winner === user.id ? 'VICTORY ACHIEVED' : 'DEFEAT'}</h3>
                <button onClick={() => { setActiveRoom(null); setWinner(null); setIsReady(false); }} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition">
                  Return to Control Room
                </button>
              </div>
            </div>
        )}
      </div>
  );
}