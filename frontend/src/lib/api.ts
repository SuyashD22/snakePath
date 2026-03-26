const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface GameCreateRequest {
  num_players: number;
}

export async function createGame(numPlayers: number) {
  const res = await fetch(`${API_URL}/api/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num_players: numPlayers } as GameCreateRequest),
  });
  if (!res.ok) throw new Error('Failed to create game');
  return res.json();
}

export async function getGame(gameId: string) {
  const res = await fetch(`${API_URL}/api/games/${gameId}`);
  if (!res.ok) throw new Error('Failed to fetch game');
  return res.json();
}

export async function rollDice(gameId: string, playerIndex: number) {
  const res = await fetch(`${API_URL}/api/games/${gameId}/roll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_index: playerIndex }),
  });
  if (!res.ok) throw new Error('Failed to roll dice');
  return res.json();
}

export async function getPlayers(gameId: string) {
  const res = await fetch(`${API_URL}/api/games/${gameId}/players`);
  if (!res.ok) throw new Error('Failed to fetch players');
  return res.json();
}
