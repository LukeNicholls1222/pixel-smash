// キーボードとゲームパッドを、プレイヤーごとの同じ形の入力にまとめる
(function () {
  const KEYS = [
    { l: 'KeyA', r: 'KeyD', u: 'KeyW', d: 'KeyS', a: 'KeyJ', b: 'KeyK', sh: 'KeyL', j: 'Space' },
    { l: 'ArrowLeft', r: 'ArrowRight', u: 'ArrowUp', d: 'ArrowDown', a: 'Comma', b: 'Period', sh: 'Slash', j: 'Numpad0' },
  ];
  const down = new Set();
  addEventListener('keydown', (e) => { down.add(e.code); if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); });
  addEventListener('keyup', (e) => down.delete(e.code));
  addEventListener('blur', () => down.clear());

  function blank() {
    return { l: 0, r: 0, u: 0, d: 0, a: 0, b: 0, sh: 0, j: 0,
      aP: 0, bP: 0, jP: 0, shP: 0, lTap: 99, rTap: 99, uTap: 99, dTap: 99, x: 0, y: 0 };
  }

  class Input {
    constructor(idx) { this.idx = idx; this.s = blank(); this.prev = blank(); this.enabled = true; this.virtual = null; }
    // CPU はここに直接書く
    setVirtual(v) { this.virtual = v; }
    read() {
      const k = KEYS[this.idx];
      let raw = { l: 0, r: 0, u: 0, d: 0, a: 0, b: 0, sh: 0, j: 0 };
      if (this.virtual) raw = { ...raw, ...this.virtual };
      else if (this.enabled) {
        raw.l = down.has(k.l) ? 1 : 0; raw.r = down.has(k.r) ? 1 : 0; raw.u = down.has(k.u) ? 1 : 0; raw.d = down.has(k.d) ? 1 : 0;
        raw.a = down.has(k.a) ? 1 : 0; raw.b = down.has(k.b) ? 1 : 0; raw.sh = down.has(k.sh) ? 1 : 0; raw.j = down.has(k.j) ? 1 : 0;
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = pads && pads[this.idx];
        if (gp) {
          const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
          if (ax < -0.4 || gp.buttons[14]?.pressed) raw.l = 1;
          if (ax > 0.4 || gp.buttons[15]?.pressed) raw.r = 1;
          if (ay < -0.5 || gp.buttons[12]?.pressed) raw.u = 1;
          if (ay > 0.5 || gp.buttons[13]?.pressed) raw.d = 1;
          if (gp.buttons[0]?.pressed) raw.a = 1;
          if (gp.buttons[1]?.pressed) raw.b = 1;
          if (gp.buttons[2]?.pressed || gp.buttons[3]?.pressed) raw.j = 1;
          if ([4, 5, 6, 7].some((i) => gp.buttons[i]?.pressed)) raw.sh = 1;
        }
      }
      const p = this.s, n = { ...raw };
      n.aP = raw.a && !p.a ? 1 : 0; n.bP = raw.b && !p.b ? 1 : 0; n.jP = (raw.j && !p.j) || (raw.u && !p.u) ? 1 : 0; n.shP = raw.sh && !p.sh ? 1 : 0;
      // 方向を「はじいた」瞬間からの経過フレーム（スマッシュ判定に使う）
      n.lTap = raw.l && !p.l ? 0 : p.lTap + 1;
      n.rTap = raw.r && !p.r ? 0 : p.rTap + 1;
      n.uTap = raw.u && !p.u ? 0 : p.uTap + 1;
      n.dTap = raw.d && !p.d ? 0 : p.dTap + 1;
      n.x = raw.r - raw.l; n.y = raw.d - raw.u;
      this.prev = p; this.s = n;
      return n;
    }
  }
  window.INPUT = { Input, blank };
})();
