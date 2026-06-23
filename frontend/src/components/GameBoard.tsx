import type {Ship, Room} from '../types/game';

interface ShotRecord {
    x: number;
    y: number;
    result: 'hit' | 'miss';
}

interface GameBoardProps {
    activeRoom: Room;
    myBoard: Ship[];
    onMakeMove: (x: number, y: number) => void;
    userId: string;
}

export function GameBoard({ activeRoom, myBoard, onMakeMove, userId }: GameBoardProps) {
    const isCreator = activeRoom.creator.id === userId;

    const myId = userId;
    const opponentId = isCreator ? activeRoom.opponent?.id : activeRoom.creator.id;

    const shotsOnOpponent: ShotRecord[] = opponentId ? (activeRoom.history?.[opponentId] || []) : [];
    const shotsOnMe: ShotRecord[] = myId ? (activeRoom.history?.[myId] || []) : [];

    const handleCellClick = (x: number, y: number, shot: ShotRecord | null) => {
        if (shot) {
            return;
        }
        if (activeRoom.turn !== userId) {
            return;
        }
        onMakeMove(x, y);
    };

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

                        const shot = shotsOnOpponent.find((h: ShotRecord) => h.x === x && h.y === y) || null;

                        let cellBg = 'bg-slate-950 hover:bg-indigo-900/30';
                        let cellContent = '';

                        if (shot) {
                            if (shot.result === 'hit') {
                                cellBg = 'bg-rose-500/20 border-rose-500/50';
                                cellContent = '❌';
                            } else {
                                cellBg = 'bg-slate-800/40';
                                cellContent = '•';
                            }
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleCellClick(x, y, shot)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded border border-slate-800/80 flex items-center justify-center text-xs transition ${cellBg}`}
                            >
                <span className={shot?.result === 'hit' ? 'text-rose-500 font-bold' : 'text-slate-500 text-lg'}>
                  {cellContent}
                </span>
                            </button>
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
                        const shotByOpponent = shotsOnMe.find((h: ShotRecord) => h.x === x && h.y === y);

                        let cellBg = 'bg-slate-950';
                        let cellContent = '';

                        if (hasShip) {
                            cellBg = 'bg-indigo-600/40 border-indigo-500/60';
                        }

                        if (shotByOpponent) {
                            if (shotByOpponent.result === 'hit') {
                                cellBg = 'bg-rose-600/30 border-rose-500';
                                cellContent = '💥';
                            } else {
                                cellBg = 'bg-slate-800';
                                cellContent = '•';
                            }
                        }

                        return (
                            <div
                                key={index}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded border border-slate-800/80 flex items-center justify-center text-xs transition ${cellBg}`}
                            >
                                <span>{cellContent}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}