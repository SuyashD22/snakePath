'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CircuitBackground from '@/components/CircuitBackground';
import { fetchGameState } from '@/lib/gameStore';

const ADMIN_PASSWORD = 'admin@dsa2026';

const TEAM_COLORS = [
  '#ff4d6d','#00c8ff','#ffd700','#c084fc','#00ff88',
  '#ff8c42','#f0abfc','#22d3ee','#fb923c','#86efac',
  '#e879f9','#34d399','#f59e0b','#60a5fa','#f472b6',
];

interface GameTeam { id: number; name: string; color: string; password: string; }
interface GameConfig { numTeams: number; teams: GameTeam[]; gameStarted: boolean; }

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<GameTeam | null>(null);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleRoleSelect = async (r: string) => {
    setRole(r); setError(''); setPassword(''); setSelectedTeam(null);
    if (r === 'contestant') {
      try {
        const state = await fetchGameState();
        if (state && state.gameStarted) {
          setGameConfig({ numTeams: state.numTeams, teams: state.teams, gameStarted: state.gameStarted });
        } else {
          setGameConfig(null);
        }
      } catch { setGameConfig(null); }
    }
  };

  useEffect(() => { if (selectedTeam && passwordRef.current) passwordRef.current.focus(); }, [selectedTeam]);

  const handleAdminSubmit = () => {
    if (!adminUsername.trim()) { setError('Please enter a username'); return; }
    if (!adminPassword.trim()) { setError('Please enter a password'); return; }
    if (adminPassword !== ADMIN_PASSWORD) { setError('Invalid administrator password'); return; }
    sessionStorage.setItem('snakeUser', JSON.stringify({ role: 'administrator', username: adminUsername.trim(), authSignature: btoa(ADMIN_PASSWORD) }));
    router.push('/admin');
  };

  const handleContestantSubmit = () => {
    if (!selectedTeam) { setError('Please select your team'); return; }
    if (!password.trim()) { setError('Please enter the team password'); return; }
    if (selectedTeam.password !== password) { setError('Incorrect team password'); return; }
    sessionStorage.setItem('snakeUser', JSON.stringify({
      role: 'contestant', username: selectedTeam.name, teamNumber: selectedTeam.id, teamColor: selectedTeam.color,
    }));
    router.push('/game');
  };

  const inputStyle = (err = false) => ({
    width: '100%', padding: '13px 18px', borderRadius: 8,
    border: `1px solid ${err ? 'rgba(255,60,80,0.55)' : 'rgba(0,245,255,0.2)'}`,
    background: 'rgba(255,255,255,0.03)', color: '#fff',
    fontFamily: "'Space Grotesk',sans-serif", fontSize: 15,
    outline: 'none', caretColor: '#00f5ff', boxSizing: 'border-box' as const,
  });

  const labelStyle = { fontSize: 11, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', marginBottom: 8, display: 'block' as const };

  const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle}
      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 16, padding: 0, display: 'flex', alignItems: 'center' }}>
      {show ? '🙈' : '👁'}
    </button>
  );

  return (
    <div className="no-scrollbar" style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", overflowY: 'auto', overflowX: 'hidden' }}>
      <CircuitBackground />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>

        <button onClick={() => router.push('/')}
          style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 11, letterSpacing: '0.12em', fontFamily: "'Space Grotesk',sans-serif" }}>
          ← HOME
        </button>

        <div style={{ width: '100%', maxWidth: 580, background: 'rgba(4,15,30,0.92)', border: '1px solid rgba(0,245,255,0.12)', borderRadius: 16, backdropFilter: 'blur(16px)', boxShadow: '0 0 60px rgba(0,245,255,0.07)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid rgba(0,245,255,0.12)' }}>
            <div style={{ display: 'flex', gap: 7 }}>
              {['rgba(255,80,80,0.7)', 'rgba(255,200,0,0.7)', 'rgba(0,255,136,0.7)'].map((c, i) =>
                <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
              )}
            </div>
            <span style={{ fontSize: 12, letterSpacing: '0.15em', color: 'rgba(0,245,255,0.6)' }}>AUTH_PORTAL</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(0,212,170,0.8)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4aa', animation: 'pulse 2s infinite' }} />
              <span>SECURE</span>
            </div>
          </div>

          <div style={{ padding: 36 }}>

            {/* ── ROLE SELECTION ── */}
            {!role && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{ fontSize: 15, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>SELECT ACCESS LEVEL</div>
                  <div style={{ fontSize: 13, color: 'rgba(0,245,255,0.45)' }}>Choose your role to continue</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 28 }}>
                  {[
                    { key: 'administrator', label: 'Administrator', icon: '⬟', desc: 'Manage game session, full control', color: '#a78bfa' },
                    { key: 'contestant', label: 'Contestant', icon: '◆', desc: 'Join as a competing team', color: '#00f5ff' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => handleRoleSelect(opt.key)}
                      style={{ padding: '28px 22px', borderRadius: 12, border: `1px solid ${opt.color}40`, background: 'rgba(0,0,0,0)', cursor: 'pointer', textAlign: 'left', color: '#fff', fontFamily: "'Space Grotesk',sans-serif" }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${opt.color}10`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; }}>
                      <div style={{ fontSize: 32, marginBottom: 14 }}>{opt.icon}</div>
                      <div style={{ fontSize: '1.25rem', color: opt.color, letterSpacing: '0.05em', marginBottom: 8 }}>{opt.label}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.55 }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
                <div style={{ padding: '20px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,245,255,0.1)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.8rem', fontWeight: 700, color: '#00f5ff', lineHeight: 1 }}>60</div>
                  <div style={{ fontSize: 11, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.28)', marginTop: 6 }}>QUESTIONS PER SESSION</div>
                </div>
              </>
            )}

            {/* ── ADMINISTRATOR LOGIN ── */}
            {role === 'administrator' && (
              <>
                <button onClick={() => { setRole(null); setError(''); setAdminUsername(''); setAdminPassword(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 26, padding: '7px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 12, letterSpacing: '0.1em', fontFamily: "'Space Grotesk',sans-serif" }}>
                  ← BACK
                </button>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'inline-flex', padding: '6px 14px', borderRadius: 6, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', fontSize: 12, color: '#a78bfa', letterSpacing: '0.1em', marginBottom: 8 }}>⬟ ADMINISTRATOR</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>Full game control & session management</div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>USERNAME</label>
                  <input type="text" value={adminUsername} onChange={e => { setAdminUsername(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleAdminSubmit()} placeholder="Enter admin callsign..." maxLength={20} style={inputStyle(!adminUsername.trim() && !!error)} />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <label style={labelStyle}>PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showAdminPw ? 'text' : 'password'} value={adminPassword}
                      onChange={e => { setAdminPassword(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleAdminSubmit()}
                      placeholder="Admin password..." maxLength={32}
                      style={{ ...inputStyle(!adminPassword.trim() && !!error), paddingRight: 44 }} />
                    <EyeBtn show={showAdminPw} toggle={() => setShowAdminPw(s => !s)} />
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(167,139,250,0.4)', letterSpacing: '0.08em' }}>🔒 Administrator credentials required</div>
                </div>
                {error && <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,80,100,0.85)' }}>⚠ {error}</div>}
                <button onClick={handleAdminSubmit}
                  style={{ width: '100%', marginTop: 22, padding: 15, fontSize: '1rem', letterSpacing: '0.15em', borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(167,139,250,0.5)', background: 'rgba(167,139,250,0.06)', color: '#a78bfa', fontFamily: "'Space Grotesk',sans-serif" }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.14)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.06)'; }}>
                  ▶ AUTHENTICATE & ENTER
                </button>
              </>
            )}

            {/* ── CONTESTANT LOGIN ── */}
            {role === 'contestant' && (
              <>
                <button onClick={() => { setRole(null); setError(''); setSelectedTeam(null); setPassword(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 26, padding: '7px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 12, letterSpacing: '0.1em', fontFamily: "'Space Grotesk',sans-serif" }}>
                  ← BACK
                </button>

                {/* Game not started */}
                {!gameConfig && (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: 36, marginBottom: 18, animation: 'pulse 1.5s infinite' }}>⧗</div>
                    <div style={{ fontSize: 10, letterSpacing: '0.25em', color: 'rgba(0,245,255,0.5)', marginBottom: 12 }}>GAME NOT STARTED</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Waiting for Administrator</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
                      The administrator has not started a session yet.<br />Please check back once the session has been initialised.
                    </div>
                    <div style={{ marginTop: 24, display: 'flex', gap: 6, justifyContent: 'center' }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#00f5ff', animation: `pulse 1.5s ${i*0.3}s infinite` }} />)}
                    </div>
                  </div>
                )}

                {/* Game started */}
                {gameConfig && (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'inline-flex', padding: '6px 14px', borderRadius: 6, background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', fontSize: 12, color: '#00f5ff', letterSpacing: '0.1em', marginBottom: 8 }}>◆ CONTESTANT</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>{gameConfig.numTeams} teams registered for this session</div>
                    </div>

                    {/* Team grid — horizontal boxes, up to 15 teams */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={labelStyle}>SELECT YOUR TEAM</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                        {gameConfig.teams.map(team => {
                          const isSelected = selectedTeam?.id === team.id;
                          return (
                            <button key={team.id} onClick={() => { setSelectedTeam(team); setPassword(''); setError(''); }}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 8px', borderRadius: 8, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", border: `1px solid ${isSelected ? team.color + '90' : 'rgba(255,255,255,0.08)'}`, background: isSelected ? `${team.color}14` : 'rgba(255,255,255,0.02)', transition: 'all 0.18s', boxShadow: isSelected ? `0 0 16px ${team.color}30` : 'none' }}>
                              <div style={{ width: 14, height: 14, borderRadius: '50%', background: team.color, boxShadow: isSelected ? `0 0 10px ${team.color}` : 'none', flexShrink: 0 }} />
                              <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? team.color : 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.3 }}>{team.name}</span>
                              {isSelected && <span style={{ fontSize: 8, color: team.color, letterSpacing: '0.1em' }}>✓ SELECTED</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* After team selection: auto-username + password */}
                    {selectedTeam && (
                      <>
                        <div style={{ marginBottom: 14 }}>
                          <label style={labelStyle}>USERNAME</label>
                          <div style={{ padding: '13px 18px', borderRadius: 8, border: `1px solid ${selectedTeam.color}50`, background: `${selectedTeam.color}08`, color: selectedTeam.color, fontSize: 15, fontWeight: 700 }}>
                            {selectedTeam.name}
                          </div>
                          <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.1em' }}>AUTO-ASSIGNED BY TEAM SELECTION</div>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <label style={labelStyle}>TEAM PASSWORD</label>
                          <div style={{ position: 'relative' }}>
                            <input ref={passwordRef} type={showPw ? 'text' : 'password'} value={password}
                              onChange={e => { setPassword(e.target.value); setError(''); }}
                              onKeyDown={e => e.key === 'Enter' && handleContestantSubmit()}
                              placeholder="Enter team password set by admin..."
                              maxLength={32} style={{ ...inputStyle(!password.trim() && !!error), paddingRight: 44 }} />
                            <EyeBtn show={showPw} toggle={() => setShowPw(s => !s)} />
                          </div>
                        </div>
                        {error && <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,80,100,0.85)' }}>⚠ {error}</div>}
                        <button onClick={handleContestantSubmit}
                          style={{ width: '100%', marginTop: 22, padding: 15, fontSize: '1rem', letterSpacing: '0.15em', borderRadius: 10, cursor: 'pointer', border: `1px solid ${selectedTeam.color}60`, background: `${selectedTeam.color}08`, color: selectedTeam.color, transition: 'all 0.2s', fontFamily: "'Space Grotesk',sans-serif" }}
                          onMouseEnter={e => { e.currentTarget.style.background = selectedTeam.color + '18'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = selectedTeam.color + '08'; }}>
                          ▶ AUTHENTICATE & ENTER
                        </button>
                      </>
                    )}
                  </>
                )}
              </>
            )}

          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(0,245,255,0.45) !important; box-shadow: 0 0 0 2px rgba(0,245,255,0.08); }
      `}</style>
    </div>
  );
}
