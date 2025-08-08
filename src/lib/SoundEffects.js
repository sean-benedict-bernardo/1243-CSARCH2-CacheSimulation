
// Sound effect for cache hit (higher pitch, shorter duration)
export function playCacheHitSound(ctx, isSoundEnabled) {
    if (!isSoundEnabled) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Quick, pleasant beep for cache hit
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.type = 'sine';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
}


// Sound effect for cache miss (lower pitch, longer duration)
export function playCacheMissSound(ctx, isSoundEnabled) {
    if (!isSoundEnabled) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Deeper, longer sound for cache miss
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.type = 'sawtooth';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
}

// Alternative: White noise burst for cache miss
export function playCacheMissNoise() {
    if (!isSoundEnabled) return;

    const ctx = initAudioContext();
    const bufferSize = ctx.sampleRate * 0.2; // 200ms of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Low-pass filter to make it less harsh
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + 0.2);
}


// Play completion sound when simulation finishes
export function playCompletionSound(ctx, isSoundEnabled) {
    if (!isSoundEnabled) return;

    // Play a rising chord progression
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G notes

    frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.2);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime + index * 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.2 + 0.3);

        oscillator.type = 'sine';
        oscillator.start(ctx.currentTime + index * 0.2);
        oscillator.stop(ctx.currentTime + index * 0.2 + 0.3);
    });
}