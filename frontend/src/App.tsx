import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { RotateCcw, Play, Volume2, Shield, Activity } from 'lucide-react';
import type {Player, Room, Ship} from './types/game';
import { generateAutoBoard } from './utils/boardGenerator';
import { LoginScreen } from './components/LoginScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameBoard } from './components/GameBoard';

const socket: Socket = io('https://battleship-multiplayer-zg9p.onrender.com');

const playSound = (type: 'miss' | 'hit') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } else {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }
};

export function App() {
  const [user, setUser] = useState<Player | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);

  const [gridSize, setGridSize] = useState(10);
  const [myBoard, setMyBoard] = useState<Ship[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);

  useEffect(() => {
    socket.on('login_success', (player: Player) => setUser(player));
    socket.on('update_rooms', (updatedRooms: Room[]) => setRooms(updatedRooms));

    socket.on('game_start', (room: Room) => {
      setActiveRoom(room);
      setMyBoard(generateAutoBoard(room.gridSize));
      setActionLog(['Tactical link established. Deploy fleet.']);
    });

    socket.on('round_start', (room: Room) => {
      setActiveRoom(room);
      setActionLog(prev => ['Engagement initiated. Fire at will!', ...prev]);
    });

    socket.on('move_processed', (room: Room) => {
      const prevRoom = activeRoom;
      setActiveRoom(room);

      const currentTargetId = socket.id === room.creator.id ? room.opponent?.id : room.creator.id;
      if (currentTargetId) {
        const currentHistory = room.history?.[currentTargetId] || [];
        const prevHistory = prevRoom?.history?.[currentTargetId] || [];

        if (currentHistory.length > prevHistory.length) {
          const lastMove = currentHistory[currentHistory.length - 1];
          if (lastMove) {
            playSound(lastMove.result);
            const playerTag = room.turn === socket.id ? 'Opponent' : 'You';
            const outcomeTag = lastMove.result === 'hit' ? 'CRITICAL HIT 💥' : 'MISS •';
            setActionLog(prev => [`${playerTag} fired at [${lastMove.x}, ${lastMove.y}]: ${outcomeTag}`, ...prev]);
          }
        }
      }
    });

    socket.on('game_over', ({ room, winnerId }: { room: Room; winnerId: string }) => {
      setActiveRoom(room);
      setWinner(winnerId);
      playSound(winnerId === socket.id ? 'hit' : 'miss');
    });

    return () => {
      socket.off('login_success');
      socket.off('update_rooms');
      socket.off('game_start');
      socket.off('round_start');
      socket.off('move_processed');
      socket.off('game_over');
    };
  }, [activeRoom]);

  const handleLogin = () => {
    if (!usernameInput.trim()) return;
    socket.emit('login', usernameInput);
  };

  const createRoom = () => {
    const defaultConfig = [
      { type: 'Battleship', size: 4, count: 1 },
      { type: 'Cruiser', size: 3, count: 2 },
      { type: 'Destroyer', size: 2, count: 3 },
      { type: 'Submarine', size: 1, count: 4 }
    ];
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
    setActionLog(prev => ['Waiting for opponent configurations...', ...prev]);
  };

  const makeMove = (x: number, y: number) => {
    if (!activeRoom || activeRoom.turn !== socket.id) return;
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
        <div className="w-full max-w-6xl flex justify-between items-center mb-6 bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-xs text-indigo-400 tracking-wider font-mono">GRID: {activeRoom.gridSize}x{activeRoom.gridSize} • ID: {activeRoom.id}</span>
              <h2 className="text-lg font-bold text-white">
                {activeRoom.creator.username} <span className="text-slate-500 font-normal">vs</span> {activeRoom.opponent?.username || 'Connecting...'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Volume2 size={18} className="text-slate-400" />
            {activeRoom.gameState === 'playing' && (
                <div className={`px-4 py-2 rounded-xl font-bold text-sm border tracking-wide transition-all ${activeRoom.turn === socket.id ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                  {activeRoom.turn === socket.id ? 'YOUR TURN' : 'OPPONENT TURN'}
                </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <div className="lg:col-span-3 flex flex-col items-center bg-slate-900/20 p-6 rounded-3xl border border-slate-900/60 shadow-inner">
            {activeRoom.gameState === 'placement' && (
                <div className="flex flex-col items-center bg-slate-900/80 p-8 rounded-2xl border border-slate-800 w-full max-w-xl text-center shadow-2xl my-12">
                  <Shield size={40} className="text-indigo-400 mb-3 animate-pulse" />
                  <h3 className="text-xl font-bold mb-2 text-white">Fleet Matrix Deployment</h3>
                  <p className="text-sm text-slate-400 mb-6">Armada automatically generated. Re-scramble or lock deployment matrix.</p>
                  <div className="flex gap-4 w-full">
                    <button onClick={handleScramble} disabled={isReady} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-40">
                      <RotateCcw size={16} /> Re-Scramble
                    </button>
                    <button onClick={submitBoard} disabled={isReady} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-40">
                      <Play size={16} /> Deploy Fleet
                    </button>
                  </div>
                </div>
            )}

            {activeRoom.gameState === 'playing' && (
                <GameBoard activeRoom={activeRoom} myBoard={myBoard} onMakeMove={makeMove} userId={socket.id || ''} />
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 h-[480px] flex flex-col shadow-xl">
            <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">
              <Activity size={14} className="text-indigo-400" /> Operational Feed
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs scrollbar-thin">
              {actionLog.map((log, i) => (
                  <div key={i} className={`p-2 rounded-lg border leading-relaxed ${log.includes('CRITICAL') ? 'bg-rose-950/30 border-rose-900/50 text-rose-400' : log.includes('MISS') ? 'bg-slate-950/50 border-slate-800 text-slate-400' : 'bg-indigo-950/20 border-indigo-900/30 text-indigo-300'}`}>
                    {log}
                  </div>
              ))}
            </div>
          </div>
        </div>

        {winner && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center max-w-sm w-full shadow-2xl transform scale-100 transition-all">
                <h3 className={`text-2xl font-black mb-2 tracking-wide ${winner === socket.id ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {winner === socket.id ? 'VICTORY ACHIEVED' : 'DEFEAT'}
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  {winner === socket.id ? 'The enemy armada has been vaporized.' : 'Your defense lines collapsed.'}
                </p>
                <button onClick={() => { setActiveRoom(null); setWinner(null); setIsReady(false); setActionLog([]); }} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20">Return to Control Room</button >
            </div>
            </div>
        )}
      </div>
  )};