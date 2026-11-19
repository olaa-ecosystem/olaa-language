let ctx: AudioContext | null = null;

/** Short synthesized feedback chime; silently no-ops where Web Audio is unavailable. */
export function playFeedback(kind: 'correct' | 'wrong' | 'complete'): void {
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    ctx ??= new AudioCtor();
    const notes =
      kind === 'correct' ? [660, 880] : kind === 'complete' ? [523, 659, 784, 1046] : [220, 180];
    notes.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      const start = ctx!.currentTime + i * 0.09;
      osc.type = kind === 'wrong' ? 'square' : 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(kind === 'wrong' ? 0.04 : 0.12, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  } catch {
    // Audio is a nicety; never break the lesson over it.
  }
}
