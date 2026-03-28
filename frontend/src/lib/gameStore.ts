// ─── SHARED TYPES ──────────────────────────────────────────
export interface TeamConfig {
  id: number;
  name: string;
  password: string;
  color: string;
  avatar: string;
}

export interface GameConfig {
  numTeams: number;
  teams: TeamConfig[];
  gameStarted: boolean;
}

export interface TeamPosition {
  teamId: number;
  position: number;
}

export interface PendingApproval {
  teamId: number;
  teamName: string;
  teamColor: string;
  roll: number;
  fromPosition: number;
  questionId: string;
  questionTitle: string;
  questionDifficulty: string;
  questionLink: string;
  timestamp: number;
}

export interface TeamDiceState {
  teamId: number;
  diceUnlocked: boolean;
  waitingForApproval: boolean;
}

// ─── BOARD CONSTANTS ───────────────────────────────────────
export const SNAKES: Record<number, number> = { 99: 21, 90: 48, 79: 42, 68: 14, 56: 8, 47: 26, 35: 6, 17: 2 };
export const LADDERS: Record<number, number> = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 };

// 15 fully unique, visually distinct colors — one per team slot
export const TEAM_COLORS = [
  '#ff4d6d', // 1  vivid red-pink
  '#00c8ff', // 2  electric sky blue
  '#ffd700', // 3  gold
  '#b347ff', // 4  violet
  '#00ff88', // 5  neon green
  '#ff7300', // 6  bright orange
  '#00e5cc', // 7  teal cyan
  '#ff3cac', // 8  hot magenta
  '#39ff14', // 9  lime electric
  '#4fc3f7', // 10 light steel blue
  '#ffaa00', // 11 amber
  '#e040fb', // 12 orchid purple
  '#00bfa5', // 13 emerald teal
  '#ff6e6e', // 14 salmon coral
  '#c6ff00', // 15 yellow-green
];

// Penalty steps deducted when admin rejects (contestant didn't answer)
export const PENALTY_STEPS: Record<string, number> = {
  easy:   5,
  medium: 3,
  hard:   1,
};

// Reward steps added when admin approves (contestant answered correctly)
export const MOVE_STEPS: Record<string, number> = {
  easy:    2,
  medium:  5,
  hard:   10,
};

export const AVATARS = [
  '◆','▲','●','■','★','♦','⬟','⬡','⬢','◉',
  '⬛','○','△','□','☆',
];

// ─── BROADCAST ─────────────────────────────────────────────
export const BROADCAST_CHANNEL = 'snl_game';

// ─── STORAGE KEYS ──────────────────────────────────────────
export const STORAGE = {
  GAME_CONFIG:       'snl_game_config',
  TEAM_POSITIONS:    'snl_team_positions',
  PENDING_APPROVALS: 'snl_pending_approvals',
  DICE_STATES:       'snl_dice_states',
};

// ─── HELPERS ───────────────────────────────────────────────
export function saveGameConfig(cfg: GameConfig) {
  localStorage.setItem(STORAGE.GAME_CONFIG, JSON.stringify(cfg));
}
export function loadGameConfig(): GameConfig | null {
  try { return JSON.parse(localStorage.getItem(STORAGE.GAME_CONFIG) || 'null'); } catch { return null; }
}

export function saveTeamPositions(p: TeamPosition[]) {
  localStorage.setItem(STORAGE.TEAM_POSITIONS, JSON.stringify(p));
}
export function loadTeamPositions(): TeamPosition[] {
  try { return JSON.parse(localStorage.getItem(STORAGE.TEAM_POSITIONS) || '[]'); } catch { return []; }
}

export function savePendingApprovals(a: PendingApproval[]) {
  localStorage.setItem(STORAGE.PENDING_APPROVALS, JSON.stringify(a));
}
export function loadPendingApprovals(): PendingApproval[] {
  try { return JSON.parse(localStorage.getItem(STORAGE.PENDING_APPROVALS) || '[]'); } catch { return []; }
}

export function saveDiceStates(s: TeamDiceState[]) {
  localStorage.setItem(STORAGE.DICE_STATES, JSON.stringify(s));
}
export function loadDiceStates(): TeamDiceState[] {
  try { return JSON.parse(localStorage.getItem(STORAGE.DICE_STATES) || '[]'); } catch { return []; }
}

export function applySnakeOrLadder(pos: number): { pos: number; event: 'snake' | 'ladder' | null } {
  if (SNAKES[pos] !== undefined) return { pos: SNAKES[pos], event: 'snake' };
  if (LADDERS[pos] !== undefined) return { pos: LADDERS[pos], event: 'ladder' };
  return { pos, event: null };
}
