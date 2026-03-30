// ─── SHARED TYPES ──────────────────────────────────────────
export interface TeamConfig {
  id: number;
  name: string;
  password: string;
  color: string;
  avatar: string;
  position?: number;
  diceUnlocked?: boolean;
  waitingForApproval?: boolean;
}

export interface GameConfig {
  numTeams: number;
  teams: TeamConfig[];
  gameStarted: boolean;
}

// Full game state as returned by backend
export interface GameState {
  numTeams: number;
  gameStarted: boolean;
  teams: TeamConfig[];
  pendingApprovals: PendingApproval[];
}

export interface PendingApproval {
  id?: number;
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

// ─── BOARD CONSTANTS ───────────────────────────────────────
export const SNAKES: Record<number, number> = { 99: 21, 90: 48, 79: 42, 68: 14, 56: 8, 47: 26, 35: 6, 17: 2 };
export const LADDERS: Record<number, number> = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 };

// 15 fully unique, visually distinct colors
export const TEAM_COLORS = [
  '#ff4d6d', '#00c8ff', '#ffd700', '#b347ff', '#00ff88',
  '#ff7300', '#00e5cc', '#ff3cac', '#39ff14', '#4fc3f7',
  '#ffaa00', '#e040fb', '#00bfa5', '#ff6e6e', '#c6ff00',
];

export const PENALTY_STEPS: Record<string, number> = { easy: 5, medium: 3, hard: 1 };
export const MOVE_STEPS: Record<string, number> = { easy: 2, medium: 5, hard: 10 };

export const AVATARS = [
  '◆','▲','●','■','★','♦','⬟','⬡','⬢','◉','⬛','○','△','□','☆',
];

// ─── BROADCAST & API ───────────────────────────────────────
export const BROADCAST_CHANNEL = 'snl_game';
const BACKEND_URL = 'http://localhost:8000/api';

// Signal to other tabs that the DB was updated
export function broadcastUpdate() {
  const channel = new BroadcastChannel(BROADCAST_CHANNEL);
  channel.postMessage({ type: 'DB_UPDATED' });
  channel.close();
}

// Read full state from DB
export async function fetchGameState(): Promise<GameState | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/state`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Write API wrappers
export async function setupGameDB(numTeams: number, teams: TeamConfig[]) {
  await fetch(`${BACKEND_URL}/admin/setup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numTeams, teams, gameStarted: true })
  });
  broadcastUpdate();
}

export async function resetGameDB() {
  await fetch(`${BACKEND_URL}/admin/reset`, { method: 'POST' });
  broadcastUpdate();
}

export async function submitRollDB(rollPayload: any) {
  await fetch(`${BACKEND_URL}/team/roll`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rollPayload)
  });
  broadcastUpdate();
}

export async function approveRollDB(teamId: number, newPos: number) {
  await fetch(`${BACKEND_URL}/admin/verdict`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, newPos })
  });
  broadcastUpdate();
}

export function applySnakeOrLadder(pos: number): { pos: number; event: 'snake' | 'ladder' | null } {
  if (SNAKES[pos] !== undefined) return { pos: SNAKES[pos], event: 'snake' };
  if (LADDERS[pos] !== undefined) return { pos: LADDERS[pos], event: 'ladder' };
  return { pos, event: null };
}
