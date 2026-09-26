/**
 * Eliya Does Nails - Procedural Web Audio ASMR & Sound Engine
 * Synthesizes all tactile audio in real-time with zero external MP3 latency.
 */

class AtelierAudioEngine {
  constructor() {
    this.ctx = null;
    this.musicInterval = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // 1. TEA RITUAL: Liquid pouring into Celadon teacup
  playTeaPour() {
    this.init();
    const now = this.ctx.currentTime;
    for (let i = 0; i < 8; i++) {
      const t = now + i * 0.12 + Math.random() * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600 + Math.random() * 800, t);
      osc.frequency.exponentialRampToValueAtTime(1400 + Math.random() * 600, t + 0.08);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }

  // 2. GLASS FILE: Etched Czech tempered glass scraping ASMR
  playGlassFile() {
    this.init();
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3200, this.ctx.currentTime);
    filter.Q.setValueAtTime(4.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.18);
  }

  // 3. AIRBRUSH HISS: Aura micro-diffusion pneumatic mist
  playAirbrushHiss(duration = 1.2) {
    this.init();
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
    gain.gain.setValueAtTime(0.08, now + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  // 4. MAGNETIC CAT-EYE WAND: Velvet cosmic shimmer glide
  playMagneticShimmer() {
    this.init();
    const now = this.ctx.currentTime;
    [440, 660, 880, 1320].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.6);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04 / (idx + 1), now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    });
  }

  // 5. UV LAMP THE HALO: 432Hz warm curing hum + crystal triad chime
  playUVLampCure() {
    this.init();
    const now = this.ctx.currentTime;
    // Low soothing curing hum
    const humOsc = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    humOsc.type = "triangle";
    humOsc.frequency.setValueAtTime(108, now); // A2 sub-harmonic
    humGain.gain.setValueAtTime(0.12, now);
    humGain.gain.linearRampToValueAtTime(0.15, now + 1.5);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    humOsc.connect(humGain);
    humGain.connect(this.ctx.destination);
    humOsc.start(now);
    humOsc.stop(now + 2.5);

    // Chime Triad at cure completion (E-Major triad: E5, G#5, B5)
    [659.25, 830.61, 987.77].forEach((pitch, i) => {
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      const ct = now + 2.4 + i * 0.08;

      chimeOsc.type = "sine";
      chimeOsc.frequency.setValueAtTime(pitch, ct);

      chimeGain.gain.setValueAtTime(0.08, ct);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, ct + 1.4);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chimeOsc.start(ct);
      chimeOsc.stop(ct + 1.5);
    });
  }

  // 6. PHOTOBOOTH: Shutter mechanical click + capacitor flash whine
  playCameraShutter() {
    this.init();
    const now = this.ctx.currentTime;
    // Mechanical click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.04);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);

    // Flash recharge whine
    const whine = this.ctx.createOscillator();
    const whineGain = this.ctx.createGain();
    whine.type = "sine";
    whine.frequency.setValueAtTime(1200, now + 0.06);
    whine.frequency.exponentialRampToValueAtTime(4800, now + 0.55);

    whineGain.gain.setValueAtTime(0.03, now + 0.06);
    whineGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    whine.connect(whineGain);
    whineGain.connect(this.ctx.destination);
    whine.start(now + 0.06);
    whine.stop(now + 0.6);
  }

  // 7. AMSTERDAM BICYCLE BELL: Clear double ping (Ting-Ting!)
  playBicycleBell() {
    this.init();
    const now = this.ctx.currentTime;
    [0, 0.14].forEach((offset) => {
      const bt = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2093, bt); // C7 bell ring

      gain.gain.setValueAtTime(0.18, bt);
      gain.gain.exponentialRampToValueAtTime(0.0001, bt + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(bt);
      osc.stop(bt + 0.6);
    });
  }

  // 8. GENERATIVE LO-FI SOUNDTRACK: Procedural Rhodes piano chords
  startLoFiMusic() {
    this.init();
    if (this.musicInterval) return;

    // Cozy jazz chord progression: Fmaj7 -> Em7 -> Dm7 -> Cmaj7
    const chords = [
      [349.23, 440.00, 523.25, 659.25], // Fmaj7
      [329.63, 392.00, 493.88, 587.33], // Em7
      [293.66, 349.23, 440.00, 523.25], // Dm7
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
    ];
    let step = 0;

    const playChord = () => {
      if (this.isMuted) return;
      const now = this.ctx.currentTime;
      const currentNotes = chords[step % chords.length];

      currentNotes.forEach((pitch, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle"; // Warm electric piano tone
        osc.frequency.setValueAtTime(pitch, now + i * 0.03);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.025, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + 4.0);
      });

      step++;
    };

    playChord();
    this.musicInterval = setInterval(playChord, 4200);
  }

  stopLoFiMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

// Global window attachment
if (typeof window !== "undefined") {
  window.AtelierAudio = new AtelierAudioEngine();
}
