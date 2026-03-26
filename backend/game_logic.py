import random
from models import SnakeLadder

# Distinct pawn colors for up to 20 players
PLAYER_COLORS = [
    "#FF6B6B",  # Red
    "#4ECDC4",  # Teal
    "#FFE66D",  # Yellow
    "#A855F7",  # Purple
    "#FF8C42",  # Orange
    "#06D6A0",  # Green
    "#118AB2",  # Blue
    "#EF476F",  # Pink
    "#073B4C",  # Dark Blue
    "#F4A261",  # Sandy
    "#E76F51",  # Coral
    "#2A9D8F",  # Turquoise
    "#E9C46A",  # Gold
    "#264653",  # Charcoal
    "#D62828",  # Crimson
    "#003049",  # Navy
    "#FCBF49",  # Amber
    "#90BE6D",  # Sage
    "#F94144",  # Scarlet
    "#577590",  # Steel Blue
]

PLAYER_NAMES = [
    "Player 1", "Player 2", "Player 3", "Player 4", "Player 5",
    "Player 6", "Player 7", "Player 8", "Player 9", "Player 10",
    "Player 11", "Player 12", "Player 13", "Player 14", "Player 15",
    "Player 16", "Player 17", "Player 18", "Player 19", "Player 20",
]


def generate_snakes_and_ladders() -> tuple[list[SnakeLadder], list[SnakeLadder]]:
    """Generate random snake and ladder positions for the board."""
    occupied = set()
    snakes = []
    ladders = []

    # Generate 8 snakes (head at higher position, tail at lower)
    snake_count = 0
    attempts = 0
    while snake_count < 8 and attempts < 100:
        attempts += 1
        head = random.randint(20, 99)  # Snake heads between 20-99
        tail = random.randint(2, head - 5)  # Tail must be significantly lower
        if head not in occupied and tail not in occupied and head != 100 and tail != 1:
            snakes.append(SnakeLadder(start=head, end=tail))
            occupied.add(head)
            occupied.add(tail)
            snake_count += 1

    # Generate 8 ladders (bottom at lower position, top at higher)
    ladder_count = 0
    attempts = 0
    while ladder_count < 8 and attempts < 100:
        attempts += 1
        bottom = random.randint(2, 80)  # Ladder bottoms between 2-80
        top = random.randint(bottom + 5, min(bottom + 40, 99))  # Top must be higher
        if bottom not in occupied and top not in occupied and top != 100 and bottom != 1:
            ladders.append(SnakeLadder(start=bottom, end=top))
            occupied.add(bottom)
            occupied.add(top)
            ladder_count += 1

    return snakes, ladders


def roll_dice() -> int:
    """Roll a 6-sided dice."""
    return random.randint(1, 6)


def apply_move(
    position: int,
    dice_value: int,
    snakes: list[SnakeLadder],
    ladders: list[SnakeLadder],
) -> tuple[int, int, bool, bool, SnakeLadder | None]:
    """
    Apply a dice move to a player's position.
    Returns: (new_position, final_position, hit_snake, hit_ladder, snake_or_ladder)
    """
    new_position = position + dice_value

    # Can't go beyond 100
    if new_position > 100:
        return position, position, False, False, None

    final_position = new_position
    hit_snake = False
    hit_ladder = False
    snake_or_ladder = None

    # Check snakes
    for snake in snakes:
        if new_position == snake.start:
            final_position = snake.end
            hit_snake = True
            snake_or_ladder = snake
            break

    # Check ladders
    if not hit_snake:
        for ladder in ladders:
            if new_position == ladder.start:
                final_position = ladder.end
                hit_ladder = True
                snake_or_ladder = ladder
                break

    return new_position, final_position, hit_snake, hit_ladder, snake_or_ladder
