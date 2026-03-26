from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class GameCreate(BaseModel):
    num_players: int = Field(..., ge=1, le=20, description="Number of players (1-20)")


class SnakeLadder(BaseModel):
    start: int
    end: int


class PlayerState(BaseModel):
    id: Optional[str] = None
    game_id: Optional[str] = None
    player_index: int
    name: str
    color: str
    position: int = 0
    has_won: bool = False


class GameState(BaseModel):
    id: Optional[str] = None
    num_players: int
    current_turn: int = 0
    snakes: list[SnakeLadder] = []
    ladders: list[SnakeLadder] = []
    status: str = "active"
    created_at: Optional[str] = None
    players: list[PlayerState] = []


class MoveRequest(BaseModel):
    player_index: int


class MoveResponse(BaseModel):
    dice_value: int
    player_index: int
    old_position: int
    new_position: int
    final_position: int
    hit_snake: bool = False
    hit_ladder: bool = False
    snake_or_ladder: Optional[SnakeLadder] = None
    has_won: bool = False
    next_turn: int
