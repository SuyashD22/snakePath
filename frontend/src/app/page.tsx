'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [numPlayers, setNumPlayers] = useState<string>('2');
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleStart = () => {
    const n = parseInt(numPlayers, 10);
    if (isNaN(n) || n < 1 || n > 20) {
      setError('Enter 1–20 players');
      return;
    }
    setError('');
    router.push(`/play?players=${n}`);
  };

  return (
    <div className="home-page">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: 'center',
          maxWidth: '600px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          padding: '24px',
        }}
      >
        {/* Title banner */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          className="wood-banner"
          style={{ padding: '18px 50px', width: '100%', maxWidth: '500px' }}
        >
          <h1 className="title-main" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', marginBottom: '4px' }}>
            Snake <span className="title-accent">&</span> Ladder
          </h1>
          <p className="subtitle" style={{ fontSize: '1.4rem' }}>DSA Edition</p>
        </motion.div>

        {/* Player count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
        >
          <label style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            color: 'var(--text-cream)',
            textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
            letterSpacing: '1px',
          }}>
            Number of Players
          </label>
          <input
            id="player-count-input"
            type="number" min="1" max="20"
            value={numPlayers}
            onChange={(e) => { setNumPlayers(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            className="input-jungle"
            placeholder="2"
          />
        </motion.div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ color: '#FF6B6B', fontFamily: 'var(--font-display)', fontSize: '0.85rem' }}>
            {error}
          </motion.p>
        )}

        <motion.button
          id="start-game-btn"
          className="btn-primary"
          onClick={handleStart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          style={{ fontSize: '1.5rem', padding: '16px 60px', width: '100%', maxWidth: '420px' }}
        >
          Start Adventure
        </motion.button>
      </motion.div>
    </div>
  );
}
