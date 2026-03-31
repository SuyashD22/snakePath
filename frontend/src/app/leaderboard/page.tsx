'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CircuitBackground from '@/components/CircuitBackground';
import { fetchGameState, BROADCAST_CHANNEL } from '@/lib/gameStore';

export default function LeaderboardPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<{ id: number; name: string; color: string; avatar: string; position: number }[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');

  async function refresh() {
    const state = await fetchGameState();
    if (!state || !state.gameStarted) { setTeams([]); return; }
    const merged = state.teams.map((t: any) => ({
      id: t.id, name: t.name, color: t.color, avatar: t.avatar ?? '◆',
      position: t.position ?? 0,
    })).sort((a: any, b: any) => b.position - a.position);
    setTeams(merged);
    setLastUpdated(new Date().toLocaleTimeString());
  }

  useEffect(() => {
    refresh();
    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    channel.onmessage = (e) => {
      if (e.data.type === 'DB_UPDATED') {
        refresh();
      }
    };
    const interval = setInterval(refresh, 3000);
    return () => { channel.close(); clearInterval(interval); };
  }, []);

  const medals = ['1ST', '2ND', '3RD'];

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden' }}>
      <CircuitBackground />

      <div className="leaderboard-container" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '40px 60px' }}>

        <button onClick={() => router.push('/admin')}
          style={{ position: 'absolute', top: 32, left: 60, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 11, letterSpacing: '0.12em', fontFamily: "'Space Grotesk',sans-serif", zIndex: 10 }}>
          ← BACK TO ADMIN
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, marginTop: 40 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.35em', color: 'rgba(255,200,0,0.6)', marginBottom: 10 }}>// LIVE LEADERBOARD</div>
            <div style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1 }}>
              <span style={{ color: '#00f5ff' }}>SNAKE</span>
              <span style={{ color: '#fff' }}> &amp; </span>
              <span style={{ color: '#00ff88' }}>LADDER</span>
            </div>
            <div style={{ fontSize: 14, letterSpacing: '0.3em', color: '#fbbf24', fontWeight: 700, marginTop: 6 }}>DSA EDITION</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
            <div>LAST UPDATED</div>
            <div style={{ color: 'rgba(0,245,255,0.5)', marginTop: 2 }}>{lastUpdated}</div>
          </div>
        </div>

        {/* Top 3 podium */}
        {teams.length >= 3 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
            {[teams[1], teams[0], teams[2]].map((team, i) => {
              const heights = ['180px', '220px', '160px'];
              const podiumRanks = [2, 1, 3];
              const rankColors = ['#c0c0c0', '#ffd700', '#cd7f32'];
              return (
                <div key={team.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 200 }}>
                  <div style={{ fontSize: '2rem', marginBottom: 6 }}>{team.avatar}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: team.color, marginBottom: 4, textAlign: 'center' }}>{team.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: team.color, marginBottom: 8 }}>
                    {String(team.position).padStart(3, '0')}
                  </div>
                  <div style={{ width: '100%', height: heights[i], background: `${team.color}18`, border: `2px solid ${team.color}50`, borderBottom: 'none', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: rankColors[i] }}>{medals[podiumRanks[i] - 1]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rest of teams */}
        <div style={{ background: 'rgba(4,12,24,0.55)', border: '1px solid rgba(255,200,0,0.15)', borderRadius: 14, padding: '16px 20px', backdropFilter: 'blur(4px)' }}>
          {teams.slice(3, 7).map((team, idx) => (
            <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 14px', marginBottom: 6, borderRadius: 8, border: `1px solid ${team.color}20`, background: `${team.color}06`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: team.color }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', minWidth: 28, marginLeft: 8 }}>{idx + 4}.</span>
              <span style={{ fontSize: '1.4rem' }}>{team.avatar}</span>
              <span style={{ fontSize: 14, fontWeight: 700, flex: 1, color: team.color }}>{team.name}</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: team.position === 0 ? 'rgba(255,255,255,0.15)' : team.color }}>
                {team.position === 0 ? '\u2014' : String(team.position).padStart(3, '0')}
              </span>
              <div style={{ width: 120, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${team.position}%`, background: team.color, borderRadius: 2, transition: 'width 0.8s' }} />
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13, letterSpacing: '0.1em' }}>// No game in progress</div>
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 24, fontSize: 10, color: 'rgba(255,255,255,0.15)', textAlign: 'center', letterSpacing: '0.15em' }}>
          AUTO-REFRESHES EVERY 3 SECONDS
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @media (max-width: 768px) {
          .leaderboard-container { padding: 20px 20px !important; }
        }
      `}</style>
    </div>
  );
}
