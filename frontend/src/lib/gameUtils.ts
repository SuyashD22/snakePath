// Board position helpers and game constants

export const BOARD_SIZE = 100;
export const GRID_COLS = 10;
export const GRID_ROWS = 10;

// Player color palette (matches backend)
export const PLAYER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFE66D", "#A855F7", "#FF8C42",
  "#06D6A0", "#118AB2", "#EF476F", "#073B4C", "#F4A261",
  "#E76F51", "#2A9D8F", "#E9C46A", "#264653", "#D62828",
  "#003049", "#FCBF49", "#90BE6D", "#F94144", "#577590",
];

// Cell background colors for the board
const CELL_COLORS = [
  "#B8E986", "#A5D6A7", "#FFD54F", "#FFB74D",
  "#81C784", "#AED581", "#FFF176", "#FFCC80",
];

export function getCellColor(num: number): string {
  const row = Math.floor((num - 1) / GRID_COLS);
  const col = (num - 1) % GRID_COLS;
  const idx = (row + col) % CELL_COLORS.length;
  return CELL_COLORS[idx];
}

/**
 * Convert a board number (1-100) to grid row/col.
 * Board layout is zig-zag: row 0 is top (91-100), row 9 is bottom (1-10).
 * Even rows (from bottom) go left→right, odd rows go right→left.
 */
export function numberToGridPosition(num: number): { row: number; col: number } {
  const fromBottom = Math.floor((num - 1) / GRID_COLS); // 0-based row from bottom
  const row = GRID_ROWS - 1 - fromBottom; // convert to 0-based row from top
  const posInRow = (num - 1) % GRID_COLS;

  // Even rows from bottom go left→right, odd rows go right→left
  const col = fromBottom % 2 === 0 ? posInRow : GRID_COLS - 1 - posInRow;

  return { row, col };
}

/**
 * Get pixel position (as percentage) for a board number within the grid.
 */
export function numberToPercentPosition(num: number): { x: number; y: number } {
  const { row, col } = numberToGridPosition(num);
  return {
    x: (col + 0.5) * (100 / GRID_COLS),
    y: (row + 0.5) * (100 / GRID_ROWS),
  };
}

/**
 * Generate the board layout as a 2D array matching display order.
 * Returns array of rows (top to bottom), each row has numbers in display order.
 */
export function generateBoardLayout(): number[][] {
  const board: number[][] = [];
  // Display row 0 = top of screen = highest numbers (91-100)
  // Display row 9 = bottom of screen = lowest numbers (1-10)
  for (let displayRow = 0; displayRow < GRID_ROWS; displayRow++) {
    const fromBottom = GRID_ROWS - 1 - displayRow;
    const rowNums: number[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      const actualCol = fromBottom % 2 === 0 ? col : GRID_COLS - 1 - col;
      const num = fromBottom * GRID_COLS + actualCol + 1;
      rowNums.push(num);
    }
    board.push(rowNums);
  }
  return board;
}

export interface SnakeLadder {
  start: number;
  end: number;
}

/**
 * Generate random snakes and ladders (client-side, for offline mode).
 */
export function generateSnakesAndLadders(): { snakes: SnakeLadder[]; ladders: SnakeLadder[] } {
  const occupied = new Set<number>();
  const snakes: SnakeLadder[] = [];
  const ladders: SnakeLadder[] = [];

  // Generate 8 snakes
  let count = 0;
  let attempts = 0;
  while (count < 8 && attempts < 200) {
    attempts++;
    const head = Math.floor(Math.random() * 80) + 20; // 20-99
    const tail = Math.floor(Math.random() * (head - 6)) + 2; // 2 to head-5
    if (!occupied.has(head) && !occupied.has(tail) && head !== 100 && tail !== 1) {
      snakes.push({ start: head, end: tail });
      occupied.add(head);
      occupied.add(tail);
      count++;
    }
  }

  // Generate 8 ladders
  count = 0;
  attempts = 0;
  while (count < 8 && attempts < 200) {
    attempts++;
    const bottom = Math.floor(Math.random() * 79) + 2; // 2-80
    const top = Math.floor(Math.random() * Math.min(40, 99 - bottom)) + bottom + 5;
    if (!occupied.has(bottom) && !occupied.has(top) && top !== 100 && bottom !== 1 && top <= 99) {
      ladders.push({ start: bottom, end: top });
      occupied.add(bottom);
      occupied.add(top);
      count++;
    }
  }

  return { snakes, ladders };
}
