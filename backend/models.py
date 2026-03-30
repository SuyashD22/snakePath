from pydantic import BaseModel
from typing import List, Optional

class TeamConfig(BaseModel):
    id: Optional[int] = None
    name: str
    password: str
    color: str
    avatar: str
    position: int = 0
    diceUnlocked: bool = True
    waitingForApproval: bool = False

class GameSetup(BaseModel):
    numTeams: int
    teams: List[TeamConfig]
    gameStarted: bool = True

class PendingApproval(BaseModel):
    id: Optional[int] = None
    teamId: int
    teamName: str
    teamColor: str
    roll: int
    fromPosition: int
    questionId: Optional[str] = None
    questionTitle: Optional[str] = None
    questionDifficulty: Optional[str] = None
    questionLink: Optional[str] = None
    timestamp: int

class GameState(BaseModel):
    numTeams: int
    gameStarted: bool
    teams: List[TeamConfig]
    pendingApprovals: List[PendingApproval]

class RollSubmit(BaseModel):
    teamId: int
    teamName: str
    teamColor: str
    roll: int
    fromPosition: int
    questionId: Optional[str] = None
    questionTitle: Optional[str] = None
    questionDifficulty: Optional[str] = None
    questionLink: Optional[str] = None
    timestamp: int

class VerdictRequest(BaseModel):
    teamId: int
    newPos: int
