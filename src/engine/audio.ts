/**
 * Eliya Does Nails - Tactile Web Audio ASMR & Sound Engine
 * Real-time synthesis of glass filing, tea pouring, airbrush mist,
 * cat-eye magnetic shimmer, UV halo curing, and lo-fi Rhodes piano.
 */

export class ASMRSoundEngine {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  public isMuted: boolean = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // 1. TEA RITUAL: Liquid pouring into Celadon teacup
  public playTeaPour() {
    this.init();
    if (!this.ctx || this.isMuted) return;
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
  public playGlassFile() {
    this.init();
    if (!this.ctx || this.isMuted) return;
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
  public playAirbrushHiss(duration = 1.2) {
    this.init();
    if (!this.ctx || this.isMuted) return;
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
  public playMagneticShimmer() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [440, 660, 880, 1320].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.6);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04 / (idx + 1), now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    });
  }

  // 5. UV LAMP THE HALO: 432Hz warm curing hum + crystal triad chime
  public playUVLampCure() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const humOsc = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    humOsc.type = "triangle";
    humOsc.frequency.setValueAtTime(108, now);
    humGain.gain.setValueAtTime(0.12, now);
    humGain.gain.linearRampToValueAtTime(0.15, now + 1.5);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    humOsc.connect(humGain);
    humGain.connect(this.ctx.destination);
    humOsc.start(now);
    humOsc.stop(now + 2.5);

    [659.25, 830.61, 987.77].forEach((pitch, i) => {
      const chimeOsc = this.ctx!.createOscillator();
      const chimeGain = this.ctx!.createGain();
      const ct = now + 2.4 + i * 0.08;

      chimeOsc.type = "sine";
      chimeOsc.frequency.setValueAtTime(pitch, ct);

      chimeGain.gain.setValueAtTime(0.08, ct);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, ct + 1.4);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx!.destination);
      chimeOsc.start(ct);
      chimeOsc.stop(ct + 1.5);
    });
  }

  // 6. PHOTOBOOTH: Shutter mechanical click + capacitor flash whine
  public playCameraShutter() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
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
  public playBicycleBell() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [0, 0.14].forEach((offset) => {
      const bt = now + offset;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2093, bt);

      gain.gain.setValueAtTime(0.18, bt);
      gain.gain.exponentialRampToValueAtTime(0.0001, bt + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(bt);
      osc.stop(bt + 0.6);
    });
  }

  // 8. GENERATIVE MULTI-TRACK SOUNDTRACK JUKEBOX
  public currentTrackId: string = "lofi-chill";
  public isPlayingMusic: boolean = false;
  private trackChangeListeners: ((track: MusicTrack) => void)[] = [];
  private activeOscillators: OscillatorNode[] = [];

  public getTracks(): MusicTrack[] {
    return MUSIC_TRACKS;
  }

  public getCurrentTrack(): MusicTrack {
    return MUSIC_TRACKS.find((t) => t.id === this.currentTrackId) || MUSIC_TRACKS[0];
  }

  public onTrackChange(listener: (track: MusicTrack) => void) {
    this.trackChangeListeners.push(listener);
  }

  private notifyTrackChange() {
    const cur = this.getCurrentTrack();
    for (const listener of this.trackChangeListeners) {
      try {
        listener(cur);
      } catch (err) {
        console.error("Track change listener error:", err);
      }
    }
  }

  public setTrack(trackId: string) {
    if (this.currentTrackId === trackId && this.isPlayingMusic) return;
    const exists = MUSIC_TRACKS.some((t) => t.id === trackId);
    if (!exists) return;
    this.currentTrackId = trackId;
    this.notifyTrackChange();
    if (this.isPlayingMusic) {
      this.stopMusic();
      this.startMusic(trackId);
    }
  }

  public nextTrack(): MusicTrack {
    const idx = MUSIC_TRACKS.findIndex((t) => t.id === this.currentTrackId);
    const nextIdx = (idx + 1) % MUSIC_TRACKS.length;
    this.setTrack(MUSIC_TRACKS[nextIdx].id);
    return this.getCurrentTrack();
  }

  public prevTrack(): MusicTrack {
    const idx = MUSIC_TRACKS.findIndex((t) => t.id === this.currentTrackId);
    const prevIdx = (idx - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    this.setTrack(MUSIC_TRACKS[prevIdx].id);
    return this.getCurrentTrack();
  }

  public toggleMusic() {
    if (this.isPlayingMusic) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public startMusic(trackId?: string) {
    this.init();
    if (!this.ctx) return;
    if (trackId) {
      this.currentTrackId = trackId;
    }
    this.stopMusic();
    this.isPlayingMusic = true;
    this.notifyTrackChange();

    switch (this.currentTrackId) {
      case "sparkle-glass":
        this.playSparkleGlassTrack();
        break;
      case "canal-breeze":
        this.playCanalBreezeTrack();
        break;
      case "cat-eye-velvet":
        this.playCatEyeVelvetTrack();
        break;
      case "tea-ritual":
        this.playTeaRitualTrack();
        break;
      case "lofi-chill":
      default:
        this.playLoFiChillTrack();
        break;
    }
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch (_) {}
    }
    this.activeOscillators = [];
    this.isPlayingMusic = false;
  }

  // TRACK 1: Atelier Lo-Fi Chill (Rhodes Electric Piano & Warm Harmonics)
  private playLoFiChillTrack() {
    const chords = [
      [174.61, 261.63, 329.63, 392.00, 440.00], // Fmaj9
      [164.81, 246.94, 293.66, 392.00, 440.00], // Em7(11)
      [146.83, 220.00, 261.63, 329.63, 349.23], // Dm9
      [130.81, 196.00, 246.94, 293.66, 329.63], // Cmaj9
      [110.00, 220.00, 261.63, 329.63, 392.00], // Am9
      [116.54, 233.08, 293.66, 349.23, 392.00], // Bbmaj7(#11)
    ];
    const sparkleNotes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    let step = 0;

    const tick = () => {
      if (this.isMuted || !this.ctx || !this.isPlayingMusic) return;
      const now = this.ctx.currentTime;
      const currentNotes = chords[step % chords.length];

      // Warm Rhodes chords
      currentNotes.forEach((pitch, i) => {
        const osc = this.ctx!.createOscillator();
        const sub = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(pitch, now + i * 0.025);

        sub.type = "sine";
        sub.frequency.setValueAtTime(pitch * 2, now + i * 0.025);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.022, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.025);
        osc.stop(now + 4.0);
        sub.start(now + i * 0.025);
        sub.stop(now + 4.0);
      });

      // Improvised lo-fi high chime note
      const chimePitch = sparkleNotes[Math.floor(Math.random() * sparkleNotes.length)];
      const chimeTime = now + 1.4 + Math.random() * 0.8;
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = "sine";
      chimeOsc.frequency.setValueAtTime(chimePitch, chimeTime);

      chimeGain.gain.setValueAtTime(0.0001, chimeTime);
      chimeGain.gain.linearRampToValueAtTime(0.015, chimeTime + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, chimeTime + 1.2);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chimeOsc.start(chimeTime);
      chimeOsc.stop(chimeTime + 1.3);

      step++;
    };

    tick();
    this.musicInterval = setInterval(tick, 3900);
  }

  // TRACK 2: Sparkle Glass Aura (Crystalline Celeste Chimes & Ambient Celestial Drone)
  private playSparkleGlassTrack() {
    const arpeggios = [
      [392.00, 493.88, 587.33, 783.99, 987.77, 1174.66], // G Maj
      [329.63, 392.00, 493.88, 659.25, 783.99, 1046.50], // E min7
      [261.63, 329.63, 392.00, 523.25, 659.25, 783.99],  // C Maj
      [293.66, 369.99, 440.00, 587.33, 739.99, 880.00],  // D Maj
    ];
    let step = 0;

    const tick = () => {
      if (this.isMuted || !this.ctx || !this.isPlayingMusic) return;
      const now = this.ctx.currentTime;
      const pattern = arpeggios[step % arpeggios.length];

      // Celestial warm drone chord
      const dronePitch = pattern[0] / 2;
      const droneOsc = this.ctx.createOscillator();
      const droneGain = this.ctx.createGain();
      const droneFilter = this.ctx.createBiquadFilter();
      droneOsc.type = "sine";
      droneOsc.frequency.setValueAtTime(dronePitch, now);
      droneFilter.type = "lowpass";
      droneFilter.frequency.setValueAtTime(280, now);

      droneGain.gain.setValueAtTime(0.001, now);
      droneGain.gain.linearRampToValueAtTime(0.03, now + 0.8);
      droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

      droneOsc.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(this.ctx.destination);
      droneOsc.start(now);
      droneOsc.stop(now + 3.5);

      // Cascading crystal bells
      pattern.forEach((note, idx) => {
        const noteTime = now + idx * 0.17;
        const bellOsc = this.ctx!.createOscillator();
        const harmonicOsc = this.ctx!.createOscillator();
        const bellGain = this.ctx!.createGain();

        bellOsc.type = "sine";
        bellOsc.frequency.setValueAtTime(note, noteTime);

        harmonicOsc.type = "sine";
        harmonicOsc.frequency.setValueAtTime(note * 2.76, noteTime); // bell-like inharmonic

        bellGain.gain.setValueAtTime(0.0001, noteTime);
        bellGain.gain.linearRampToValueAtTime(0.018, noteTime + 0.01);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.8);

        bellOsc.connect(bellGain);
        harmonicOsc.connect(bellGain);
        bellGain.connect(this.ctx!.destination);

        bellOsc.start(noteTime);
        bellOsc.stop(noteTime + 1.9);
        harmonicOsc.start(noteTime);
        harmonicOsc.stop(noteTime + 1.9);
      });

      step++;
    };

    tick();
    this.musicInterval = setInterval(tick, 3400);
  }

  // TRACK 3: Canal Bicycle Breeze (Sunny Plucked Strings & Jaunty Groove)
  private playCanalBreezeTrack() {
    const bassNotes = [146.83, 185.00, 196.00, 220.00, 196.00, 185.00]; // D - F# - G - A
    const strumChords = [
      [293.66, 369.99, 440.00, 587.33], // D maj
      [392.00, 493.88, 587.33, 739.99], // G maj7
      [440.00, 554.37, 659.25, 880.00], // A maj
      [493.88, 587.33, 739.99, 880.00], // Bm7
    ];
    let step = 0;

    const tick = () => {
      if (this.isMuted || !this.ctx || !this.isPlayingMusic) return;
      const now = this.ctx.currentTime;

      // Downbeat walking bass pluck
      const bassPitch = bassNotes[step % bassNotes.length];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = "triangle";
      bassOsc.frequency.setValueAtTime(bassPitch, now);
      bassGain.gain.setValueAtTime(0.035, now);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.5);

      // Off-beat nylon guitar strum
      const chord = strumChords[Math.floor(step / 2) % strumChords.length];
      const strumTime = now + 0.22;
      chord.forEach((p, i) => {
        const sOsc = this.ctx!.createOscillator();
        const sGain = this.ctx!.createGain();
        sOsc.type = "sine";
        sOsc.frequency.setValueAtTime(p, strumTime + i * 0.015);
        sGain.gain.setValueAtTime(0.016, strumTime + i * 0.015);
        sGain.gain.exponentialRampToValueAtTime(0.0001, strumTime + 0.35);
        sOsc.connect(sGain);
        sGain.connect(this.ctx!.destination);
        sOsc.start(strumTime + i * 0.015);
        sOsc.stop(strumTime + 0.4);
      });

      step++;
    };

    tick();
    this.musicInterval = setInterval(tick, 450);
  }

  // TRACK 4: Midnight Cat-Eye Velvet (Lush Analog Synths & Filter Sweep)
  private playCatEyeVelvetTrack() {
    const synthChords = [
      [103.83, 207.65, 261.63, 311.13, 392.00], // Abmaj7
      [87.31, 174.61, 207.65, 261.63, 311.13],  // Fm7
      [116.54, 233.08, 277.18, 349.23, 415.30], // Bbm7
      [77.78, 155.56, 233.08, 277.18, 349.23],  // Eb7sus4
    ];
    let step = 0;

    const tick = () => {
      if (this.isMuted || !this.ctx || !this.isPlayingMusic) return;
      const now = this.ctx.currentTime;
      const chord = synthChords[step % synthChords.length];

      // Lush detuned analog saw/tri pad with sweeping filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(320, now + 3.6);
      filter.Q.setValueAtTime(2.2, now);

      const masterPadGain = this.ctx.createGain();
      masterPadGain.gain.setValueAtTime(0.001, now);
      masterPadGain.gain.linearRampToValueAtTime(0.024, now + 0.4);
      masterPadGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.9);

      chord.forEach((freq) => {
        const osc1 = this.ctx!.createOscillator();
        const osc2 = this.ctx!.createOscillator();
        osc1.type = "sawtooth";
        osc2.type = "triangle";
        osc1.frequency.setValueAtTime(freq * 0.998, now);
        osc2.frequency.setValueAtTime(freq * 1.002, now);

        osc1.connect(filter);
        osc2.connect(filter);
        osc1.start(now);
        osc1.stop(now + 4.1);
        osc2.start(now);
        osc2.stop(now + 4.1);
      });

      filter.connect(masterPadGain);
      masterPadGain.connect(this.ctx.destination);

      step++;
    };

    tick();
    this.musicInterval = setInterval(tick, 4100);
  }

  // TRACK 5: Slow Beauty Tea Ritual (Meditative Piano & Celadon Chime ASMR)
  private playTeaRitualTrack() {
    const pianoChords = [
      [138.59, 207.65, 261.63, 329.63, 415.30], // Dbmaj7
      [116.54, 174.61, 233.08, 277.18, 349.23], // Bbm7
      [92.50, 185.00, 233.08, 277.18, 369.99],  // Gbmaj7
      [103.83, 155.56, 207.65, 277.18, 329.63], // Absus4
    ];
    let step = 0;

    const tick = () => {
      if (this.isMuted || !this.ctx || !this.isPlayingMusic) return;
      const now = this.ctx.currentTime;
      const chord = pianoChords[step % pianoChords.length];

      // Mellow acoustic piano timbre
      chord.forEach((pitch, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(pitch, now + i * 0.04);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.026, now + i * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + 4.4);
      });

      // Celadon singing bowl harmonic resonance
      if (step % 2 === 0) {
        const bowlOsc = this.ctx.createOscillator();
        const bowlGain = this.ctx.createGain();
        bowlOsc.type = "sine";
        bowlOsc.frequency.setValueAtTime(864, now + 0.6);
        bowlGain.gain.setValueAtTime(0.0001, now + 0.6);
        bowlGain.gain.linearRampToValueAtTime(0.012, now + 0.7);
        bowlGain.gain.exponentialRampToValueAtTime(0.00001, now + 3.8);

        bowlOsc.connect(bowlGain);
        bowlGain.connect(this.ctx.destination);
        bowlOsc.start(now + 0.6);
        bowlOsc.stop(now + 4.0);
      }

      step++;
    };

    tick();
    this.musicInterval = setInterval(tick, 4500);
  }

  // Backward compatibility aliases
  public startLoFiMusic() {
    this.startMusic();
  }

  public stopLoFiMusic() {
    this.stopMusic();
  }
}

export interface MusicTrack {
  id: string;
  title: string;
  titleKo: string;
  mood: string;
  tempo: string;
  icon: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "lofi-chill",
    title: "Atelier Lo-Fi Chill",
    titleKo: "아틀리에 로파이 칠",
    mood: "Cozy Rhodes electric piano & warm vinyl harmony",
    tempo: "78 BPM",
    icon: "☕",
  },
  {
    id: "sparkle-glass",
    title: "Sparkle Glass Aura",
    titleKo: "스파클 글래스 아우라",
    mood: "Crystalline celeste chimes & celestial drone",
    tempo: "84 BPM",
    icon: "✨",
  },
  {
    id: "canal-breeze",
    title: "Canal Bicycle Breeze",
    titleKo: "운하 자전거 산책",
    mood: "Sunny acoustic plucks & walking bicycle groove",
    tempo: "120 BPM",
    icon: "🚲",
  },
  {
    id: "cat-eye-velvet",
    title: "Midnight Cat-Eye Velvet",
    titleKo: "미드나잇 벨벳 캣아이",
    mood: "Lush cosmic analog synths & tape-warmth filter",
    tempo: "72 BPM",
    icon: "🌌",
  },
  {
    id: "tea-ritual",
    title: "Slow Beauty Tea Ritual",
    titleKo: "슬로우 뷰티 다도",
    mood: "Reflective meditative piano & celadon bowl ASMR",
    tempo: "65 BPM",
    icon: "🍵",
  },
];

export const sound = new ASMRSoundEngine();

