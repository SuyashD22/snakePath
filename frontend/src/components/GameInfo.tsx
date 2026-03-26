'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GameInfoProps {
  players: {
    name: string;
    color: string;
    position: number;
    hasWon: boolean;
    index: number;
  }[];
  currentTurn: number;
  lastRoll: number | null;
  gameStatus: string;
  message: string;
  winner: string | null;
  gameLog: string[];
}

export default function GameInfo({
  players,
  currentTurn,
  lastRoll,
  gameStatus,
  message,
  winner,
  gameLog,
}: GameInfoProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Current Turn & Last Roll */}
      <div className="game-panel" style={{ padding: '12px 16px', textAlign: 'center' }}>
        {gameStatus === 'active' && (
          <motion.div
            key={currentTurn}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              color: 'var(--text-cream)',
              opacity: 0.8,
              marginBottom: '4px',
            }}>
              Current Turn
            </p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              color: players[currentTurn]?.color || 'white',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            }}>
              {players[currentTurn]?.name}
            </p>
          </motion.div>
        )}
        {lastRoll !== null && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            color: 'var(--text-cream)',
            opacity: 0.7,
            marginTop: '4px',
          }}>
            Game Info: {String(lastRoll).padStart(2, '0')}
          </p>
        )}
      </div>

      {/* Game Log */}
      <div className="game-panel" style={{ padding: '12px 16px' }}>
        <p className="panel-title" style={{ fontSize: '1rem', marginBottom: '8px' }}>
          Game Log
        </p>
        <div className="game-log">
          {gameLog.length === 0 && (
            <p style={{ opacity: 0.5, fontSize: '0.8rem', textAlign: 'center' }}>
              Roll the dice to start!
            </p>
          )}
          {gameLog.map((entry, i) => (
            <motion.div
              key={i}
              className="log-entry"
              initial={i === gameLog.length - 1 ? { opacity: 0, x: -10 } : {}}
              animate={{ opacity: 1, x: 0 }}
            >
              {entry}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
