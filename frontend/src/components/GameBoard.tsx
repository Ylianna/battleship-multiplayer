import type {Ship, Room} from '../types/game';

interface GameBoardProps {
    activeRoom: Room;
    myBoard: Ship[];
    onMakeMove: (x: number, y: number) => void;
}

export function GameBoard({ activeRoom, myBoard, onMakeMove }: GameBoardProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl">
            <div className="flex flex-col items-center">
                <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Strategic Target Field</h4>
                <div
                    className="grid gap-1 bg-slate-900 p-3 rounded-2xl border border-slate-800"
                    style={{ gridTemplateColumns: `repeat(${activeRoom.gridSize}, minmax(0, 1fr))` }}
                >
                    {Array.from({ length: activeRoom.gridSize * activeRoom.gridSize }).map((_, index) => {
                        const x = index % activeRoom.gridSize;
                        const y = Math.floor(index / activeRoom.gridSize);
                        return (
                            <button
                                key={index}
                                onClick={() => onMakeMove(x, y)}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-slate-950 hover:bg-indigo-900/50 border border-slate-800/80 flex items-center justify-center transition"
                            />
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col items-center">
                <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Your Defenses</h4>
                <div
                    className="grid gap-1 bg-slate-900 p-3 rounded-2xl border border-slate-800"
                    style={{ gridTemplateColumns: `repeat(${activeRoom.gridSize}, minmax(0, 1fr))` }}
                >
                    {Array.from({ length: activeRoom.gridSize * activeRoom.gridSize }).map((_, index) => {
                        const x = index % activeRoom.gridSize;
                        const y = Math.floor(index / activeRoom.gridSize);
                        const hasShip = myBoard.some(s => s.coordinates.some((c) => c.x === x && c.y === y));
                        return (
                            <div
                                key={index}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded border border-slate-800/80 transition ${hasShip ? 'bg-indigo-600/40 border-indigo-500/60' : 'bg-slate-950'}`}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}