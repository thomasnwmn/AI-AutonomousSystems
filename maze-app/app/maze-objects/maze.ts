export type Position = { x: number; y: number };
export type CellType = 'wall' | 'path' | 'start' | 'end' | 'trap';

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export class Maze {
  grid: CellType[][];
  startPos: Position;
  endPos: Position;
  width: number;
  height: number;

  // gridMap: 0 = path, 1 = wall, 2 = start, 3 = end, 4 = trap
  constructor(gridMap: number[][]) {
    this.grid = [];
    let start = {x: 0, y: 0};
    let end = {x: 0, y: 0};
    this.height = gridMap.length;
    this.width = gridMap[0]?.length || 0;

    for (let y = 0; y < this.height; y++) {
      let row: CellType[] = [];
      for (let x = 0; x < this.width; x++) {
        const val = gridMap[y][x];
        if (val === 1) row.push('wall');
        else if (val === 0) row.push('path');
        else if (val === 2) {
          row.push('start');
          start = { x, y };
        }
        else if (val === 3) {
          row.push('end');
          end = { x, y };
        }
        else if (val === 4) {
            row.push('trap');
        }
      }
      this.grid.push(row);
    }
    this.startPos = start;
    this.endPos = end;
  }

  isWall(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;
    return this.grid[y][x] === 'wall';
  }

  isEnd(x: number, y: number): boolean {
    return x === this.endPos.x && y === this.endPos.y;
  }
}
