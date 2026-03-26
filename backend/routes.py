import uuid
from fastapi import APIRouter, HTTPException
from models import GameCreate, GameState, PlayerState, MoveRequest, MoveResponse, SnakeLadder
from game_logic import (
    generate_snakes_and_ladders,
    roll_dice,
    apply_move,
    PLAYER_COLORS,
    PLAYER_NAMES,
)
from database import get_supabase, is_db_available

router = APIRouter(prefix="/api")

# In-memory game store (used when Supabase is not configured)
games_store: dict[str, GameState] = {}


def _save_game_to_db(game: GameState):
    """Persist game state to Supabase if available."""
    db = get_supabase()
    if not db:
        return

    game_data = {
        "id": game.id,
        "num_players": game.num_players,
        "current_turn": game.current_turn,
        "snakes": [s.model_dump() for s in game.snakes],
        "ladders": [l.model_dump() for l in game.ladders],
        "status": game.status,
    }

    try:
        db.table("games").upsert(game_data).execute()

        for player in game.players:
            player_data = {
                "id": player.id,
                "game_id": game.id,
                "player_index": player.player_index,
                "name": player.name,
                "color": player.color,
                "position": player.position,
                "has_won": player.has_won,
            }
            db.table("players").upsert(player_data).execute()
    except Exception as e:
        print(f"DB save error (falling back to memory): {e}")


@router.post("/games", response_model=GameState)
async def create_game(game_input: GameCreate):
    """Create a new game session with generated snakes and ladders."""
    game_id = str(uuid.uuid4())
    snakes, ladders = generate_snakes_and_ladders()

    players = []
    for i in range(game_input.num_players):
        player = PlayerState(
            id=str(uuid.uuid4()),
            game_id=game_id,
            player_index=i,
            name=PLAYER_NAMES[i],
            color=PLAYER_COLORS[i % len(PLAYER_COLORS)],
            position=0,
            has_won=False,
        )
        players.append(player)

    game = GameState(
        id=game_id,
        num_players=game_input.num_players,
        current_turn=0,
        snakes=snakes,
        ladders=ladders,
        status="active",
        players=players,
    )

    # Store in memory
    games_store[game_id] = game

    # Also persist to DB if available
    _save_game_to_db(game)

    return game


@router.get("/games/{game_id}", response_model=GameState)
async def get_game(game_id: str):
    """Get the current state of a game."""
    game = games_store.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.post("/games/{game_id}/roll", response_model=MoveResponse)
async def roll_and_move(game_id: str, move: MoveRequest):
    """Roll dice for a player and apply the move."""
    game = games_store.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game.status != "active":
        raise HTTPException(status_code=400, detail="Game is not active")

    if move.player_index != game.current_turn:
        raise HTTPException(status_code=400, detail="Not this player's turn")

    player = game.players[move.player_index]
    if player.has_won:
        raise HTTPException(status_code=400, detail="Player has already won")

    dice_value = roll_dice()
    old_position = player.position

    new_position, final_position, hit_snake, hit_ladder, snake_or_ladder = apply_move(
        old_position, dice_value, game.snakes, game.ladders
    )

    player.position = final_position
    has_won = final_position == 100
    player.has_won = has_won

    if has_won:
        game.status = "finished"
    else:
        # Move to next player's turn (skip players who have won)
        next_turn = (game.current_turn + 1) % game.num_players
        attempts = 0
        while game.players[next_turn].has_won and attempts < game.num_players:
            next_turn = (next_turn + 1) % game.num_players
            attempts += 1
        game.current_turn = next_turn

    # Persist to DB
    _save_game_to_db(game)

    return MoveResponse(
        dice_value=dice_value,
        player_index=move.player_index,
        old_position=old_position,
        new_position=new_position,
        final_position=final_position,
        hit_snake=hit_snake,
        hit_ladder=hit_ladder,
        snake_or_ladder=snake_or_ladder,
        has_won=has_won,
        next_turn=game.current_turn,
    )


@router.get("/games/{game_id}/players", response_model=list[PlayerState])
async def get_players(game_id: str):
    """Get all players in a game."""
    game = games_store.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game.players
