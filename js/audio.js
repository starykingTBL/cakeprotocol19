const Audio = (() => {
  let ctx = null, master = null, started = false;
  const FREQS = [220, 261.63, 329.63, 392.00];

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function tone(freq, dur, type='sine', vol=0.2) {
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.start(c.currentTime); o.stop(c.currentTime + dur);
    } catch(e) {}
  }

  function createReverb(c) {
    const conv = c.createConvolver();
    const len  = c.sampleRate * 2.5;
    const buf  = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 1.8);
    }
    conv.buffer = buf;
    return conv;
  }

  function startAmbient() {
    if (started) return;
    started = true;
    try {
      const c = getCtx();
      master = c.createGain();
      master.gain.setValueAtTime(0, c.currentTime);
      master.gain.linearRampToValueAtTime(0.1, c.currentTime + 5);
      master.connect(c.destination);
      const rev = createReverb(c);
      rev.connect(master);
      FREQS.forEach((f, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        const lfo = c.createOscillator();
        const lg  = c.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.value = 0.25 / FREQS.length;
        lfo.frequency.value = 0.08 + i*0.03; lg.gain.value = 1.5;
        lfo.connect(lg); lg.connect(o.frequency);
        o.connect(g); g.connect(rev);
        lfo.start(); o.start(c.currentTime + i*0.3);
      });
    } catch(e) {}
  }

  /* Game sound effects */
  const SFX = {
    score:   () => tone(880, 0.08, 'sine', 0.18),
    hit:     () => tone(300, 0.1, 'square', 0.12),
    eat:     () => { tone(523, 0.06, 'sine', 0.2); setTimeout(()=>tone(659, 0.08, 'sine', 0.18), 50); },
    die:     () => { tone(220, 0.2, 'sawtooth', 0.18); setTimeout(()=>tone(160, 0.4, 'sawtooth', 0.12), 150); },
    jump:    () => tone(440, 0.1, 'sine', 0.12),
    levelUp: () => [523,659,784,1047].forEach((f,i) => setTimeout(()=>tone(f,.12,'sine',.2),i*80)),
    tap:     () => tone(660, 0.04, 'sine', 0.1),
    match:   () => { tone(523, 0.08, 'sine', 0.15); setTimeout(()=>tone(784, 0.12, 'sine', 0.2), 60); },
    flip:    () => tone(440, 0.06, 'sine', 0.08),
    win:     () => [523,659,784,1047,1318].forEach((f,i)=>setTimeout(()=>tone(f,.15,'sine',.25),i*100)),
    combo:   () => tone(1000+Math.random()*200, 0.06, 'sine', 0.15),
    bonus:   () => { tone(800, 0.08, 'sine', 0.2); setTimeout(()=>tone(1000, 0.12, 'sine', 0.2), 60); },
  };

  return { startAmbient, SFX };
})();
