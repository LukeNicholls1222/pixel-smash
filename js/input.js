// キーボードとゲームパッドを、プレイヤーごとの同じ形の入力にまとめる。
// 上とジャンプは別のボタン。スマッシュは専用ボタン（または右スティック）でも出せる。
(function () {
  const KEYS = [
    { l: ['KeyA'], r: ['KeyD'], u: ['KeyW'], d: ['KeyS'], a: ['KeyJ'], b: ['KeyK'], sh: ['KeyL', 'ShiftLeft'], j: ['Space'], sm: ['KeyI'] },
    { l: ['ArrowLeft'], r: ['ArrowRight'], u: ['ArrowUp'], d: ['ArrowDown'], a: ['Comma'], b: ['Period'], sh: ['Slash', 'ShiftRight'], j: ['Enter', 'Numpad0'], sm: ['KeyM'] },
  ];
  const down = new Set();
  const PREVENT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Slash', 'Enter']);
  addEventListener('keydown', (e) => { down.add(e.code); if (PREVENT.has(e.code) && !e.target.closest?.('select,input,button')) e.preventDefault(); });
  addEventListener('keyup', (e) => down.delete(e.code));
  addEventListener('blur', () => down.clear());
  const any = (codes) => codes.some((c) => down.has(c)) ? 1 : 0;

  function blank() {
    return { l: 0, r: 0, u: 0, d: 0, a: 0, b: 0, sh: 0, j: 0, sm: 0,
      aP: 0, bP: 0, jP: 0, shP: 0, smP: 0, smx: 0, smy: 0,
      lTap: 99, rTap: 99, uTap: 99, dTap: 99, x: 0, y: 0 };
  }

  class Input {
    constructor(idx) { this.idx = idx; this.s = blank(); this.virtual = null; this.cPrev = { x: 0, y: 0 }; }
    setVirtual(v) { this.virtual = v; }
    read() {
      const k = KEYS[this.idx];
      let raw = { l: 0, r: 0, u: 0, d: 0, a: 0, b: 0, sh: 0, j: 0, sm: 0 };
      let cx = 0, cy = 0;
      if (this.virtual) raw = { ...raw, ...this.virtual };
      else {
        for (const key of Object.keys(raw)) raw[key] = any(k[key]);
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
          cx = gp.axes[2] || 0; cy = gp.axes[3] || 0;
        }
      }
      const p = this.s, n = { ...raw };
      n.aP = raw.a && !p.a ? 1 : 0; n.bP = raw.b && !p.b ? 1 : 0; n.jP = raw.j && !p.j ? 1 : 0; n.shP = raw.sh && !p.sh ? 1 : 0;
      // スマッシュボタン。押した瞬間に、押している方向を添える
      n.smP = raw.sm && !p.sm ? 1 : 0; n.smx = raw.r - raw.l; n.smy = raw.d - raw.u;
      // 右スティックをはじいた瞬間もスマッシュ（Cスティック）
      const cm = Math.hypot(cx, cy), pm = Math.hypot(this.cPrev.x, this.cPrev.y);
      if (cm > 0.6 && pm <= 0.6) { n.smP = 1; n.smx = Math.abs(cx) > Math.abs(cy) ? Math.sign(cx) : 0; n.smy = Math.abs(cy) >= Math.abs(cx) ? Math.sign(cy) : 0; }
      this.cPrev = { x: cx, y: cy };
      n.lTap = raw.l && !p.l ? 0 : p.lTap + 1;
      n.rTap = raw.r && !p.r ? 0 : p.rTap + 1;
      n.uTap = raw.u && !p.u ? 0 : p.uTap + 1;
      n.dTap = raw.d && !p.d ? 0 : p.dTap + 1;
      n.x = raw.r - raw.l; n.y = raw.d - raw.u;
      this.s = n;
      return n;
    }
  }
  window.INPUT = { Input, blank, KEYS };
})();
