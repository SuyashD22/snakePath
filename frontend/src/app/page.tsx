'use client';

import { useRouter } from 'next/navigation';
import CircuitBackground from '@/components/CircuitBackground';

export default function HomePage() {
  const router = useRouter();

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#fff', fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden' }}>
      <CircuitBackground />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 48, padding: '20px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 18 }}>
            <div style={{ width: 80, height: 1, background: 'linear-gradient(90deg,transparent,#00f5ff)' }} />
            <span style={{ fontSize: 11, letterSpacing: '0.35em', color: 'rgba(0,245,255,0.5)' }}>ENIGMA</span>
            <div style={{ width: 80, height: 1, background: 'linear-gradient(90deg,#00f5ff,transparent)' }} />
          </div>

          <div style={{
            fontSize: 'clamp(4rem, 14vw, 8rem)', lineHeight: 0.9,
            letterSpacing: '0.06em', fontWeight: 900,
            textShadow: '0 0 30px rgba(0,245,255,0.35), 0 0 60px rgba(0,245,255,0.12)',
          }}>
            <span style={{ color: '#00f5ff' }}>SN</span>
            <span style={{ color: '#00d4aa' }}>AK</span>
            <span style={{ color: '#ffffff' }}>E &</span>
            <br />
            <span style={{ color: '#00ff88' }}>LAD</span>
            <span style={{ color: '#00f5ff' }}>DER</span>
          </div>

          <div style={{ marginTop: 12, fontSize: 'clamp(0.8rem, 2.5vw, 1.3rem)', letterSpacing: '0.4em', color: '#fbbf24', textShadow: '0 0 30px rgba(251,191,36,0.5)', fontWeight: 700 }}>
            DSA EDITION
          </div>
        </div>

        {/* START button */}
        <button
          onClick={() => router.push('/login')}
          style={{
            padding: '18px 64px', fontSize: '1.1rem', letterSpacing: '0.3em', fontWeight: 700,
            fontFamily: "'Space Grotesk',sans-serif",
            borderRadius: 6, cursor: 'pointer',
            border: '1px solid rgba(0,245,255,0.5)',
            background: 'rgba(0,245,255,0.06)',
            color: '#00f5ff',
            transition: 'all 0.25s',
            boxShadow: '0 0 0px rgba(0,245,255,0)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,245,255,0.14)';
            e.currentTarget.style.boxShadow = '0 0 32px rgba(0,245,255,0.25)';
            e.currentTarget.style.transform = 'scale(1.04)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,245,255,0.06)';
            e.currentTarget.style.boxShadow = '0 0 0px rgba(0,245,255,0)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ▶ START
        </button>
      </div>
    </div>
  );
}
