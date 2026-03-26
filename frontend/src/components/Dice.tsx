'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { playDiceRollSound } from '@/lib/sounds';

interface DiceProps {
  onRoll: (value: number) => void;
  disabled: boolean;
}

const DOT_POSITIONS: Record<number, number[]> = {
  1: [5],
  2: [3, 7],
  3: [3, 5, 7],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

export default function Dice({ onRoll, disabled }: DiceProps) {
  const [value, setValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = useCallback(() => {
    if (disabled || isRolling) return;
    setIsRolling(true);
    playDiceRollSound();

    let count = 0;
    const interval = setInterval(() => {
      setValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 12) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setValue(finalValue);
        setIsRolling(false);
        onRoll(finalValue);
      }
    }, 50);
  }, [disabled, isRolling, onRoll]);

  const dots = DOT_POSITIONS[value] || [];

  return (
    <div className="dice-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      {/* 3D Dice */}
      <div style={{ perspective: '400px' }}>
        <motion.div
          onClick={handleRoll}
          whileHover={!disabled && !isRolling ? { scale: 1.1, rotateY: 10 } : {}}
          whileTap={!disabled && !isRolling ? { scale: 0.88 } : {}}
          style={{
            width: '78px',
            height: '78px',
            background: 'linear-gradient(135deg, #FAFAFA 0%, #E8E8E8 50%, #D0D0D0 100%)',
            borderRadius: '14px',
            boxShadow: isRolling
              ? '0 2px 4px rgba(0,0,0,0.3)'
              : `
                0 7px 0 #999,
                0 8px 0 #888,
                0 10px 20px rgba(0,0,0,0.4),
                inset 0 1px 0 rgba(255,255,255,0.9),
                inset -1px 0 0 rgba(0,0,0,0.05),
                inset 0 -1px 0 rgba(0,0,0,0.1)
              `,
            cursor: disabled || isRolling ? 'not-allowed' : 'pointer',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            padding: '10px',
            gap: '1px',
            userSelect: 'none' as const,
            position: 'relative' as const,
            top: isRolling ? '5px' : '0px',
            opacity: disabled ? 0.4 : 1,
            transition: isRolling ? 'none' : 'all 0.15s ease',
            animation: isRolling ? 'diceRoll 0.5s ease-in-out' : 'none',
            border: '1px solid rgba(0,0,0,0.08)',
            transformStyle: 'preserve-3d' as const,
            transform: isRolling ? 'none' : 'rotateX(5deg) rotateY(-5deg)',
          }}
        >
          {Array.from({ length: 9 }, (_, i) => i + 1).map((pos) => (
            <div key={pos} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dots.includes(pos) && (
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #555, #111)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.35)',
                }} />
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ROLL button */}
      <motion.button
        className="btn-primary"
        onClick={handleRoll}
        disabled={disabled || isRolling}
        whileHover={!disabled && !isRolling ? { scale: 1.05 } : {}}
        whileTap={!disabled && !isRolling ? { scale: 0.95 } : {}}
        style={{ fontSize: '1.1rem', padding: '8px 32px' }}
      >
        {isRolling ? 'Rolling...' : 'ROLL'}
      </motion.button>
    </div>
  );
}
