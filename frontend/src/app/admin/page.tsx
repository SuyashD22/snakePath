'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CircuitBackground from '@/components/CircuitBackground';
import {
  GameConfig, TeamConfig, TeamPosition, PendingApproval, TeamDiceState,
  TEAM_COLORS, AVATARS, BROADCAST_CHANNEL, PENALTY_STEPS, MOVE_STEPS,
  saveGameConfig, loadGameConfig, saveTeamPositions, loadTeamPositions,
  savePendingApprovals, loadPendingApprovals, saveDiceStates, loadDiceStates,
  applySnakeOrLadder,
} from '@/lib/gameStore';

const DIFF_COLOR: Record<string, string> = { easy: '#00ff88', medium: '#fbbf24', hard: '#ff4d6d' };

interface ModalCfg { title: string; message: string; confirmLabel: string; onConfirm: () => void; danger?: boolean; }

export default function AdminPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'setup' | 'game'>('setup');
  const [numTeams, setNumTeams] = useState(3);
  const [teamDrafts, setTeamDrafts] = useState<{ name: string; password: string }[]>(
    Array.from({ length: 3 }, (_, i) => ({ name: `Team ${i + 1}`, password: '' }))
  );
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [positions, setPositions] = useState<TeamPosition[]>([]);
  const [diceStates, setDiceStates] = useState<TeamDiceState[]>([]);
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalCfg | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Auth guard
  useEffect(() => {
    const u = (() => { try { return JSON.parse(sessionStorage.getItem('snakeUser') || 'null'); } catch { return null; } })();
    if (!u || u.role !== 'administrator') { router.push('/login'); return; }

    channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL);
    channelRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'DICE_ROLLED') {
        // Deduplicate: keep only the latest request per team
        const existing = loadPendingApprovals().filter((p: PendingApproval) => p.teamId !== payload.teamId);
        const newPending = [...existing, payload as PendingApproval];
        savePendingApprovals(newPending);
        setPending([...newPending]);
        addLog(`${payload.teamName} rolled ${payload.roll} — ${payload.questionTitle}`);
      }
    };

    const cfg = loadGameConfig();
    if (cfg?.gameStarted) {
      setGameConfig(cfg);
      setPhase('game');
      setPositions(loadTeamPositions());
      setDiceStates(loadDiceStates());
      // Deduplicate on load: keep only latest per team
      const raw = loadPendingApprovals();
      const deduped = Object.values(
        raw.reduce((acc: Record<number, PendingApproval>, p: PendingApproval) => {
          if (!acc[p.teamId] || p.timestamp > acc[p.teamId].timestamp) acc[p.teamId] = p;
          return acc;
        }, {})
      ) as PendingApproval[];
      savePendingApprovals(deduped);
      setPending(deduped);
    }
    return () => channelRef.current?.close();
  }, []);

  function addLog(msg: string) {
    setLog(l => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l].slice(0, 50));
  }

  // Sync numTeams → drafts
  function handleNumTeamsChange(n: number) {
    setNumTeams(n);
    setTeamDrafts(prev => {
      const next = [...prev];
      while (next.length < n) next.push({ name: `Team ${next.length + 1}`, password: '' });
      return next.slice(0, n);
    });
  }

  function startGame() {
    if (teamDrafts.some(t => !t.password.trim())) { alert('Please set a password for every team.'); return; }
    const teams: TeamConfig[] = teamDrafts.map((t, i) => ({
      id: i + 1, name: t.name.trim() || `Team ${i + 1}`, password: t.password.trim(),
      color: TEAM_COLORS[i % TEAM_COLORS.length], avatar: AVATARS[i % AVATARS.length],
    }));
    const cfg: GameConfig = { numTeams, teams, gameStarted: true };
    saveGameConfig(cfg);
    const initPositions = teams.map(t => ({ teamId: t.id, position: 0 }));
    saveTeamPositions(initPositions);
    const initDice = teams.map(t => ({ teamId: t.id, diceUnlocked: true, waitingForApproval: false }));
    saveDiceStates(initDice);
    savePendingApprovals([]);
    setGameConfig(cfg);
    setPositions(initPositions);
    setDiceStates(initDice);
    setPending([]);
    channelRef.current?.postMessage({ type: 'GAME_STARTED', payload: cfg });
    setPhase('game');
    addLog('Game started!');
  }

  function approveDice(approval: PendingApproval) {
    const currentPos = positions.find(p => p.teamId === approval.teamId)?.position ?? 0;
    // Movement is fixed by question difficulty, NOT by dice roll
    const moveSteps = MOVE_STEPS[approval.questionDifficulty] ?? 2;
    let newPos = currentPos + moveSteps;
    if (newPos > 100) newPos = 100; // win condition — cap at 100
    const { pos: finalPos, event } = applySnakeOrLadder(newPos);

    const newPositions = positions.map(p => p.teamId === approval.teamId ? { ...p, position: finalPos } : p);
    saveTeamPositions(newPositions);
    setPositions(newPositions);

    const newDice = diceStates.map(d => d.teamId === approval.teamId ? { ...d, diceUnlocked: true, waitingForApproval: false } : d);
    saveDiceStates(newDice);
    setDiceStates(newDice);

    const newPending = pending.filter(p => p.teamId !== approval.teamId);
    savePendingApprovals(newPending);
    setPending(newPending);

    channelRef.current?.postMessage({ type: 'DICE_APPROVED', payload: { teamId: approval.teamId, newPos: finalPos, event } });
    channelRef.current?.postMessage({ type: 'POSITION_SYNC', payload: newPositions });
    const evtMsg = event === 'snake' ? ' 🐍 Snake!' : event === 'ladder' ? ' 🪜 Ladder!' : '';
    addLog(`Approved ${approval.teamName} → pos ${finalPos}${evtMsg}`);
  }

  function rejectDice(approval: PendingApproval) {
    // Calculate penalty (no snake/ladder on penalty moves)
    const penalty = PENALTY_STEPS[approval.questionDifficulty] ?? 3;
    const currentPos = positions.find(p => p.teamId === approval.teamId)?.position ?? 0;
    const newPos = Math.max(0, currentPos - penalty); // floor at 0, NO snake/ladder

    // Update position in storage
    const newPositions = positions.map(p => p.teamId === approval.teamId ? { ...p, position: newPos } : p);
    saveTeamPositions(newPositions);
    setPositions(newPositions);

    // Remove from pending & unlock dice
    const newPending = pending.filter(p => p.teamId !== approval.teamId);
    savePendingApprovals(newPending);
    setPending(newPending);
    const newDice = diceStates.map(d => d.teamId === approval.teamId ? { ...d, diceUnlocked: true, waitingForApproval: false } : d);
    saveDiceStates(newDice);
    setDiceStates(newDice);

    channelRef.current?.postMessage({ type: 'DICE_REJECTED', payload: { teamId: approval.teamId, penalty, newPos } });
    channelRef.current?.postMessage({ type: 'POSITION_SYNC', payload: newPositions });
    addLog(`⚠ Rejected ${approval.teamName} — penalty -${penalty} steps → pos ${newPos}`);
  }

  function doReset() {
    localStorage.clear();
    channelRef.current?.postMessage({ type: 'GAME_RESET', payload: null });
    setPhase('setup'); setGameConfig(null);
    setPositions([]); setDiceStates([]); setPending([]); setLog([]);
    setModal(null);
  }

  function doGoHome() {
    // Only clear session — game stays alive in localStorage for contestants
    sessionStorage.clear();
    router.push('/');
  }

  function askReset() {
    setModal({
      title: 'Reset Entire Game?',
      message: 'This will permanently erase all team progress, positions and passwords. Every contestant will be kicked out. This cannot be undone.',
      confirmLabel: 'YES, RESET GAME',
      danger: true,
      onConfirm: doReset,
    });
  }

  function askHome() {
    if (phase === 'game') {
      setModal({
        title: 'Leave Admin Panel?',
        message: 'The game will continue running for contestants — they can still roll dice and submit answers. You can log back in at any time.',
        confirmLabel: 'LEAVE',
        danger: false,
        onConfirm: doGoHome,
      });
    } else {
      doGoHome();
    }
  }

  const sortedLeaderboard = gameConfig
    ? [...(gameConfig.teams)].sort((a, b) => {
        const pa = positions.find(p => p.teamId === a.id)?.position ?? 0;
        const pb = positions.find(p => p.teamId === b.id)?.position ?? 0;
        return pb - pa;
      })
    : [];

  const S = { /* common inline style helpers */
    panel: { background: 'rgba(4,12,24,0.95)', border: '1px solid rgba(0,245,255,0.12)', borderRadius: 10, padding: 16 } as React.CSSProperties,
    label: { fontSize: 10, letterSpacing: '0.18em', color: 'rgba(0,245,255,0.6)', marginBottom: 6, display: 'block' } as React.CSSProperties,
    input: { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden' }}>
      <CircuitBackground />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* TOP BAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderBottom: '1px solid rgba(167,139,250,0.2)', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
          <div style={{ width: 3, height: 18, background: '#a78bfa', borderRadius: 2 }} />
          <span style={{ fontSize: 12, letterSpacing: '0.2em', color: '#a78bfa', fontWeight: 700 }}>⬟ GAME CONTROL CENTER</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: phase === 'game' ? '#00ff88' : '#fbbf24', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{phase === 'game' ? 'GAME ACTIVE' : 'SETUP MODE'}</span>
          </div>
          {phase === 'game' && (
            <button onClick={askReset} style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 5, border: '1px solid rgba(255,60,80,0.4)', background: 'transparent', color: 'rgba(255,80,100,0.8)', cursor: 'pointer', fontSize: 10, letterSpacing: '0.1em' }}>
              ↺ RESET GAME
            </button>
          )}
          <button onClick={askHome} style={{ marginLeft: phase === 'setup' ? 'auto' : 8, padding: '5px 12px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 10 }}>
            ⏎ HOME
          </button>
        </div>

        {/* ── SETUP PHASE ── */}
        {phase === 'setup' && (
          <div style={{ flex: 1, display: 'flex', gap: 20, padding: 24, overflow: 'auto' }}>
            {/* Left: config */}
            <div style={{ ...S.panel, width: 260, flexShrink: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(255,200,0,0.8)', marginBottom: 20, fontWeight: 700 }}>// GAME SETUP</div>
              <label style={S.label}>NUMBER OF TEAMS</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <input type="range" min={2} max={25} value={numTeams} onChange={e => handleNumTeamsChange(+e.target.value)}
                  style={{ flex: 1, accentColor: '#00f5ff' }} />
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00f5ff', minWidth: 36, textAlign: 'center' }}>{numTeams}</span>
              </div>
              <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.12)', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>60 questions · 1-3 dice · Admin approval required per move</div>
              </div>
              <button onClick={startGame} style={{ width: '100%', padding: '13px', borderRadius: 8, border: '1px solid rgba(0,245,255,0.4)', background: 'rgba(0,245,255,0.08)', color: '#00f5ff', cursor: 'pointer', fontSize: 13, letterSpacing: '0.12em', fontWeight: 700 }}>
                ▶ START GAME
              </button>
            </div>

            {/* Right: team configs */}
            <div style={{ flex: 1, ...S.panel, overflow: 'auto' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(255,200,0,0.8)', marginBottom: 16, fontWeight: 700 }}>// TEAM CONFIGURATION</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {teamDrafts.map((t, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${TEAM_COLORS[i % TEAM_COLORS.length]}30`, background: `${TEAM_COLORS[i % TEAM_COLORS.length]}08` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: TEAM_COLORS[i % TEAM_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: TEAM_COLORS[i % TEAM_COLORS.length] }}>TEAM {i + 1}</span>
                    </div>
                    <label style={{ ...S.label, marginBottom: 4 }}>TEAM NAME</label>
                    <input style={{ ...S.input, marginBottom: 10 }} value={t.name}
                      onChange={e => setTeamDrafts(d => d.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                    <label style={{ ...S.label, marginBottom: 4 }}>PASSWORD</label>
                    <input style={S.input} type="password" placeholder="Set team password..." value={t.password}
                      onChange={e => setTeamDrafts(d => d.map((x, j) => j === i ? { ...x, password: e.target.value } : x))} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVE GAME PHASE ── */}
        {phase === 'game' && gameConfig && (
          <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
            {/* Leaderboard */}
            <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid rgba(255,200,0,0.15)', padding: 16, overflowY: 'auto', background: 'rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(255,200,0,0.9)', fontWeight: 700, marginBottom: 14 }}>// LEADERBOARD</div>
              {sortedLeaderboard.slice(0, 5).map((team, rank) => {
                const pos = positions.find(p => p.teamId === team.id)?.position ?? 0;
                return (
                  <div key={team.id} style={{ padding: '10px 10px 10px 14px', marginBottom: 8, borderRadius: 5, border: `1px solid ${team.color}25`, background: `${team.color}07`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: rank < 3 ? ['#ffd700','#c0c0c0','#cd7f32'][rank] : 'rgba(255,255,255,0.15)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', minWidth: 18 }}>{rank + 1}.</span>
                      <span style={{ fontSize: 11, fontWeight: 700, flex: 1, color: team.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: pos === 0 ? 'rgba(255,255,255,0.15)' : team.color, paddingLeft: 24 }}>
                      {pos === 0 ? '—' : String(pos).padStart(3, '0')}
                    </div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', marginTop: 6 }}>
                      <div style={{ height: '100%', width: `${pos}%`, background: team.color, transition: 'width 0.6s' }} />
                    </div>
                  </div>
                );
              })}
              {sortedLeaderboard.length > 5 && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', paddingTop: 4, letterSpacing: '0.1em' }}>+{sortedLeaderboard.length - 5} more teams</div>
              )}
            </div>

            {/* Pending Approvals */}
            <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(0,245,255,0.8)', fontWeight: 700, marginBottom: 16 }}>
                // PENDING APPROVALS {pending.length > 0 && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,80,80,0.2)', color: '#ff4d6d', fontSize: 9 }}>{pending.length} WAITING</span>}
              </div>
              {pending.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>// No pending approvals</div>
              ) : pending.map(a => (
                <div key={`${a.teamId}-${a.timestamp}`} style={{ padding: 18, marginBottom: 12, borderRadius: 10, border: `1px solid ${a.teamColor}40`, background: `${a.teamColor}08` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.teamColor, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, color: a.teamColor, fontSize: 14 }}>{a.teamName}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>rolled</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00f5ff' }}>{a.roll}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                      pos {a.fromPosition} → +{MOVE_STEPS[a.questionDifficulty] ?? 2} steps
                    </span>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 7, background: 'rgba(0,0,0,0.3)', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${DIFF_COLOR[a.questionDifficulty]}22`, color: DIFF_COLOR[a.questionDifficulty], letterSpacing: '0.1em', fontWeight: 700 }}>{a.questionDifficulty.toUpperCase()}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{a.questionTitle}</span>
                    </div>
                    <a href={a.questionLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'rgba(0,245,255,0.6)', textDecoration: 'none' }}>{a.questionLink}</a>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => approveDice(a)} style={{ flex: 1, padding: '10px', borderRadius: 7, border: '1px solid rgba(0,255,136,0.4)', background: 'rgba(0,255,136,0.08)', color: '#00ff88', cursor: 'pointer', fontSize: 12, letterSpacing: '0.1em', fontWeight: 700 }}>
                      ✓ APPROVE & MOVE
                    </button>
                    <button onClick={() => rejectDice(a)} style={{ padding: '10px 16px', borderRadius: 7, border: '1px solid rgba(255,60,80,0.3)', background: 'transparent', color: 'rgba(255,80,100,0.7)', cursor: 'pointer', fontSize: 12 }}>
                      ✕ REJECT
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Team Status + Log */}
            <div style={{ width: 220, flexShrink: 0, borderLeft: '1px solid rgba(30,100,255,0.15)', padding: 16, overflowY: 'auto', background: 'rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(100,160,255,0.8)', fontWeight: 700, marginBottom: 14 }}>// TEAM STATUS</div>
              {gameConfig.teams.map(team => {
                const ds = diceStates.find(d => d.teamId === team.id);
                const isWaiting = pending.some(p => p.teamId === team.id);
                return (
                  <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 10px', borderRadius: 6, border: `1px solid ${team.color}20`, background: `${team.color}05` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isWaiting ? '#fbbf24' : '#00ff88', flexShrink: 0, animation: isWaiting ? 'pulse 1s infinite' : 'none' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, flex: 1, color: team.color, overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</span>
                    <span style={{ fontSize: 9, color: isWaiting ? '#fbbf24' : 'rgba(0,255,136,0.7)', letterSpacing: '0.08em' }}>{isWaiting ? 'PENDING' : 'READY'}</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(100,160,255,0.6)', marginBottom: 10 }}>// ACTIVITY</div>
                {log.slice(0, 15).map((l, i) => (
                  <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 5, lineHeight: 1.5 }}>{l}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CUSTOM CONFIRM MODAL ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: 420, background: 'rgba(4,12,24,0.98)', border: `1px solid ${modal.danger ? 'rgba(255,60,80,0.35)' : 'rgba(0,245,255,0.2)'}`, borderRadius: 14, padding: 32, boxShadow: `0 0 60px ${modal.danger ? 'rgba(255,60,80,0.15)' : 'rgba(0,245,255,0.1)'}` }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: modal.danger ? 'rgba(255,80,100,0.7)' : 'rgba(0,245,255,0.6)', marginBottom: 12 }}>⚠ WARNING</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{modal.title}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28 }}>{modal.message}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setModal(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 12, letterSpacing: '0.08em', fontFamily: "'Space Grotesk',sans-serif" }}>
                CANCEL
              </button>
              <button onClick={modal.onConfirm}
                style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${modal.danger ? 'rgba(255,60,80,0.5)' : 'rgba(0,245,255,0.4)'}`, background: modal.danger ? 'rgba(255,60,80,0.1)' : 'rgba(0,245,255,0.08)', color: modal.danger ? '#ff4d6d' : '#00f5ff', cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', fontFamily: "'Space Grotesk',sans-serif" }}>
                {modal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
