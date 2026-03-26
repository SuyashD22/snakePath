'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Board from '@/components/Board';
import Dice from '@/components/Dice';
import GameInfo from '@/components/GameInfo';
import {
  generateSnakesAndLadders,
  PLAYER_COLORS,
  SnakeLadder,
} from '@/lib/gameUtils';
import {
  playMoveSound,
  playSnakeSound,
  playLadderSound,
  playWinSound,
} from '@/lib/sounds';

interface Player {
  name: string;
  color: string;
  position: number;
  hasWon: boolean;
  index: number;
}

function PlayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const numPlayers = parseInt(searchParams.get('players') || '2', 10);

  const [players, setPlayers] = useState<Player[]>([]);
  const [snakes, setSnakes] = useState<SnakeLadder[]>([]);
  const [ladders, setLadders] = useState<SnakeLadder[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('active');
  const [message, setMessage] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [activeSnake, setActiveSnake] = useState<number | null>(null);
  const [activeLadder, setActiveLadder] = useState<number | null>(null);

  useEffect(() => {
    if (initialized) return;
    const validNum = Math.min(20, Math.max(1, numPlayers));
    const { snakes: s, ladders: l } = generateSnakesAndLadders();
    setSnakes(s);
    setLadders(l);
    const newPlayers: Player[] = [];
    for (let i = 0; i < validNum; i++) {
      newPlayers.push({
        name: `Player ${i + 1}`,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        position: 0, hasWon: false, index: i,
      });
    }
    setPlayers(newPlayers);
    setMessage(`${newPlayers[0].name}'s turn`);
    setInitialized(true);
  }, [numPlayers, initialized]);

  const addLog = useCallback((entry: string) => {
    setGameLog(prev => [...prev, entry]);
  }, []);

  const movePlayerBack = useCallback((playerIndex: number) => {
    if (gameStatus !== 'active' || isAnimating) return;
    setPlayers(prev => {
      const updated = [...prev];
      const p = updated[playerIndex];
      if (p.position <= 0) return prev;
      const newPos = p.position - 1;
      if (newPos === 0) {
        addLog(`${p.name} → Start`);
        updated[playerIndex] = { ...p, position: 0 };
        return updated;
      }
      for (const snake of snakes) {
        if (newPos === snake.start) {
          addLog(`${p.name} ← ${newPos}, snake! → ${snake.end}`);
          updated[playerIndex] = { ...p, position: snake.end };
          return updated;
        }
      }
      for (const ladder of ladders) {
        if (newPos === ladder.start) {
          addLog(`${p.name} ← ${newPos}, ladder! → ${ladder.end}`);
          updated[playerIndex] = { ...p, position: ladder.end };
          return updated;
        }
      }
      addLog(`${p.name} ← ${newPos}`);
      updated[playerIndex] = { ...p, position: newPos };
      return updated;
    });
  }, [gameStatus, isAnimating, snakes, ladders, addLog]);

  const advanceToNextTurn = useCallback((current: number) => {
    let next = (current + 1) % players.length;
    let attempts = 0;
    while (players[next]?.hasWon && attempts < players.length) {
      next = (next + 1) % players.length; attempts++;
    }
    setCurrentTurn(next);
    setMessage(`${players[next]?.name}'s turn`);
  }, [players]);

  const handleDiceRoll = useCallback((value: number) => {
    if (gameStatus !== 'active' || isAnimating) return;
    setLastRoll(value);
    setIsAnimating(true);
    const player = players[currentTurn];
    const newPosition = player.position + value;
    addLog(`${player.name} rolled ${value}!`);

    if (newPosition > 100) {
      setMessage(`${player.name} needs exact number!`);
      addLog(`Can't move past 100!`);
      setTimeout(() => { advanceToNextTurn(currentTurn); setIsAnimating(false); }, 1000);
      return;
    }

    setTimeout(() => {
      playMoveSound();
      const updatedPlayers = [...players];
      updatedPlayers[currentTurn] = { ...player, position: newPosition };
      setPlayers(updatedPlayers);

      setTimeout(() => {
        let finalPosition = newPosition;
        let hitSnake = false, hitLadder = false;

        for (let si = 0; si < snakes.length; si++) {
          if (newPosition === snakes[si].start) {
            finalPosition = snakes[si].end; hitSnake = true;
            setActiveSnake(si); break;
          }
        }
        if (!hitSnake) {
          for (let li = 0; li < ladders.length; li++) {
            if (newPosition === ladders[li].start) {
              finalPosition = ladders[li].end; hitLadder = true;
              setActiveLadder(li); break;
            }
          }
        }

        if (hitSnake) {
          playSnakeSound();
          setMessage(`${player.name} bit by snake!`);
          addLog(`Snake! ${newPosition} → ${finalPosition}`);
          setTimeout(() => {
            const up = [...updatedPlayers];
            up[currentTurn] = { ...up[currentTurn], position: finalPosition };
            setPlayers(up);
            setActiveSnake(null);
          }, 800);
        } else if (hitLadder) {
          playLadderSound();
          setMessage(`${player.name} climbed ladder!`);
          addLog(`Ladder! ${newPosition} → ${finalPosition}`);
          setTimeout(() => {
            const up = [...updatedPlayers];
            up[currentTurn] = { ...up[currentTurn], position: finalPosition };
            setPlayers(up);
            setActiveLadder(null);
          }, 800);
        } else {
          setMessage(`${player.name} → ${newPosition}`);
        }

        if (finalPosition === 100) {
          setTimeout(() => {
            playWinSound();
            const up2 = [...updatedPlayers];
            up2[currentTurn] = { ...up2[currentTurn], position: finalPosition, hasWon: true };
            setPlayers(up2);
            setGameStatus('finished');
            setWinner(player.name);
            addLog(`${player.name} WINS!`);
            setIsAnimating(false);
          }, hitSnake || hitLadder ? 1200 : 500);
          return;
        }

        setTimeout(() => {
          advanceToNextTurn(currentTurn);
          setIsAnimating(false);
        }, hitSnake || hitLadder ? 1400 : 700);
      }, 500);
    }, 300);
  }, [players, currentTurn, snakes, ladders, gameStatus, isAnimating, addLog, advanceToNextTurn]);

  const handleNewGame = () => router.push('/');
  const handleRestart = () => {
    setInitialized(false); setCurrentTurn(0); setLastRoll(null);
    setGameStatus('active'); setMessage(''); setWinner(null);
    setIsAnimating(false); setGameLog([]);
    setActiveSnake(null); setActiveLadder(null);
  };

  if (!initialized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="play-page">
      {/* Layout: 18% | Board (fills rest) | 18% — wider panels */}
      <div style={{
        display: 'flex', gap: '8px', flex: 1, width: '100%',
        alignItems: 'stretch', minHeight: 0,
      }}>
        {/* LEFT: Players — 18% */}
        <div className="game-panel" style={{
          width: '18%', minWidth: '150px', maxWidth: '220px',
          flexShrink: 0, display: 'flex', flexDirection: 'column',
          overflowY: 'auto', padding: '16px 12px',
        }}>
          <p className="panel-title">Players</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
            {players.map((player) => (
              <div key={player.index}
                className={`player-indicator ${player.index === currentTurn && gameStatus === 'active' ? 'active' : ''}`}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '6px', background: player.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '0.55rem', color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0,
                }}>P{player.index + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--text-light)' }}>
                    {player.name}{player.hasWon && ' 🏆'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: player.color }}>
                    {player.position || 'Start'}
                  </div>
                </div>
                {player.position > 0 && gameStatus === 'active' && (
                  <button onClick={() => movePlayerBack(player.index)}
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '5px', color: 'var(--text-cream)', cursor: 'pointer', padding: '3px 7px', fontSize: '0.7rem', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                    ←
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Board — fills remaining space */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0,
        }}>
          <div style={{
            width: '100%',
            maxHeight: 'calc(100vh - 20px)',
            aspectRatio: '1',
            maxWidth: 'calc(100vh - 20px)',
          }}>
            <Board snakes={snakes} ladders={ladders}
              activeSnake={activeSnake} activeLadder={activeLadder}
              playerPositions={players.map(p => ({ color: p.color, position: p.position, index: p.index }))}
              onCellClick={(cellNum, playerIndex) => {
                const player = players[playerIndex];
                if (player && player.position === cellNum && player.position > 0 && gameStatus === 'active') {
                  movePlayerBack(playerIndex);
                }
              }}
            />
          </div>
        </div>

        {/* RIGHT: Dice + Info — 18% */}
        <div style={{
          width: '18%', minWidth: '160px', maxWidth: '220px',
          flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <div className="game-panel" style={{ padding: '16px 12px', textAlign: 'center', flexShrink: 0 }}>
            <p className="panel-title">Roll Dice</p>
            <Dice onRoll={handleDiceRoll}
              disabled={gameStatus !== 'active' || isAnimating} />
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <GameInfo players={players} currentTurn={currentTurn} lastRoll={lastRoll}
              gameStatus={gameStatus} message={message} winner={winner} gameLog={gameLog} />
          </div>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexShrink: 0, paddingBottom: '4px' }}>
            <motion.button className="btn-wood" onClick={handleRestart} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Restart</motion.button>
            <motion.button className="btn-wood" onClick={handleNewGame} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Home</motion.button>
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div className="winner-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWinner(null)}>
            <motion.div className="winner-card" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏆</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', marginBottom: '8px' }}>{winner} Wins!</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-cream)', marginBottom: '16px' }}>DSA Edition conquered!</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <motion.button className="btn-primary" onClick={handleRestart} whileHover={{ scale: 1.05 }}
                  style={{ fontSize: '1rem', padding: '8px 20px' }}>Play Again</motion.button>
                <motion.button className="btn-wood" onClick={handleNewGame} whileHover={{ scale: 1.05 }}>Home</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)' }}>Loading...</p>
      </div>
    }>
      <PlayContent />
    </Suspense>
  );
}
