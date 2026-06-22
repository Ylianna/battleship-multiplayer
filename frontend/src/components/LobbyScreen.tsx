import { Swords, Trophy, Plus } from 'lucide-react';
import type {Player, Room} from '../types/game';

interface LobbyScreenProps {
    user: Player;
    rooms: Room[];
    gridSize: number;
    setGridSize: (size: number) => void;
    onCreateRoom: () => void;
    onJoinRoom: (id: string) => void;
}

export function LobbyScreen({ user, rooms, gridSize, setGridSize, onCreateRoom, onJoinRoom }: LobbyScreenProps) {
    return (
        <div className="min-h-screen bg-slate-900 p-8">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Swords className="text-indigo-500" /> Platform Lobby
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Logged in as: <span className="text-indigo-400 font-semibold">{user.username}</span></p>
                </div>
                <div className="flex items-center gap-4 bg-slate-800 px-4 py-2 rounded-xl text-sm border border-slate-700">
                    <Trophy size={16} className="text-yellow-500" />
                    <span className="text-slate-300">Wins: {user.stats.wins} / Total: {user.stats.total}</span>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-800 h-fit">
                    <h3 className="text-xl font-semibold mb-4 text-white">Create Battle Session</h3>
                    <div className="mb-6">
                        <label className="text-sm text-slate-400 block mb-2">Grid Dimension</label>
                        <select
                            value={gridSize}
                            onChange={(e) => setGridSize(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                        >
                            <option value={8}>8 x 8 (Fast Match)</option>
                            <option value={10}>10 x 10 (Standard)</option>
                            <option value={12}>12 x 12 (Advanced)</option>
                        </select>
                    </div>
                    <button onClick={onCreateRoom} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition duration-200">
                        <Plus size={18} /> Initialize Session
                    </button>
                </div>

                <div className="lg:col-span-2 bg-slate-800/30 p-6 rounded-2xl border border-slate-800/80">
                    <h3 className="text-xl font-semibold mb-4 text-white">Available Remote Operations</h3>
                    <div className="space-y-3">
                        {rooms.filter(r => r.gameState === 'waiting').length === 0 ? (
                            <p className="text-slate-500 text-sm py-8 text-center bg-slate-900/30 rounded-xl border border-dashed border-slate-800">No active rooms awaiting players. Initialize your own.</p>
                        ) : (
                            rooms.filter(r => r.gameState === 'waiting').map((room) => (
                                <div key={room.id} className="flex justify-between items-center p-4 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Commander: {room.creator.username}</h4>
                                        <p className="text-xs text-slate-400 mt-1">Grid Size: {room.gridSize}x{room.gridSize} • Standard Armada</p>
                                    </div>
                                    <button onClick={() => onJoinRoom(room.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition">
                                        Engage
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}