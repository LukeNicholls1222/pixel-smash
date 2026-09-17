// 効果音は全部その場で合成する
(function () {
  let ac = null, on = true;
  function ctx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
  function tone(freq, dur, type = 'square', vol = 0.05, slide = 0) {
    const a = ctx(); if (!a || !on) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
  }
  function noise(dur, vol = 0.08, lp = 1200) {
    const a = ctx(); if (!a || !on) return;
    const n = a.sampleRate * dur, buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = lp; s.buffer = buf; g.gain.value = vol;
    s.connect(f).connect(g).connect(a.destination); s.start();
  }
  window.SFX = {
    unlock: ctx,
    toggle() { on = !on; return on; },
    hit(dmg) { noise(0.08 + dmg * 0.006, 0.12, 900); tone(160 - dmg * 3, 0.12, 'square', 0.05, -80); },
    shield() { tone(520, 0.06, 'triangle', 0.05); },
    swing() { noise(0.05, 0.03, 2500); },
    jump() { tone(300, 0.08, 'square', 0.03, 220); },
    land() { noise(0.04, 0.03, 500); },
    ko() { noise(0.5, 0.2, 400); tone(90, 0.5, 'sawtooth', 0.08, -60); },
    proj() { tone(900, 0.06, 'square', 0.03, -300); },
    special() { tone(220, 0.15, 'sawtooth', 0.05, 400); },
    menu() { tone(660, 0.05, 'square', 0.04); },
    go() { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'square', 0.05), i * 90)); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'square', 0.05), i * 110)); },
  };
})();
