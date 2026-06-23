import type {Ship, ShipCoordinate} from '../types/game';

export const generateAutoBoard = (size: number): Ship[] => {
    const config = [
        { size: 4 }, { size: 3 }, { size: 3 }, { size: 2 }, { size: 2 }, { size: 2 }
    ];
    const placedShips: Ship[] = [];

    config.forEach((ship, idx) => {
        let placed = false;
        while (!placed) {
            const isHorizontal = Math.random() > 0.5;
            const x = Math.floor(Math.random() * (isHorizontal ? size - ship.size : size));
            const y = Math.floor(Math.random() * (isHorizontal ? size : size - ship.size));
            const coords: ShipCoordinate[] = [];
            for (let i = 0; i < ship.size; i++) {
                coords.push({
                    x: isHorizontal ? x + i : x,
                    y: isHorizontal ? y : y + i,
                    hit: false
                });
            }

            const overlap = placedShips.some(s =>
                s.coordinates.some((c1) => coords.some(c2 => c1.x === c2.x && c1.y === c2.y))
            );

            if (!overlap) {
                placedShips.push({ id: idx, coordinates: coords });
                placed = true;
            }
        }
    });
    return placedShips;
};