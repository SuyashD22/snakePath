'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CircuitBackground from '@/components/CircuitBackground';
import {
  GameConfig, TeamConfig, GameState,
  SNAKES, LADDERS, TEAM_COLORS, BROADCAST_CHANNEL,
  fetchGameState, submitRollDB
} from '@/lib/gameStore';
import { getQuestionForPosition, Question } from '@/lib/questions';

// ─── BOARD CONSTANTS ──────────────────────────────────────
const CELL_SIZE = 52;
const BOARD_PX = CELL_SIZE * 10;
const SNAKE_COLORS = [
  { dark:'#082a14',base:'#1a5c2e',mid:'#2a8040',light:'#4ab860',belly:'#c8e8a0',scaleA:'#194a24',scaleB:'#38784a',spine:'#50c870' },
  { dark:'#3a0808',base:'#6a1818',mid:'#9a2828',light:'#c84848',belly:'#e8c0a0',scaleA:'#521010',scaleB:'#881e1e',spine:'#d05058' },
  { dark:'#081030',base:'#162878',mid:'#2a3cb0',light:'#3e58d8',belly:'#a0b8e8',scaleA:'#121e58',scaleB:'#2840a0',spine:'#5272e0' },
  { dark:'#2a1004',base:'#562a0c',mid:'#8a4818',light:'#bc6820',belly:'#e8d498',scaleA:'#401e08',scaleB:'#783a12',spine:'#c07830' },
  { dark:'#1e0830',base:'#44166a',mid:'#6e2898',light:'#9840c0',belly:'#d0a8e8',scaleA:'#361052',scaleB:'#602090',spine:'#aa58d0' },
  { dark:'#041e1a',base:'#185a48',mid:'#287a64',light:'#38a886',belly:'#a0e0cc',scaleA:'#0e4838',scaleB:'#267064',spine:'#48b898' },
  { dark:'#2a1000',base:'#602410',mid:'#8e4a1c',light:'#b8702c',belly:'#e8d498',scaleA:'#4a1a08',scaleB:'#7a3812',spine:'#c87838' },
  { dark:'#141e04',base:'#365514',mid:'#507a22',light:'#6ca032',belly:'#c8e8a0',scaleA:'#264410',scaleB:'#4a721e',spine:'#78ba3c' },
];
const AVATARS = ['◆','▲','●','■','★','♦','⬟','⬡','⬢','◉','⬛','○','△','□','☆','✦','◈','✧','⬘','◎','⊛','⊕','⊗','⊞','⊠'];

function cellToGrid(n: number): [number, number] {
  const row = Math.floor((n - 1) / 10);
  return [9 - row, row % 2 === 0 ? (n - 1) % 10 : 9 - (n - 1) % 10];
}
function cellToXY(n: number) {
  const [r, c] = cellToGrid(n);
  return { x: c * CELL_SIZE + CELL_SIZE / 2, y: r * CELL_SIZE + CELL_SIZE / 2 };
}

// ─── BOARD SVG ────────────────────────────────────────────
function BoardSVG({ players }: { players: { id: number; position: number; color: string; avatar: string; name: string }[] }) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const pressedSet = new Set(players.filter(p => p.position > 0).map(p => p.position));

  // Cells
  const cells: React.ReactNode[] = [];
  for (let n = 1; n <= 100; n++) {
    const [gr, gc] = cellToGrid(n);
    const x = gc * CELL_SIZE, y = gr * CELL_SIZE;
    const pad = 4, d = 4, x0 = x + pad, y0 = y + pad, cs = CELL_SIZE - pad * 2;
    const isSH = SNAKES[n] !== undefined, isLB = LADDERS[n] !== undefined, isLT = Object.values(LADDERS).includes(n);
    let fill = (gr + gc) % 2 === 0 ? 'rgba(14,18,24,0.72)' : 'rgba(10,13,18,0.65)';
    let stroke = 'rgba(30,100,255,0.55)', numColor = 'rgba(160,200,255,0.8)';
    let topFace = 'rgba(26,29,36,0.7)', rightFace = 'rgba(6,7,9,0.75)';
    if (isSH) { fill='rgba(21,6,8,0.75)'; stroke='rgba(255,60,80,0.65)'; numColor='rgba(255,110,130,1)'; topFace='rgba(34,10,12,0.7)'; rightFace='rgba(8,2,3,0.75)'; }
    else if (isLB) { fill='rgba(6,18,16,0.75)'; stroke='rgba(0,180,160,0.65)'; numColor='rgba(0,220,180,1)'; topFace='rgba(10,31,26,0.7)'; }
    else if (isLT) { fill='rgba(8,14,12,0.65)'; }
    const dep = n === hoveredCell || pressedSet.has(n);
    cells.push(
      <g key={n} onMouseEnter={() => setHoveredCell(n)} onMouseLeave={() => setHoveredCell(null)}>
        {!dep && <polygon points={`${x0},${y0} ${x0+d},${y0-d} ${x0+cs+d},${y0-d} ${x0+cs},${y0}`} fill={topFace} />}
        {!dep && <polygon points={`${x0+cs},${y0} ${x0+cs+d},${y0-d} ${x0+cs+d},${y0+cs-d} ${x0+cs},${y0+cs}`} fill={rightFace} />}
        <rect x={x0} y={y0} width={cs} height={cs} rx={2}
          fill={dep ? (isSH?'rgba(8,1,2,0.95)':isLB?'rgba(2,10,8,0.95)':'rgba(4,5,8,0.95)') : fill}
          stroke={stroke} strokeWidth={1}
          style={{ transformBox:'fill-box', transformOrigin:'center', transform:dep?'scale(0.84)':'scale(1)', transition:'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)' }} />
        {n!==1&&n!==100&&<text x={x0+cs/2} y={y0+cs/2} fontSize={12} fontFamily="'Space Grotesk'" fill={numColor} fontWeight="700" textAnchor="middle" dominantBaseline="central">{n}</text>}
        {n===100&&<text x={x0+cs/2} y={y0+cs/2} fontSize={9} fontFamily="'Space Grotesk'" fill="#4a9eff" textAnchor="middle" dominantBaseline="central" fontWeight="700">GOAL</text>}
        {n===1&&<text x={x0+cs/2} y={y0+cs/2} fontSize={9} fontFamily="'Space Grotesk'" fill="#4a9eff" textAnchor="middle" dominantBaseline="central">START</text>}
      </g>
    );
  }

  // Snakes (with reduced opacity so numbers show through)
  const snakeEls = Object.entries(SNAKES).map(([head, tail], i) => {
    const p1 = cellToXY(+head), p2 = cellToXY(tail);
    const dx=p2.x-p1.x, dy=p2.y-p1.y, len=Math.hypot(dx,dy), uy=dy/len;
    const s1=(i%2===0)?1:-1, s2=(i%3===0)?-1:1;
    const b1=Math.min(len*.38,50)*s1, b2=Math.min(len*.22,35)*s2;
    const c1x=p1.x+dx*.3+(-uy)*b1, c1y=p1.y+dy*.3+(dx/len)*b1;
    const c2x=p1.x+dx*.7+(-uy)*b2, c2y=p1.y+dy*.7+(dx/len)*b2;
    const path=`M${p1.x},${p1.y} C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
    const hdx=p1.x-c1x, hdy=p1.y-c1y, hdl=Math.hypot(hdx,hdy)||1;
    const hnx=hdx/hdl, hny=hdy/hdl, htx=-hny, hty=hnx;
    const tdx=p2.x-c2x, tdy=p2.y-c2y, tdl=Math.hypot(tdx,tdy)||1;
    const tnx=tdx/tdl, tny=tdy/tdl;
    const sc=SNAKE_COLORS[i%SNAKE_COLORS.length];
    const rot=Math.atan2(hny,hnx)*180/Math.PI;
    const tRot=Math.atan2(tny,tnx)*180/Math.PI;
    const tB={x:p1.x+hnx*14,y:p1.y+hny*14}, tT={x:p1.x+hnx*22,y:p1.y+hny*22};
    const fL={x:tT.x+htx*5-hnx*3,y:tT.y+hty*5-hny*3}, fR={x:tT.x-htx*5-hnx*3,y:tT.y-hty*5-hny*3};
    return (
      <g key={`s-${head}`} opacity={0.65}>
        <path d={path} fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth={28} strokeLinecap="round"/>
        <path d={path} fill="none" stroke={sc.dark} strokeWidth={22} strokeLinecap="round"/>
        <path d={path} fill="none" stroke={sc.base} strokeWidth={17} strokeLinecap="round"/>
        <path d={path} fill="none" stroke={sc.mid} strokeWidth={12} strokeLinecap="round" opacity={0.85}/>
        <path d={path} fill="none" stroke={sc.scaleA} strokeWidth={14} strokeLinecap="butt" strokeDasharray="7 8" opacity={0.3}/>
        <path d={path} fill="none" stroke={sc.belly} strokeWidth={4} strokeLinecap="round" opacity={0.5}/>
        <ellipse cx={p2.x} cy={p2.y} rx={2.5} ry={8} fill={sc.base} transform={`rotate(${tRot},${p2.x},${p2.y})`}/>
        <ellipse cx={p1.x+1.5} cy={p1.y+2} rx={17} ry={11} fill="rgba(0,0,0,0.5)" transform={`rotate(${rot},${p1.x+1.5},${p1.y+2})`}/>
        <ellipse cx={p1.x} cy={p1.y} rx={16} ry={10} fill={sc.dark} transform={`rotate(${rot},${p1.x},${p1.y})`}/>
        <ellipse cx={p1.x} cy={p1.y} rx={14} ry={8.5} fill={sc.base} transform={`rotate(${rot},${p1.x},${p1.y})`}/>
        <ellipse cx={p1.x-hnx} cy={p1.y-hny} rx={10} ry={5} fill={sc.mid} opacity={0.65} transform={`rotate(${rot},${p1.x-hnx},${p1.y-hny})`}/>
        <line x1={p1.x-htx*8+hnx*3} y1={p1.y-hty*8+hny*3} x2={p1.x+htx*8+hnx*3} y2={p1.y+hty*8+hny*3} stroke={sc.dark} strokeWidth={2} opacity={0.8}/>
        <circle cx={p1.x+htx*6+hnx*9} cy={p1.y+hty*6+hny*9} r={1.5} fill="#030303"/>
        <circle cx={p1.x-htx*6+hnx*9} cy={p1.y-hty*6+hny*9} r={1.5} fill="#030303"/>
        <circle cx={p1.x+htx*5.5} cy={p1.y+hty*5.5} r={5} fill="rgba(0,0,0,0.95)"/>
        <circle cx={p1.x-htx*5.5} cy={p1.y-hty*5.5} r={5} fill="rgba(0,0,0,0.95)"/>
        <circle cx={p1.x+htx*5.5} cy={p1.y+hty*5.5} r={3.4} fill="#b89010"/>
        <circle cx={p1.x-htx*5.5} cy={p1.y-hty*5.5} r={3.4} fill="#b89010"/>
        <ellipse cx={p1.x+htx*5.5} cy={p1.y+hty*5.5} rx={0.7} ry={2.8} fill="#030303" transform={`rotate(${rot},${p1.x+htx*5.5},${p1.y+hty*5.5})`}/>
        <ellipse cx={p1.x-htx*5.5} cy={p1.y-hty*5.5} rx={0.7} ry={2.8} fill="#030303" transform={`rotate(${rot},${p1.x-htx*5.5},${p1.y-hty*5.5})`}/>
        <circle cx={p1.x+htx*5.5+1.2} cy={p1.y+hty*5.5-1.2} r={1.0} fill="rgba(255,255,255,0.88)"/>
        <circle cx={p1.x-htx*5.5+1.2} cy={p1.y-hty*5.5-1.2} r={1.0} fill="rgba(255,255,255,0.88)"/>
        <line x1={p1.x+hnx*13} y1={p1.y+hny*13} x2={tB.x} y2={tB.y} stroke="#8a0012" strokeWidth={1.8} strokeLinecap="round"/>
        <line x1={tB.x} y1={tB.y} x2={fL.x} y2={fL.y} stroke="#cc1020" strokeWidth={1.3} strokeLinecap="round"/>
        <line x1={tB.x} y1={tB.y} x2={fR.x} y2={fR.y} stroke="#cc1020" strokeWidth={1.3} strokeLinecap="round"/>
      </g>
    );
  });

  // Ladders (reverted to original thin style)
  const ladderEls = Object.entries(LADDERS).map(([bottom, top]) => {
    const p1=cellToXY(+bottom), p2=cellToXY(top);
    const dx=p2.x-p1.x, dy=p2.y-p1.y, len=Math.hypot(dx,dy), uy=dy/len;
    const lpx=-uy*9, lpy=(dx/len)*9;
    const rungs=Math.max(3,Math.floor(len/22));
    const rungEls=[];
    for(let r=1;r<rungs;r++){const t=r/rungs;const rx=p1.x+dx*t,ry=p1.y+dy*t;rungEls.push(<line key={r} x1={rx+lpx} y1={ry+lpy} x2={rx-lpx} y2={ry-lpy} stroke="#5a3210" strokeWidth={3.5} strokeLinecap="butt" opacity={0.88}/>);}
    return (
      <g key={`l-${bottom}`}>
        <line x1={p1.x+lpx+1} y1={p1.y+lpy+1} x2={p2.x+lpx+1} y2={p2.y+lpy+1} stroke="rgba(0,0,0,0.5)" strokeWidth={6} strokeLinecap="butt"/>
        <line x1={p1.x-lpx+1} y1={p1.y-lpy+1} x2={p2.x-lpx+1} y2={p2.y-lpy+1} stroke="rgba(0,0,0,0.5)" strokeWidth={6} strokeLinecap="butt"/>
        <line x1={p1.x+lpx} y1={p1.y+lpy} x2={p2.x+lpx} y2={p2.y+lpy} stroke="#7a4a20" strokeWidth={5} strokeLinecap="butt" opacity={0.95}/>
        <line x1={p1.x-lpx} y1={p1.y-lpy} x2={p2.x-lpx} y2={p2.y-lpy} stroke="#7a4a20" strokeWidth={5} strokeLinecap="butt" opacity={0.95}/>
        <line x1={p1.x+lpx} y1={p1.y+lpy} x2={p2.x+lpx} y2={p2.y+lpy} stroke="rgba(210,155,90,0.3)" strokeWidth={1.5} strokeLinecap="butt"/>
        <line x1={p1.x-lpx} y1={p1.y-lpy} x2={p2.x-lpx} y2={p2.y-lpy} stroke="rgba(210,155,90,0.3)" strokeWidth={1.5} strokeLinecap="butt"/>
        {rungEls}
      </g>
    );
  });

  // Pawns (wider, less glow)
  const posMap: Record<number,typeof players> = {};
  players.forEach(p=>{ if(p.position>0){ if(!posMap[p.position])posMap[p.position]=[]; posMap[p.position].push(p); }});
  const pawnEls = Object.entries(posMap).flatMap(([pos,group])=>{
    const n=+pos, [gr,gc]=cellToGrid(n);
    const cx=gc*CELL_SIZE+CELL_SIZE/2, cy=gr*CELL_SIZE+CELL_SIZE/2;
    return group.map((p,i)=>{
      const offX=group.length>1?(i-(group.length-1)/2)*14:0;
      const ppx=cx+offX, ppy=cy-4, s=1.1;
      return (
        <g key={p.id}>
          <ellipse cx={ppx} cy={ppy+12*s} rx={9*s} ry={2.5*s} fill="rgba(0,0,0,0.35)"/>
          <rect x={ppx-7*s} y={ppy+6*s} width={14*s} height={4*s} rx={2*s} fill={p.color} opacity={0.9}/>
          <rect x={ppx-5*s} y={ppy} width={10*s} height={8*s} rx={2*s} fill={p.color}/>
          <circle cx={ppx} cy={ppy-5*s} r={6*s} fill={p.color}/>
          <circle cx={ppx} cy={ppy-5*s} r={3.5*s} fill="rgba(255,255,255,0.28)"/>
          <circle cx={ppx} cy={ppy-7*s} r={1.8*s} fill="rgba(255,255,255,0.45)"/>
        </g>
      );
    });
  });

  return (
    <svg viewBox={`0 0 ${BOARD_PX} ${BOARD_PX}`} style={{ width:'100%',height:'100%',display:'block',borderRadius:8 }}>
      <rect width={BOARD_PX} height={BOARD_PX} rx={8} fill="rgba(0,0,0,0.15)"/>
      {cells}{ladderEls}{snakeEls}{pawnEls}
      <rect x={1} y={1} width={BOARD_PX-2} height={BOARD_PX-2} rx={11} fill="none" stroke="rgba(0,245,255,0.18)" strokeWidth={2}/>
    </svg>
  );
}

// ─── GAME PAGE ────────────────────────────────────────────
export default function GamePage() {
  const router = useRouter();
  const [myTeam, setMyTeam] = useState<TeamConfig | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [positions, setPositions] = useState<{teamId: number, position: number}[]>([]);
  const [diceUnlocked, setDiceUnlocked] = useState(true);
  const [waitingAdmin, setWaitingAdmin] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [diceDisplay, setDiceDisplay] = useState<number>(1);
  const [rolledNum, setRolledNum] = useState<number | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionCountdown, setQuestionCountdown] = useState(3);
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<TeamConfig | null>(null);
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const myPos = positions.find(p => p.teamId === myTeam?.id)?.position ?? 0;

  // We use a ref so the fetch closure can access the latest state without triggering re-runs
  const uiState = useRef({ diceUnlocked, waitingAdmin });
  useEffect(() => { uiState.current = { diceUnlocked, waitingAdmin }; }, [diceUnlocked, waitingAdmin]);

  useEffect(() => {
    const u = (() => { try { return JSON.parse(sessionStorage.getItem('snakeUser')||'null'); } catch { return null; } })();
    if (!u || u.role !== 'contestant') { router.push('/login'); return; }
    setSessionUser(u);

    channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL);

    async function fetchAndSync() {
      const state = await fetchGameState();
      if (state && state.gameStarted) {
        setWaitingRoom(false);
        setGameConfig({ numTeams: state.numTeams, teams: state.teams, gameStarted: state.gameStarted });
        setPositions(state.teams.map(t => ({ teamId: t.id, position: t.position || 0 })));
        
        const myTeamData = state.teams.find(t => t.id === u.teamNumber);
        if (!myTeamData) { router.push('/login'); return; }
        
        // Clear question UI if we were waiting but admin replied
        if (!myTeamData.waitingForApproval && uiState.current.diceUnlocked === false && uiState.current.waitingAdmin === true) {
            setShowQuestion(false);
            setRolledNum(null);
            setLog(l => [`${new Date().toLocaleTimeString()} — Score Updated by Admin`, ...l].slice(0, 30));
        }

        setMyTeam(myTeamData);
        setDiceUnlocked(!!myTeamData.diceUnlocked);
        setWaitingAdmin(!!myTeamData.waitingForApproval);

        // Check winner
        const win = state.teams.find(t => t.position && t.position >= 100);
        if (win) setWinner(win);
        
        // Notify admin of presence
        channelRef.current?.postMessage({ type: 'CONTESTANT_JOINED', payload: { teamId: u.teamNumber } });
      } else {
        setWaitingRoom(true);
      }
    }

    channelRef.current!.onmessage = (e) => {
      const { type } = e.data;
      if (type === 'DB_UPDATED' || type === 'GAME_STARTED') { fetchAndSync(); }
      if (type === 'GAME_RESET') { router.push('/login'); }
    };

    fetchAndSync();

    return () => channelRef.current?.close();
  }, []);

  function addLog(msg: string) {
    setLog(l => [`${new Date().toLocaleTimeString()} — ${msg}`, ...l].slice(0, 30));
  }

  const rollDice = useCallback(() => {
    if (!diceUnlocked || rolling || waitingAdmin || !myTeam) return;
    setRolling(true);
    let ticks = 0;
    const iv = setInterval(() => {
      setDiceDisplay(Math.ceil(Math.random() * 60));
      ticks++;
      if (ticks >= 12) {
        clearInterval(iv);
        const roll = Math.ceil(Math.random() * 60);
        setDiceDisplay(roll);
        setRolledNum(roll);
        setRolling(false);
        addLog(`Rolled ${roll}`);
        // After 3 seconds show question
        let cd = 3;
        setQuestionCountdown(3);
        const cdIv = setInterval(() => {
          cd--;
          setQuestionCountdown(cd);
          if (cd <= 0) {
            clearInterval(cdIv);
            const q = getQuestionForPosition(Math.max(myPos, 1));
            setQuestion(q);
            setShowQuestion(true);
          }
        }, 1000);
      }
    }, 80);
  }, [diceUnlocked, rolling, waitingAdmin, myTeam, myPos]);

  async function submitForReview() {
    if (!myTeam || !question || rolledNum === null) return;
    const approval = {
      teamId: myTeam.id, teamName: myTeam.name, teamColor: myTeam.color,
      roll: rolledNum, fromPosition: myPos,
      questionId: question.id, questionTitle: question.title,
      questionDifficulty: question.difficulty, questionLink: question.link,
      timestamp: Date.now(),
    };
    
    // Optimistic UI updates
    setDiceUnlocked(false);
    setWaitingAdmin(true);
    addLog('Submitted for admin review. Waiting...');
    
    // Fire and forget so we don't block the UI
    submitRollDB(approval).catch(console.error);
  }

  const sortedBoard = gameConfig
    ? [...(gameConfig.teams)].sort((a, b) => {
        const pa = positions.find(p => p.teamId === a.id)?.position ?? 0;
        const pb = positions.find(p => p.teamId === b.id)?.position ?? 0;
        return pb - pa;
      })
    : [];

  const DIFF_COLOR: Record<string, string> = { easy: '#00ff88', medium: '#fbbf24', hard: '#ff4d6d' };

  // Waiting room screen
  if (waitingRoom) return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircuitBackground />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 20, animation: 'pulse 1.5s infinite' }}>⧗</div>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: 'rgba(0,245,255,0.6)', marginBottom: 12 }}>WAITING FOR GAME TO START</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Administrator is setting up the session</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>You will be taken to the game automatically when ready.</div>
        <div style={{ marginTop: 24, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f5ff', animation: `pulse 1.5s ${i*0.3}s infinite` }} />)}
        </div>
        <button onClick={() => setShowHomeModal(true)} style={{ marginTop: 32, padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 11 }}>← Back to Home</button>
      </div>
      {showHomeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: 400, background: 'rgba(4,12,24,0.98)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: 14, padding: 30 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(0,245,255,0.6)', marginBottom: 12 }}>⚠ WARNING</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Leave the game?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 24 }}>You will be logged out of this session. You can rejoin later using the same team credentials as long as the admin has not reset the game.</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowHomeModal(false)} style={{ flex: 1, padding: 11, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, fontFamily: "'Space Grotesk',sans-serif" }}>CANCEL</button>
              <button onClick={() => { sessionStorage.clear(); router.push('/'); }} style={{ flex: 1, padding: 11, borderRadius: 8, border: '1px solid rgba(0,245,255,0.4)', background: 'rgba(0,245,255,0.08)', color: '#00f5ff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>LEAVE</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );

  if (!myTeam) return null;

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden' }}>
      <CircuitBackground />
      <div style={{ position: 'relative', zIndex: 1, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
        <div className="game-container" style={{ display: 'flex', gap: 0, border: '1px solid rgba(30,100,255,0.2)', borderLeft: '2px solid rgba(30,100,255,0.6)', borderRadius: 4, overflow: 'hidden', height: 'calc(100vh - 20px)', maxHeight: 820, width: '100%', maxWidth: 1280 }}>

          {/* ── LEFT PANEL ── */}
          <div className="left-panel" style={{ width: 200, flexShrink: 0, borderRight: '1px solid rgba(30,100,255,0.2)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', overflowY: 'auto' }}>
            {/* My Team */}
            <div style={{ padding: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>// MY TEAM</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: myTeam.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: myTeam.color, fontSize: 13 }}>{myTeam.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>SQUARE</span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: myTeam.color }}>{myPos === 0 ? '—' : String(myPos).padStart(3, '0')}</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${myPos}%`, background: myTeam.color, borderRadius: 2, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, letterSpacing: '0.12em', color: waitingAdmin ? '#fbbf24' : diceUnlocked ? '#00ff88' : 'rgba(255,255,255,0.2)' }}>
                  {waitingAdmin ? '⏳ AWAITING APPROVAL' : diceUnlocked ? '● DICE READY' : '🔒 LOCKED'}
                </span>
              </div>
            </div>

            {/* Leaderboard */}
            <div style={{ padding: 14, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ width: 3, height: 12, background: 'rgba(255,200,0,0.9)', borderRadius: 1 }} />
                <span style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,210,0,0.85)', fontWeight: 700 }}>// LEADERBOARD</span>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88', animation: 'pulse 2s infinite', marginLeft: 'auto', flexShrink: 0 }} />
              </div>
              {sortedBoard.slice(0, 7).map((team, rank) => {
                const pos = positions.find(p => p.teamId === team.id)?.position ?? 0;
                const isMe = team.id === myTeam.id;
                return (
                  <div key={team.id} style={{ padding: '8px 10px 8px 14px', marginBottom: 6, borderRadius: 5, position: 'relative', overflow: 'hidden', border: `1px solid ${isMe ? team.color + '55' : 'rgba(255,255,255,0.06)'}`, background: isMe ? `${team.color}0a` : 'rgba(255,255,255,0.02)', transition: 'all 0.4s' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: team.color }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', minWidth: 18 }}>{rank + 1}.</span>
                      <span style={{ fontSize: 11, fontWeight: 700, flex: 1, color: isMe ? team.color : 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}{isMe ? ' ◄' : ''}</span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: pos === 0 ? 'rgba(255,255,255,0.15)' : team.color }}>{pos === 0 ? '—' : pos}</span>
                    </div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
                      <div style={{ height: '100%', width: `${pos}%`, background: team.color, transition: 'width 0.6s' }} />
                    </div>
                  </div>
                );
              })}
              {sortedBoard.length > 7 && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'center', paddingTop: 4, letterSpacing: '0.1em' }}>+{sortedBoard.length - 7} more</div>
              )}
            </div>
          </div>

          {/* ── CENTER BOARD ── */}
          <div className="center-board" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, minWidth: 0, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'relative', width: 'min(100%, min(calc(100vh - 40px), 720px))', aspectRatio: '1', flexShrink: 0 }}>
              <BoardSVG players={(gameConfig?.teams ?? []).map((t: TeamConfig) => ({
                id: t.id, position: positions.find(p => p.teamId === t.id)?.position ?? 0,
                color: t.color, avatar: t.avatar ?? '◆', name: t.name,
              }))} />
            </div>

            {/* Question Overlay */}
            {rolledNum !== null && !waitingAdmin && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(4px)', borderRadius: 4 }}>
                <div style={{ width: '90%', maxWidth: 480, background: 'rgba(4,15,30,0.97)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: 14, padding: 28, boxShadow: '0 0 60px rgba(0,245,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, border: '2px solid rgba(0,245,255,0.4)', background: 'rgba(0,245,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900, color: '#00f5ff', flexShrink: 0 }}>{rolledNum}</div>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>QUESTION #{rolledNum}</div>
                    </div>
                  </div>

                  {!showQuestion ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 900, color: '#00f5ff', marginBottom: 8 }}>{questionCountdown}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>FETCHING QUESTION...</div>
                    </div>
                  ) : question && (
                    <>
                      <div style={{ padding: '16px 18px', borderRadius: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 4, background: `${DIFF_COLOR[question.difficulty]}20`, color: DIFF_COLOR[question.difficulty], letterSpacing: '0.12em', fontWeight: 700 }}>{question.difficulty.toUpperCase()}</span>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{question.platform}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{question.title}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{question.description}</div>
                      </div>
                      {/* Reward / penalty info */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        <div style={{ flex: 1, padding: '8px 12px', borderRadius: 7, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'rgba(0,255,136,0.6)', letterSpacing: '0.12em', marginBottom: 2 }}>IF CORRECT</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#00ff88' }}>+{{'easy':2,'medium':5,'hard':10}[question.difficulty as 'easy'|'medium'|'hard'] ?? 2} steps</div>
                        </div>
                        <div style={{ flex: 1, padding: '8px 12px', borderRadius: 7, background: 'rgba(255,60,80,0.06)', border: '1px solid rgba(255,60,80,0.2)', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'rgba(255,80,100,0.6)', letterSpacing: '0.12em', marginBottom: 2 }}>IF WRONG</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#ff4d6d' }}>−{{'easy':5,'medium':3,'hard':1}[question.difficulty as 'easy'|'medium'|'hard'] ?? 3} steps</div>
                        </div>
                      </div>
                      <a href={question.link} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: 8, border: '1px solid rgba(0,245,255,0.3)', background: 'rgba(0,245,255,0.07)', color: '#00f5ff', textDecoration: 'none', fontSize: 13, letterSpacing: '0.1em', marginBottom: 10 }}>
                        ↗ OPEN PROBLEM
                      </a>
                      <button onClick={submitForReview}
                        style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid rgba(0,255,136,0.4)', background: 'rgba(0,255,136,0.08)', color: '#00ff88', cursor: 'pointer', fontSize: 13, letterSpacing: '0.1em', fontWeight: 700 }}>
                        ✓ SUBMIT FOR ADMIN REVIEW
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Waiting for admin */}
            {waitingAdmin && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', borderRadius: 4 }}>
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 40, marginBottom: 16, animation: 'pulse 1s infinite' }}>⏳</div>
                  <div style={{ fontSize: 14, letterSpacing: '0.15em', color: '#fbbf24', marginBottom: 8 }}>WAITING FOR ADMIN APPROVAL</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Administrator is reviewing your solution...</div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="right-panel" style={{ width: 220, flexShrink: 0, borderLeft: '1px solid rgba(30,100,255,0.2)', display: 'flex', flexDirection: 'column', padding: '14px 12px', gap: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid rgba(30,100,255,0.2)' }}>
              <div style={{ width: 3, height: 14, background: myTeam.color, borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em' }}>{myTeam.name.toUpperCase()}</span>
            </div>

            {/* Dice */}
            <div style={{ padding: 14, borderRadius: 8, border: `1px solid ${myTeam.color}40`, background: `${myTeam.color}06`, textAlign: 'center' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>DICE</div>
              {/* Numerical dice display */}
              <div style={{ width: 72, height: 72, borderRadius: 14, background: 'rgba(0,0,0,0.4)', border: `2px solid ${diceUnlocked && !waitingAdmin ? myTeam.color + '90' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '2.2rem', fontWeight: 900, color: diceUnlocked && !waitingAdmin ? myTeam.color : 'rgba(255,255,255,0.15)', transition: 'all 0.2s', animation: rolling ? 'diceRoll 0.3s linear infinite' : 'none' }}>
                {diceDisplay}
              </div>
              <button onClick={rollDice} disabled={!diceUnlocked || rolling || waitingAdmin || rolledNum !== null || myPos >= 100}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${diceUnlocked && !waitingAdmin && rolledNum === null && myPos < 100 ? myTeam.color + '60' : 'rgba(255,255,255,0.06)'}`, background: diceUnlocked && !waitingAdmin && rolledNum === null && myPos < 100 ? `${myTeam.color}10` : 'rgba(255,255,255,0.02)', color: diceUnlocked && !waitingAdmin && rolledNum === null && myPos < 100 ? myTeam.color : 'rgba(255,255,255,0.2)', cursor: diceUnlocked && !waitingAdmin && rolledNum === null && myPos < 100 ? 'pointer' : 'not-allowed', fontSize: 12, letterSpacing: '0.1em', fontWeight: 700, transition: 'all 0.2s' }}>
                {myPos >= 100 ? 'FINISHED' : rolling ? 'ROLLING...' : waitingAdmin ? 'AWAITING ADMIN' : rolledNum !== null ? 'QUESTION ACTIVE' : '▶ ROLL DICE'}
              </button>
              <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>1-60</div>
            </div>

            {/* Activity log */}
            <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ padding: '8px 12px', fontSize: 9, letterSpacing: '0.18em', color: 'rgba(0,245,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>ACTIVITY LOG</div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {log.length === 0 ? <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', textAlign: 'center', padding: 16 }}>// awaiting roll...</div>
                  : log.map((l, i) => <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{l}</div>)}
              </div>
            </div>

            <button onClick={() => setShowHomeModal(true)}
              style={{ padding: '7px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', background: 'transparent', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 10, letterSpacing: '0.1em' }}>
              ⏎ BACK TO HOME
            </button>
          </div>
        </div>
      </div>

      {/* Home confirm modal */}
      {showHomeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: 400, background: 'rgba(4,12,24,0.98)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: 14, padding: 30 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(0,245,255,0.6)', marginBottom: 12 }}>⚠ WARNING</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Leave the game?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 24 }}>You will be logged out of this session. You can rejoin with the same team credentials as long as the admin has not reset the game.</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowHomeModal(false)} style={{ flex: 1, padding: 11, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, fontFamily: "'Space Grotesk',sans-serif" }}>CANCEL</button>
              <button onClick={() => { sessionStorage.clear(); router.push('/'); }} style={{ flex: 1, padding: 11, borderRadius: 8, border: '1px solid rgba(0,245,255,0.4)', background: 'rgba(0,245,255,0.08)', color: '#00f5ff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>LEAVE</button>
            </div>
          </div>
        </div>
      )}

      {/* Winner overlay with confetti */}
      {winner && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 'clamp(3rem,8vw,6rem)', fontWeight: 900, letterSpacing: '0.05em', background: `linear-gradient(135deg, ${winner.color}, #ffd700, ${winner.color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'winnerPulse 1.5s ease-in-out infinite', marginBottom: 12 }}>WINNER!</div>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>{winner.avatar}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: winner.color, marginBottom: 6 }}>{winner.name}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>has reached square 100!</div>
            <button onClick={() => setWinner(null)} style={{ padding: '12px 40px', borderRadius: 8, border: `1px solid ${winner.color}`, background: `${winner.color}15`, color: winner.color, cursor: 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', fontFamily: "'Space Grotesk',sans-serif" }}>CONTINUE</button>
          </div>
          {/* Confetti */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', left: `${Math.random() * 100}%`, top: '-20px', width: `${6 + Math.random() * 8}px`, height: `${6 + Math.random() * 8}px`, borderRadius: Math.random() > 0.5 ? '50%' : '2px', background: [winner.color,'#ffd700','#00ff88','#00f5ff','#c084fc','#ff4d6d'][Math.floor(Math.random()*6)], animation: `confettiFall ${2 + Math.random() * 3}s ${Math.random() * 2}s linear infinite`, transform: `rotate(${Math.random()*360}deg)` }} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes diceRoll{0%{transform:scale(1)}50%{transform:scale(.88)}100%{transform:scale(1)}}
        @keyframes winnerPulse{0%,100%{transform:scale(1) rotate(-1deg)}50%{transform:scale(1.06) rotate(1deg)}}
        @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
        input::placeholder{color:rgba(255,255,255,0.2)}
        @media (max-width: 900px) {
          .game-container { flex-direction: column !important; overflow-y: auto !important; height: 100vh !important; max-height: none !important; border: none !important; }
          .left-panel { width: 100% !important; border-right: none !important; border-bottom: 2px solid rgba(30,100,255,0.4) !important; max-height: 40vh !important; flex: none !important; }
          .center-board { width: 100% !important; flex: none !important; min-height: 100vw !important; padding: 4px !important; }
          .right-panel { width: 100% !important; border-left: none !important; border-top: 2px solid rgba(30,100,255,0.4) !important; flex: none !important; }
        }
      `}</style>
    </div>
  );
}
