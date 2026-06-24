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

export function GameBoard({activeRoom, myBoard, onMakeMove, userId}: GameBoardProps) {
    const isCreator = activeRoom.creator.id === userId;
    const myId = userId;
    const opponentId = isCreator ? activeRoom.opponent?.id : activeRoom.creator.id;

    const shotsOnOpponent: ShotRecord[] = opponentId ? (activeRoom.history?.[opponentId] || []) : [];
    const shotsOnMe: ShotRecord[] = myId ? (activeRoom.history?.[myId] || []) : [];

    const handleCellClick = (x: number, y: number, shot: ShotRecord | null) => {
        if (shot || activeRoom.turn !== userId) return;
        onMakeMove(x, y);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl select-none">
            <div className="flex flex-col items-center">
                <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">
                    Strategic Target Field
                </h4>
                <div
                    className="grid gap-px bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-2xl"
                    style={{gridTemplateColumns: `repeat(${activeRoom.gridSize}, minmax(0, 1fr))`}}
                >
                    {Array.from({length: activeRoom.gridSize * activeRoom.gridSize}).map((_, index) => {
                        const x = index % activeRoom.gridSize;
                        const y = Math.floor(index / activeRoom.gridSize);
                        const shot = shotsOnOpponent.find((h: ShotRecord) => h.x === x && h.y === y) || null;

                        let cellBg = 'bg-slate-900 hover:bg-indigo-950/40';
                        let cellContent = '';

                        if (shot) {
                            if (shot.result === 'hit') {
                                cellBg = 'bg-rose-950/20 border border-rose-500/30';
                                cellContent = '❌';
                            } else {
                                cellBg = 'bg-slate-950';
                                cellContent = '•';
                            }
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleCellClick(x, y, shot)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xs font-mono transition-all duration-150 border border-slate-800/40 ${cellBg}`}
                            >
              <span className={shot?.result === 'hit' ? 'text-rose-400 font-bold text-sm' : 'text-slate-600 text-lg font-black'}>
                {cellContent}
              </span>
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="flex flex-col items-center">
                <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">
                    Your Defenses
                </h4>
                <div className="relative bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-2xl">
                    <div
                        className="grid gap-px relative z-0"
                        style={{gridTemplateColumns: `repeat(${activeRoom.gridSize}, minmax(0, 1fr))`}}
                    >
                        {Array.from({length: activeRoom.gridSize * activeRoom.gridSize}).map((_, index) => {
                            const x = index % activeRoom.gridSize;
                            const y = Math.floor(index / activeRoom.gridSize);
                            const shotByOpponent = shotsOnMe.find((h: ShotRecord) => h.x === x && h.y === y);

                            let cellBg = 'bg-slate-900';
                            if (shotByOpponent) {
                                if (shotByOpponent.result === 'hit') {
                                    cellBg = 'bg-rose-950/20 border border-rose-500/20';
                                } else {
                                    cellBg = 'bg-slate-950';
                                }
                            }

                            return (
                                <div
                                    key={index}
                                    className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-slate-800/40 text-slate-400 relative ${cellBg}`}
                                />
                            );
                        })}
                    </div>
                    <div
                        className="absolute inset-0 p-1 grid gap-px pointer-events-none z-10"
                        style={{
                            gridTemplateColumns: `repeat(${activeRoom.gridSize}, minmax(0, 1fr))`,
                            gridTemplateRows: `repeat(${activeRoom.gridSize}, minmax(0, 1fr))`
                        }}
                    >
                        {myBoard.map((ship) => {
                            const coords = [...ship.coordinates].sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
                            const firstCell = coords[0];
                            const lastCell = coords[coords.length - 1];
                            if (!firstCell || !lastCell) return null;

                            const isHorizontal = firstCell.y === lastCell.y;
                            const size = coords.length;
                            const colStart = firstCell.x + 1;
                            const rowStart = firstCell.y + 1;
                            const colEnd = isHorizontal ? colStart + size : colStart + 1;
                            const rowEnd = isHorizontal ? rowStart + 1 : rowStart + size;
                            const suffix = isHorizontal ? 'h' : 'v';

                            const imgStyle: React.CSSProperties = {
                                gridColumn: `${colStart} / ${colEnd}`,
                                gridRow: `${rowStart} / ${rowEnd}`,
                                width: '100%',
                                height: '100%',
                                objectFit: size === 4 ? 'contain' : 'fill',
                                objectPosition: 'center',
                            };

                            return (
                                <img
                                    key={ship.id}
                                    src={`/assets/ship-${size}-${suffix}.png`}
                                    alt="warship"
                                    style={imgStyle}
                                    className="p-0.5 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
                                />
                            );
                        })}
                    </div>
                    <div
                        className="absolute inset-0 p-1 grid gap-px pointer-events-none z-20"
                        style={{
                            gridTemplateColumns: `repeat(${activeRoom.gridSize}, minmax(0, 1fr))`,
                            gridTemplateRows: `repeat(${activeRoom.gridSize}, minmax(0, 1fr))`
                        }}
                    >
                        {Array.from({length: activeRoom.gridSize * activeRoom.gridSize}).map((_, index) => {
                            const x = index % activeRoom.gridSize;
                            const y = Math.floor(index / activeRoom.gridSize);
                            const shotByOpponent = shotsOnMe.find((h: ShotRecord) => h.x === x && h.y === y);

                            if (!shotByOpponent) return <div key={index}/>;

                            return (
                                <div
                                    key={index}
                                    style={{gridColumn: `${x + 1}`, gridRow: `${y + 1}`}}
                                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm select-none animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                                >
                                    {shotByOpponent.result === 'hit' ? '💥' : '•'}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}