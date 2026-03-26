'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { generateBoardLayout, numberToPercentPosition, SnakeLadder } from '@/lib/gameUtils';

interface BoardProps {
  snakes: SnakeLadder[];
  ladders: SnakeLadder[];
  playerPositions: { color: string; position: number; index: number }[];
  onCellClick?: (cellNum: number, playerIndex: number) => void;
  activeSnake?: number | null;
  activeLadder?: number | null;
}

const CELL_PALETTE = [
  '#EF5350', '#42A5F5', '#66BB6A', '#FFEE58',
  '#FFA726', '#AB47BC', '#26C6DA', '#EC407A',
  '#FF7043', '#5C6BC0', '#9CCC65', '#FFCA28',
];

function getCellColor(num: number): string {
  const row = Math.floor((num - 1) / 10);
  const col = (num - 1) % 10;
  return CELL_PALETTE[(row * 3 + col * 2) % CELL_PALETTE.length];
}

function darkenColor(hex: string, f: number = 0.4): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * (1 - f))}, ${Math.floor(g * (1 - f))}, ${Math.floor(b * (1 - f))})`;
}

// Cartoon snake themes — like blue+pink reference image
const SNAKE_THEMES = [
  { body: '#6B9BD2', pattern: '#E040A0', outline: '#1A3A6B', belly: '#A0CCF0', eye: '#FFFFCC' },
  { body: '#4CAF50', pattern: '#2196F3', outline: '#1B5E20', belly: '#81C784', eye: '#FFFFCC' },
  { body: '#E57373', pattern: '#4CAF50', outline: '#B71C1C', belly: '#FFCDD2', eye: '#FFFFCC' },
  { body: '#7E57C2', pattern: '#FFB74D', outline: '#4527A0', belly: '#B39DDB', eye: '#FFFFCC' },
  { body: '#26C6DA', pattern: '#FF7043', outline: '#006064', belly: '#80DEEA', eye: '#FFFFCC' },
  { body: '#66BB6A', pattern: '#E91E63', outline: '#2E7D32', belly: '#A5D6A7', eye: '#FFFFCC' },
  { body: '#FFB74D', pattern: '#7B1FA2', outline: '#E65100', belly: '#FFE0B2', eye: '#FFFFCC' },
  { body: '#EF5350', pattern: '#42A5F5', outline: '#C62828', belly: '#EF9A9A', eye: '#FFFFCC' },
];

export default function Board({ snakes, ladders, playerPositions, onCellClick, activeSnake, activeLadder }: BoardProps) {
  const layout = generateBoardLayout();

  const playersByPosition: Record<number, { color: string; index: number }[]> = {};
  playerPositions.forEach((p) => {
    if (p.position > 0) {
      if (!playersByPosition[p.position]) playersByPosition[p.position] = [];
      playersByPosition[p.position].push({ color: p.color, index: p.index });
    }
  });

  return (
    <div id="game-board" style={{ position: 'relative', width: '100%' }}>
      <div className="board-container" style={{ width: '100%' }}>
        {layout.flat().map((num) => {
          const playersHere = playersByPosition[num] || [];
          const bgColor = getCellColor(num);
          const label = num === 1 ? 'START' : String(num);
          return (
            <div key={num} className="board-cell"
              style={{
                backgroundColor: bgColor,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 -2px 0 rgba(0,0,0,0.08)',
              }}>
              <span className="cell-number">{label}</span>
              {playersHere.length > 0 && (
                <div className="pawns-container">
                  {playersHere.map((p) => {
                    const size = playersHere.length > 4 ? 18 : playersHere.length > 2 ? 24 : 30;
                    const dark = darkenColor(p.color, 0.4);
                    const darker = darkenColor(p.color, 0.6);
                    return (
                      <motion.svg key={p.index} width={size} height={size + 4} viewBox="0 0 24 28"
                        style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.65))', cursor: onCellClick ? 'pointer' : 'default' }}
                        whileHover={{ scale: 1.2, y: -2 }} whileTap={{ scale: 0.9 }}
                        onClick={() => onCellClick?.(num, p.index)}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                        <ellipse cx="12" cy="25" rx="9" ry="3" fill={darker} />
                        <ellipse cx="12" cy="24" rx="10" ry="3" fill={dark} />
                        <path d="M6,23 Q5,17 7,13 Q8,11 12,7 Q16,11 17,13 Q19,17 18,23 Z" fill={dark} />
                        <path d="M9,23 Q8,17 10,13 Q11,11 12,8 Q13,11 14,13 Q15,15 14,23 Z" fill={p.color} opacity="0.25" />
                        <rect x="10" y="5" width="4" height="4" rx="1" fill={dark} />
                        <circle cx="12" cy="4.5" r="4.5" fill={dark} />
                        <circle cx="10.5" cy="3" r="1.5" fill={p.color} opacity="0.2" />
                        <text x="12" y="17" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold"
                          style={{ fontFamily: 'Luckiest Guy' }}>{p.index + 1}</text>
                      </motion.svg>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SVG overlay for snakes and ladders */}
      <svg className="board-overlay" viewBox="0 0 100 100">
        <defs>
          {/* Glossy shine gradient for snake bodies */}
          <linearGradient id="snakeShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.35" />
            <stop offset="50%" stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="black" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Ladders */}
        {ladders.map((ladder, i) => {
          const from = numberToPercentPosition(ladder.start);
          const to = numberToPercentPosition(ladder.end);
          const dx = to.x - from.x, dy = to.y - from.y;
          const angle = Math.atan2(dy, dx);
          const px = Math.cos(angle + Math.PI / 2) * 2.2;
          const py = Math.sin(angle + Math.PI / 2) * 2.2;
          const len = Math.sqrt(dx * dx + dy * dy);
          const rungs = Math.max(3, Math.floor(len / 7));
          const isActive = activeLadder === i;
          return (
            <g key={`ladder-${i}`} opacity={isActive ? 1 : 0.88}
              style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.8))' } : {}}>
              <line x1={from.x+px+0.5} y1={from.y+py+0.7} x2={to.x+px+0.5} y2={to.y+py+0.7} stroke="rgba(0,0,0,0.2)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1={from.x-px+0.5} y1={from.y-py+0.7} x2={to.x-px+0.5} y2={to.y-py+0.7} stroke="rgba(0,0,0,0.2)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1={from.x+px} y1={from.y+py} x2={to.x+px} y2={to.y+py} stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
              <line x1={from.x+px*0.6} y1={from.y+py*0.6} x2={to.x+px*0.6} y2={to.y+py*0.6} stroke="#8D6E63" strokeWidth="0.8" strokeLinecap="round" />
              <line x1={from.x-px} y1={from.y-py} x2={to.x-px} y2={to.y-py} stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
              <line x1={from.x-px*0.6} y1={from.y-py*0.6} x2={to.x-px*0.6} y2={to.y-py*0.6} stroke="#8D6E63" strokeWidth="0.8" strokeLinecap="round" />
              {Array.from({ length: rungs }).map((_, j) => {
                const t = (j + 1) / (rungs + 1);
                const rx = from.x + dx*t, ry = from.y + dy*t;
                return (
                  <g key={j}>
                    <line x1={rx+px+0.2} y1={ry+py+0.3} x2={rx-px+0.2} y2={ry-py+0.3} stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1={rx+px} y1={ry+py} x2={rx-px} y2={ry-py} stroke="#795548" strokeWidth="1" strokeLinecap="round" />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Cartoon Snakes — detailed face like reference blue/pink snake */}
        {snakes.map((snake, i) => {
          const from = numberToPercentPosition(snake.start);
          const to = numberToPercentPosition(snake.end);
          const dx = to.x - from.x, dy = to.y - from.y;
          const midX = (from.x + to.x) / 2, midY = (from.y + to.y) / 2;
          const offset = (i % 2 === 0 ? 1 : -1) * (8 + (i % 3) * 3);
          const pathD = `M${from.x},${from.y} C${from.x + dx*0.25 + offset},${from.y + dy*0.25} ${midX - offset*0.8},${midY} ${midX},${midY} S${from.x + dx*0.75 + offset*0.6},${from.y + dy*0.75} ${to.x},${to.y}`;

          const th = SNAKE_THEMES[i % SNAKE_THEMES.length];
          const isActive = activeSnake === i;
          const hx = from.x, hy = from.y; // head center

          // Direction the snake faces (away from body)
          const bodyDx = (from.x + dx*0.15 + offset*0.3) - from.x;
          const bodyDy = (from.y + dy*0.15) - from.y;
          const bodyAngle = Math.atan2(bodyDy, bodyDx);
          const faceAngle = bodyAngle + Math.PI; // face away from body
          const faceCos = Math.cos(faceAngle);
          const faceSin = Math.sin(faceAngle);

          return (
            <g key={`snake-${i}`}
              style={isActive ? { filter: 'drop-shadow(0 0 10px rgba(255,50,50,0.8))' } : { filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.3))' }}>

              {/* BODY — thick outline */}
              <path d={pathD} fill="none" stroke={th.outline} strokeWidth={isActive ? 8 : 7}
                strokeLinecap="round" strokeLinejoin="round" />
              {/* Main body color */}
              <path d={pathD} fill="none" stroke={th.body} strokeWidth={isActive ? 6.5 : 5.5}
                strokeLinecap="round" strokeLinejoin="round" />
              {/* Diamond/triangle pattern markings */}
              <path d={pathD} fill="none" stroke={th.pattern} strokeWidth="3.5"
                strokeLinecap="round" strokeDasharray="2 4.5" opacity="0.7" />
              {/* Secondary pattern offset */}
              <path d={pathD} fill="none" stroke={th.pattern} strokeWidth="1.5"
                strokeLinecap="round" strokeDasharray="1 6" strokeDashoffset="3" opacity="0.4" />
              {/* Belly highlight */}
              <path d={pathD} fill="none" stroke={th.belly} strokeWidth="2"
                strokeLinecap="round" opacity="0.35" />
              {/* Glossy shine line */}
              <path d={pathD} fill="none" stroke="white" strokeWidth="0.8"
                strokeLinecap="round" opacity="0.2" strokeDasharray="1.5 7" strokeDashoffset="1" />

              {/* === HEAD — Detailed cartoon snake face === */}
              {/* Head shape - slightly elongated oval tilted toward face direction */}
              <ellipse cx={hx + faceCos*0.5} cy={hy + faceSin*0.5} rx="3.8" ry="3.2"
                fill={th.body} stroke={th.outline} strokeWidth="0.7"
                transform={`rotate(${faceAngle * 180 / Math.PI}, ${hx + faceCos*0.5}, ${hy + faceSin*0.5})`} />
              {/* Head highlight/shading */}
              <ellipse cx={hx + faceCos*0.5 - 0.5} cy={hy + faceSin*0.5 - 0.7} rx="2.2" ry="1.5"
                fill={th.belly} opacity="0.3"
                transform={`rotate(${faceAngle * 180 / Math.PI}, ${hx + faceCos*0.5 - 0.5}, ${hy + faceSin*0.5 - 0.7})`} />
              {/* Head pattern marking */}
              <ellipse cx={hx - faceCos*0.5} cy={hy - faceSin*0.5} rx="1.8" ry="1.2"
                fill={th.pattern} opacity="0.5"
                transform={`rotate(${faceAngle * 180 / Math.PI}, ${hx - faceCos*0.5}, ${hy - faceSin*0.5})`} />

              {/* EYES — Large cartoon eyes like reference */}
              {/* Left eye white */}
              <ellipse cx={hx + faceCos*1.5 + faceSin*1.5} cy={hy + faceSin*1.5 - faceCos*1.5}
                rx="1.4" ry="1.6" fill={th.eye} stroke={th.outline} strokeWidth="0.25" />
              {/* Left pupil — slit */}
              <ellipse cx={hx + faceCos*1.8 + faceSin*1.5} cy={hy + faceSin*1.8 - faceCos*1.5}
                rx="0.35" ry="0.9" fill="#111" />
              {/* Left eye shine */}
              <circle cx={hx + faceCos*1.3 + faceSin*1.7} cy={hy + faceSin*1.3 - faceCos*1.7}
                r="0.35" fill="white" />

              {/* Right eye white */}
              <ellipse cx={hx + faceCos*1.5 - faceSin*1.5} cy={hy + faceSin*1.5 + faceCos*1.5}
                rx="1.4" ry="1.6" fill={th.eye} stroke={th.outline} strokeWidth="0.25" />
              {/* Right pupil — slit */}
              <ellipse cx={hx + faceCos*1.8 - faceSin*1.5} cy={hy + faceSin*1.8 + faceCos*1.5}
                rx="0.35" ry="0.9" fill="#111" />
              {/* Right eye shine */}
              <circle cx={hx + faceCos*1.3 - faceSin*1.7} cy={hy + faceSin*1.3 + faceCos*1.7}
                r="0.35" fill="white" />

              {/* Nostrils */}
              <circle cx={hx + faceCos*3 + faceSin*0.5} cy={hy + faceSin*3 - faceCos*0.5}
                r="0.3" fill={th.outline} />
              <circle cx={hx + faceCos*3 - faceSin*0.5} cy={hy + faceSin*3 + faceCos*0.5}
                r="0.3" fill={th.outline} />

              {/* Mouth line */}
              <path d={`M${hx + faceCos*3.5 + faceSin*1.2},${hy + faceSin*3.5 - faceCos*1.2} Q${hx + faceCos*4},${hy + faceSin*4} ${hx + faceCos*3.5 - faceSin*1.2},${hy + faceSin*3.5 + faceCos*1.2}`}
                fill="none" stroke={th.outline} strokeWidth="0.35" strokeLinecap="round" />

              {/* Fangs */}
              <path d={`M${hx + faceCos*3.2 + faceSin*0.7},${hy + faceSin*3.2 - faceCos*0.7} L${hx + faceCos*4.5 + faceSin*0.5},${hy + faceSin*4.5 - faceCos*0.5} L${hx + faceCos*3.5 + faceSin*0.2},${hy + faceSin*3.5 - faceCos*0.2}`}
                fill="white" stroke={th.outline} strokeWidth="0.15" />
              <path d={`M${hx + faceCos*3.2 - faceSin*0.7},${hy + faceSin*3.2 + faceCos*0.7} L${hx + faceCos*4.5 - faceSin*0.5},${hy + faceSin*4.5 + faceCos*0.5} L${hx + faceCos*3.5 - faceSin*0.2},${hy + faceSin*3.5 + faceCos*0.2}`}
                fill="white" stroke={th.outline} strokeWidth="0.15" />

              {/* Forked tongue */}
              <path d={`M${hx + faceCos*4},${hy + faceSin*4} Q${hx + faceCos*5.5},${hy + faceSin*5.5} ${hx + faceCos*6 + faceSin*0.8},${hy + faceSin*6 - faceCos*0.8}`}
                stroke="#E53935" strokeWidth="0.3" fill="none" strokeLinecap="round" />
              <path d={`M${hx + faceCos*5.5},${hy + faceSin*5.5} Q${hx + faceCos*5.8 - faceSin*0.3},${hy + faceSin*5.8 + faceCos*0.3} ${hx + faceCos*6 - faceSin*0.8},${hy + faceSin*6 + faceCos*0.8}`}
                stroke="#E53935" strokeWidth="0.3" fill="none" strokeLinecap="round" />

              {/* === TAIL — Tapered with curl === */}
              <circle cx={to.x} cy={to.y} r="1.2" fill={th.body} stroke={th.outline} strokeWidth="0.4" />
              <circle cx={to.x + 0.8} cy={to.y + 0.8} r="0.5" fill={th.body} stroke={th.outline} strokeWidth="0.25" />
              <circle cx={to.x + 1.2} cy={to.y + 1.2} r="0.25" fill={th.body} stroke={th.outline} strokeWidth="0.15" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
