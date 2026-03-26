'use client';

/**
 * Sound manager for game sound effects.
 * Uses Web Audio API to generate sounds programmatically (no external audio files needed).
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playDiceRollSound(): void {
  try {
    const ctx = getAudioContext();
    const duration = 0.5;

    // Create noise for dice shake
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      // Rattling sound with decay
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.3;
      // Add some tonal elements
      data[i] += Math.sin(t * 800 * Math.PI) * Math.exp(-t * 12) * 0.1;
      data[i] += Math.sin(t * 1200 * Math.PI) * Math.exp(-t * 10) * 0.05;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(ctx.currentTime);
  } catch (e) {
    // Audio not supported
  }
}

export function playMoveSound(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

export function playSnakeSound(): void {
  try {
    const ctx = getAudioContext();
    const duration = 0.8;

    // Hissing sound
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      // Hiss (filtered noise)
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 3) * 0.3;
      // Add descending tone
      data[i] += Math.sin(t * (800 - t * 600) * Math.PI) * Math.exp(-t * 4) * 0.15;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  } catch (e) {}
}

export function playLadderSound(): void {
  try {
    const ctx = getAudioContext();
    // Ascending notes
    const notes = [400, 500, 600, 700, 800];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.12);
    });
  } catch (e) {}
}

export function playWinSound(): void {
  try {
    const ctx = getAudioContext();
    // Victory fanfare
    const notes = [523, 659, 784, 1047, 784, 1047];
    const durations = [0.15, 0.15, 0.15, 0.3, 0.15, 0.4];
    let time = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + durations[i]);

      time += durations[i] * 0.8;
    });
  } catch (e) {}
}
