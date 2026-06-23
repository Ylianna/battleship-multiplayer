export interface Player {
    id: string;
    username: string;
    stats: { wins: number; total: number };
}

export interface ShipCoordinate {
    x: number;
    y: number;
    hit: boolean;
}

export interface Ship {
    id: number;
    coordinates: ShipCoordinate[];
}

export interface Room {
    id: string;
    creator: Player;
    opponent: Player | null;
    gridSize: number;
    shipsConfig: { type: string; size: number; count: number }[];
    gameState: 'waiting' | 'placement' | 'playing' | 'finished';
    turn: string | null;
    history: {
        [playerId: string]: { x: number; y: number; result: 'hit' | 'miss' }[]
    };
}