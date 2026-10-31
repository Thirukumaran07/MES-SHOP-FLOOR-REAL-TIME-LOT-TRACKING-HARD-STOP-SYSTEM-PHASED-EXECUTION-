/**
 * Web Audio API synthesizer for industrial shop-floor audio cues
 * Provides immediate auditory feedback for operator hard-stops and successful scans
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * High-voltage warning klaxon / siren for QUARANTINE HARD-STOP
 */
export function playHardStopAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Dual-tone urgent alert pattern
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.setValueAtTime(440, now + 0.15); // A4
    osc1.frequency.setValueAtTime(880, now + 0.3); // A5
    osc1.frequency.setValueAtTime(440, now + 0.45);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(920, now);
    osc2.frequency.setValueAtTime(460, now + 0.15);
    osc2.frequency.setValueAtTime(920, now + 0.3);
    osc2.frequency.setValueAtTime(460, now + 0.45);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.warn('Audio alert unavailable:', err);
  }
}

/**
 * Pleasant melodic chime for SUCCESSFUL material issue
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  } catch (err) {
    console.warn('Audio alert unavailable:', err);
  }
}

/**
 * Short scanner chirp
 */
export function playScanChirp() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (err) {
    console.warn('Audio alert unavailable:', err);
  }
}
