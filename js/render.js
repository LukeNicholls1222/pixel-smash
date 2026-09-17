// 描画。関節つきの人体、影、質感のあるステージ。
(function () {
  const K = window.K, PI = Math.PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  const rot = (len, ang) => [Math.sin(ang) * len, Math.cos(ang) * len];

  // ---------- カメラ ----------
  const cam = { x: 320, y: 200, z: 1, sx: 0, sy: 0 };
  function updateCamera(fs, shake) {
    const alive = fs.filter((f) => !f.dead);
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    (alive.length ? alive : fs).forEach((f) => { minX = Math.min(minX, f.x); maxX = Math.max(maxX, f.x); minY = Math.min(minY, f.y - 44); maxY = Math.max(maxY, f.y); });
    const F = K.STAGE.floor;
    minX = Math.min(minX, F.x + 40); maxX = Math.max(maxX, F.x + F.w - 40); minY = Math.min(minY, 150); maxY = Math.max(maxY, F.y + 10);
    const bw = maxX - minX + 220, bh = maxY - minY + 170;
    const tz = Math.max(0.6, Math.min(1.3, Math.min(K.W / bw, K.H / bh)));
    cam.z = lerp(cam.z, tz, 0.08); cam.x = lerp(cam.x, (minX + maxX) / 2, 0.1); cam.y = lerp(cam.y, (minY + maxY) / 2 + 8, 0.1);
    cam.sx = shake ? (Math.random() - 0.5) * shake : 0; cam.sy = shake ? (Math.random() - 0.5) * shake : 0;
  }
  function begin(ctx) { ctx.save(); ctx.translate(K.W / 2 + cam.sx, K.H / 2 + cam.sy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y); }
  function end(ctx) { ctx.restore(); }

  // ---------- ステージ ----------
  function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function stage(ctx, f) {
    // 空
    const sky = ctx.createLinearGradient(0, -300, 0, 420);
    sky.addColorStop(0, '#0f1e4a'); sky.addColorStop(0.45, '#3e6fc4'); sky.addColorStop(0.85, '#9fc6ea'); sky.addColorStop(1, '#f2d9b0');
    ctx.fillStyle = sky; ctx.fillRect(-2500, -2500, 6000, 6000);
    // 太陽
    const sun = ctx.createRadialGradient(520, 40, 4, 520, 40, 90);
    sun.addColorStop(0, 'rgba(255,250,220,1)'); sun.addColorStop(0.15, 'rgba(255,235,170,0.9)'); sun.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = sun; ctx.fillRect(400, -80, 260, 260);
    // 遠くの山（かすみ）
    const layers = [[0.02, 210, 150, 'rgba(120,150,210,0.55)'], [0.05, 240, 110, 'rgba(70,100,170,0.75)'], [0.09, 262, 80, 'rgba(40,70,130,0.95)']];
    layers.forEach(([sp, base, h, col], li) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-1500, 900);
      for (let i = -8; i < 20; i++) { const x = i * 180 - ((f * sp) % 180); const ph = rnd(i + li * 50); ctx.lineTo(x, base); ctx.lineTo(x + 60 + ph * 40, base - h * (0.6 + ph * 0.6)); ctx.lineTo(x + 130, base - h * 0.35 * rnd(i * 3 + li)); }
      ctx.lineTo(3000, base); ctx.lineTo(3000, 900); ctx.fill();
    });
    // 雲
    for (let i = -3; i < 10; i++) {
      const x = i * 300 - ((f * 0.25) % 300), y = 20 + rnd(i) * 90, s = 0.8 + rnd(i + 7) * 0.8;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      [[0, 0, 26], [22, -6, 20], [44, 2, 24], [20, 8, 30]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s, r * s, r * 0.55 * s, 0, 0, PI * 2); ctx.fill(); });
    }
    // 足場（岩）
    const F = K.STAGE.floor;
    const rock = ctx.createLinearGradient(0, F.y, 0, F.y + 420); rock.addColorStop(0, '#6b5a4a'); rock.addColorStop(0.3, '#4f4034'); rock.addColorStop(1, '#2a2119');
    ctx.fillStyle = rock; ctx.beginPath(); ctx.moveTo(F.x, F.y); ctx.lineTo(F.x + F.w, F.y); ctx.lineTo(F.x + F.w + 14, F.y + 60); ctx.lineTo(F.x + F.w - 6, F.y + 420); ctx.lineTo(F.x + 6, F.y + 420); ctx.lineTo(F.x - 14, F.y + 60); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 26; i++) { const y = F.y + 14 + i * 15 + rnd(i) * 6; ctx.beginPath(); ctx.moveTo(F.x + 4 + rnd(i * 2) * 30, y); ctx.lineTo(F.x + F.w - 4 - rnd(i * 5) * 40, y + rnd(i * 7) * 6 - 3); ctx.stroke(); }
    // 側面の影
    const sideL = ctx.createLinearGradient(F.x - 14, 0, F.x + 40, 0); sideL.addColorStop(0, 'rgba(0,0,0,0.45)'); sideL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sideL; ctx.fillRect(F.x - 14, F.y, 54, 420);
    const sideR = ctx.createLinearGradient(F.x + F.w + 14, 0, F.x + F.w - 40, 0); sideR.addColorStop(0, 'rgba(0,0,0,0.45)'); sideR.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sideR; ctx.fillRect(F.x + F.w - 40, F.y, 54, 420);
    // 草
    const grass = ctx.createLinearGradient(0, F.y - 8, 0, F.y + 6); grass.addColorStop(0, '#7dc94a'); grass.addColorStop(1, '#3f8a24');
    ctx.fillStyle = grass; ctx.fillRect(F.x - 2, F.y - 7, F.w + 4, 12);
    ctx.strokeStyle = '#2f6e1a'; ctx.lineWidth = 1.2;
    for (let x = F.x + 2; x < F.x + F.w; x += 5) { const h = 4 + rnd(x) * 5; ctx.beginPath(); ctx.moveTo(x, F.y - 6); ctx.lineTo(x + (rnd(x * 3) - 0.5) * 4, F.y - 6 - h); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(F.x - 2, F.y + 4, F.w + 4, 3);
    // 浮いている石の足場
    K.STAGE.plats.forEach((p) => {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + 16, p.w / 2, 5, 0, 0, PI * 2); ctx.fill();
      const g = ctx.createLinearGradient(0, p.y, 0, p.y + 10); g.addColorStop(0, '#a89b8c'); g.addColorStop(0.5, '#7f7367'); g.addColorStop(1, '#4e463e');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.w, p.y); ctx.lineTo(p.x + p.w - 6, p.y + 10); ctx.lineTo(p.x + 6, p.y + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(p.x + 2, p.y, p.w - 4, 2);
      ctx.fillStyle = '#5f9e3a'; ctx.fillRect(p.x + 4, p.y - 1, p.w - 8, 2);
    });
  }

  // ---------- ポーズ（関節の角度） ----------
  // 角度は 0 = 真下、正 = 前。膝と肘は親の骨からの相対角。
  const BASE = { tF: 0.05, kF: -0.08, tB: -0.05, kB: -0.05, aF: 0.25, eF: 0.4, aB: -0.2, eB: 0.5, lean: 0, crouch: 0, head: 0, spin: 0, wpn: 0.35 };
  const P = (o) => ({ ...BASE, ...o });
  const POSES = {
    idle: P({}),
    jump: P({ tF: 1.2, kF: -1.7, tB: 0.3, kB: -1.0, aF: 2.0, eF: 0.4, aB: -1.0, eB: 0.9, lean: 0.05 }),
    fall: P({ tF: 0.5, kF: -0.7, tB: -0.2, kB: -0.4, aF: 1.3, eF: 0.5, aB: -1.3, eB: 0.5 }),
    helpless: P({ tF: 0.7, kF: -0.8, tB: -0.6, kB: -0.5, aF: 2.8, eF: 0.4, aB: -2.6, eB: -0.4, head: -0.3 }),
    shield: P({ crouch: 3, tF: 0.3, kF: -0.6, tB: -0.3, kB: -0.5, aF: 1.1, eF: 1.7, aB: 0.9, eB: 1.7, lean: 0.1 }),
    landing: P({ crouch: 5, tF: 0.5, kF: -1.0, tB: -0.4, kB: -0.9, aF: 0.6, eF: 0.8, aB: -0.5, eB: 0.8, lean: 0.2 }),
    stun: P({ crouch: 4, lean: -0.1, head: 0.3, aF: 0.5, eF: 1.2, aB: -0.4, eB: 1.2 }),
    hitstun: P({ lean: -0.7, head: -0.5, tF: 1.1, kF: -0.4, tB: -0.7, kB: -0.3, aF: 2.3, eF: -0.3, aB: -2.2, eB: 0.4 }),
    ledge: P({ tF: 0.25, kF: -0.35, tB: -0.15, kB: -0.25, aF: 3.05, eF: 0.0, aB: 3.0, eB: 0.05, head: -0.4 }),
    jumpsquat: P({ crouch: 6, tF: 0.5, kF: -1.1, tB: -0.4, kB: -1.0, aF: -0.3, eF: 0.4, aB: 0.3, eB: 0.4, lean: 0.2 }),
  };
  const FAM = {
    fwd:  [P({ aF: -0.9, eF: 1.3, aB: 0.7, eB: 0.6, lean: -0.15, tF: 0.15, kF: -0.3, tB: -0.3, kB: -0.2 }), P({ aF: 1.65, eF: 0.05, aB: -1.0, eB: 0.8, lean: 0.35, tF: 0.8, kF: -0.5, tB: -0.6, kB: -0.15, wpn: 0.1 })],
    up:   [P({ aF: 0.3, eF: 1.5, aB: -0.3, eB: 0.8, lean: 0.15, crouch: 2 }), P({ aF: 3.05, eF: -0.1, aB: -0.7, eB: 0.6, lean: -0.15, wpn: 0.0 })],
    low:  [P({ aF: 0.2, eF: 1.1, aB: -0.4, eB: 0.6, crouch: 3 }), P({ aF: 1.35, eF: 0.15, aB: -0.8, eB: 0.6, crouch: 8, tF: 1.2, kF: -1.5, tB: -0.35, kB: -0.7, lean: 0.3, wpn: 0.25 })],
    both: [P({ aF: 0.4, eF: 1.3, aB: -0.4, eB: 1.3, crouch: 3 }), P({ aF: 1.6, eF: 0.05, aB: -1.6, eB: -0.05, crouch: 6, tF: 0.7, kF: -0.4, tB: -0.7, kB: -0.4 })],
    back: [P({ aB: 0.5, eB: 1.2, aF: 0.4, eF: 0.8, lean: 0.15 }), P({ aB: -1.7, eB: -0.05, aF: 0.7, eF: 0.9, lean: -0.3, tF: 0.4, kF: -0.4, tB: -0.5, kB: -0.3 })],
    down: [P({ aF: 2.2, eF: 0.6, aB: -0.6, eB: 0.6, tF: 0.6, kF: -0.8, tB: -0.3, kB: -0.5 }), P({ aF: 0.15, eF: 0.1, aB: 0.3, eB: 0.2, tF: 0.15, kF: -0.1, tB: -0.1, kB: -0.05, lean: 0.15, wpn: -0.1 })],
    spin: [P({ aF: 0.6, eF: 0.8, aB: -0.6, eB: 0.8 }), P({ aF: 1.5, eF: 0.05, aB: -1.5, eB: -0.05, tF: 0.4, kF: -0.6, tB: -0.4, kB: -0.6 })],
  };
  function mix(a, b, t) { const o = {}; for (const k in BASE) o[k] = lerp(a[k], b[k], t); return o; }
  function famOf(mv) {
    return /^(jab|ftilt|fair|fsmash|nspecial)$/.test(mv) ? 'fwd' : /^(utilt|usmash|uair|upspecial)$/.test(mv) ? 'up'
      : mv === 'dtilt' ? 'low' : mv === 'dsmash' ? 'both' : mv === 'bair' ? 'back' : mv === 'dair' ? 'down' : 'spin';
  }
  function pose(fg, f) {
    const t = fg.stateT;
    switch (fg.state) {
      case 'idle': { const p = { ...POSES.idle }; p.aF += Math.sin(f * 0.08) * 0.05; p.crouch = Math.sin(f * 0.08) * 0.6 + 0.6; return p; }
      case 'walk': case 'run': {
        const run = fg.state === 'run', ph = t * (run ? 0.42 : 0.28), A = run ? 0.95 : 0.55;
        const p = { ...POSES.idle };
        const s = Math.sin(ph), c = Math.cos(ph);
        p.tF = A * s; p.kF = -(0.25 + Math.max(0, c) * (run ? 1.3 : 0.7));
        p.tB = -A * s; p.kB = -(0.25 + Math.max(0, -c) * (run ? 1.3 : 0.7));
        p.aF = -A * s * 0.8 + 0.2; p.eF = 0.9 + Math.max(0, -s) * 0.4; p.aB = A * s * 0.8 - 0.2; p.eB = 0.9 + Math.max(0, s) * 0.4;
        p.lean = run ? 0.28 : 0.08; p.crouch = Math.abs(c) * (run ? 1.5 : 0.6);
        return p;
      }
      case 'air': return mix(POSES.jump, POSES.fall, Math.max(0, Math.min(1, (fg.vy + 6) / 10)));
      case 'helpless': { const p = { ...POSES.helpless }; p.aF += Math.sin(t * 0.5) * 0.4; p.aB -= Math.sin(t * 0.5) * 0.4; return p; }
      case 'hitstun': { const p = { ...POSES.hitstun }; if (fg.tumble) { p.spin = t * 0.35; } return p; }
      case 'attack': return attackPose(fg);
      default: return POSES[fg.state] || POSES.idle;
    }
  }
  function attackPose(fg) {
    const md = fg.md, s = md.startup, a = md.active, r = md.recover, t = fg.moveT;
    const fam = famOf(fg.move), [wind, hit] = FAM[fam];
    let p;
    if (t <= s) p = mix(wind, hit, Math.pow(t / s, 2.6));
    else if (t <= s + a) { p = { ...hit }; if (fam === 'spin') p.spin = ((t - s) / a) * PI * 2; }
    else { const k = (t - s - a) / r; p = mix(hit, fg.grounded ? POSES.idle : POSES.fall, 1 - Math.pow(1 - k, 2)); }
    if (md.charge && t === s - 1) { p.lean = -0.3 + Math.sin(fg.chargeT * 0.9) * 0.05; p.aF = -1.2; p.eF = 1.4; }
    if (!fg.grounded && fam !== 'down') { p.tF = Math.max(p.tF, 0.5); p.kF = Math.min(p.kF, -0.5); }
    return p;
  }

  // ---------- 人体 ----------
  function limb(ctx, x0, y0, x1, y1, w, col, outline) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (outline) { ctx.strokeStyle = 'rgba(15,12,20,0.95)'; ctx.lineWidth = w + 2.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    else {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = Math.max(1, w * 0.35); ctx.beginPath(); ctx.moveTo(x0 - 1, y0 - 0.5); ctx.lineTo(x1 - 1, y1 - 0.5); ctx.stroke();
    }
  }
  function shade(hex, k) { // 明るさ調整
    const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, r * k)); g = Math.max(0, Math.min(255, g * k)); b = Math.max(0, Math.min(255, b * k));
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function body(ctx, fg, p, x, y, facing, alpha = 1) {
    const c = fg.c.col, wp = fg.c.weapon;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y - p.crouch); ctx.scale(facing, 1);
    ctx.rotate(p.spin || 0); ctx.rotate(p.lean * 0.5);
    const hip = [0, -19], chest = [0, -33];
    const knee = (t) => [hip[0] + rot(10.5, t)[0], hip[1] + rot(10.5, t)[1]];
    const foot = (t, k) => { const kn = knee(t); const r = rot(10, t + k); return [kn, [kn[0] + r[0], kn[1] + r[1]]]; };
    const elbow = (sx, a) => [sx + rot(9, a)[0], chest[1] + 2 + rot(9, a)[1]];
    const hand = (sx, a, e) => { const el = elbow(sx, a); const r = rot(8.5, a + e); return [el, [el[0] + r[0], el[1] + r[1]]]; };
    const [knB, ftB] = foot(p.tB, p.kB), [knF, ftF] = foot(p.tF, p.kF);
    const [elB, hdB] = hand(-3, p.aB, p.eB), [elF, hdF] = hand(3, p.aF + (p.spin ? 0 : 0), p.eF);
    for (const outline of [true, false]) {
      // 後ろの脚
      limb(ctx, hip[0] - 2, hip[1], knB[0], knB[1], 6, shade(c.body2, 0.85), outline);
      limb(ctx, knB[0], knB[1], ftB[0], ftB[1], 5, shade(c.body2, 0.8), outline);
      // 後ろの腕
      limb(ctx, -3, chest[1] + 2, elB[0], elB[1], 5, shade(c.body, 0.8), outline);
      limb(ctx, elB[0], elB[1], hdB[0], hdB[1], 4.5, shade(c.skin, 0.85), outline);
      if (!outline) fist(ctx, hdB, c, wp, 0.85);
      // 胴
      if (outline) { ctx.fillStyle = 'rgba(15,12,20,0.95)'; torsoPath(ctx, 1.4); ctx.fill(); }
      else { const g = ctx.createLinearGradient(-7, -33, 7, -19); g.addColorStop(0, shade(c.body, 1.15)); g.addColorStop(0.55, c.body); g.addColorStop(1, shade(c.body, 0.7)); ctx.fillStyle = g; torsoPath(ctx, 0); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-5, -22, 10, 3); }
      // 前の脚
      limb(ctx, hip[0] + 2, hip[1], knF[0], knF[1], 6, c.body2, outline);
      limb(ctx, knF[0], knF[1], ftF[0], ftF[1], 5, shade(c.body2, 0.95), outline);
      if (!outline) { shoe(ctx, ftB, p.tB + p.kB, c); shoe(ctx, ftF, p.tF + p.kF, c); }
      // 頭
      head(ctx, fg, p, outline);
      // 前の腕
      limb(ctx, 3, chest[1] + 2, elF[0], elF[1], 5, c.body, outline);
      limb(ctx, elF[0], elF[1], hdF[0], hdF[1], 4.5, c.skin, outline);
      if (!outline) fist(ctx, hdF, c, wp, 1);
      // 武器
      if (wp === 'sword') sword(ctx, hdF, p.aF + p.eF + p.wpn, c, outline);
    }
    ctx.restore();
    return { hand: hdF };
  }
  function torsoPath(ctx, pad) {
    ctx.beginPath(); ctx.moveTo(-7.5 - pad, -34 - pad); ctx.quadraticCurveTo(0, -36 - pad, 7.5 + pad, -34 - pad);
    ctx.lineTo(6 + pad, -18 + pad); ctx.quadraticCurveTo(0, -16 + pad, -6 - pad, -18 + pad); ctx.closePath();
  }
  function shoe(ctx, ft, ang, c) {
    ctx.save(); ctx.translate(ft[0], ft[1]); ctx.rotate(-ang * 0.3);
    ctx.fillStyle = 'rgba(15,12,20,0.95)'; ctx.beginPath(); ctx.ellipse(1.5, 0.5, 5.2, 3.2, 0, 0, PI * 2); ctx.fill();
    ctx.fillStyle = shade(c.body2, 0.55); ctx.beginPath(); ctx.ellipse(1.5, 0.3, 4.2, 2.4, 0, 0, PI * 2); ctx.fill();
    ctx.restore();
  }
  function fist(ctx, hd, c, wp, k) {
    const r = wp === 'fist' ? 4.2 : 2.6;
    ctx.fillStyle = 'rgba(15,12,20,0.95)'; ctx.beginPath(); ctx.arc(hd[0], hd[1], r + 1, 0, PI * 2); ctx.fill();
    ctx.fillStyle = wp === 'fist' ? shade(c.glove || c.body2, k) : shade(c.skin, k); ctx.beginPath(); ctx.arc(hd[0], hd[1], r, 0, PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(hd[0] - r * 0.3, hd[1] - r * 0.3, r * 0.4, 0, PI * 2); ctx.fill();
  }
  function head(ctx, fg, p, outline) {
    const c = fg.c.col, hx = 1.2, hy = -42 + p.head * 2;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(p.head * 0.4);
    if (outline) { ctx.fillStyle = 'rgba(15,12,20,0.95)'; ctx.beginPath(); ctx.arc(0, 0, 7.6, 0, PI * 2); ctx.fill(); ctx.restore(); return; }
    const g = ctx.createRadialGradient(-2, -2.5, 1, 0, 0, 7); g.addColorStop(0, shade(c.skin, 1.12)); g.addColorStop(1, shade(c.skin, 0.78));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 6.6, 0, PI * 2); ctx.fill();
    // 髪
    ctx.fillStyle = c.hair;
    if (fg.c.id === 'kai') { ctx.beginPath(); ctx.moveTo(-7, -1); ctx.quadraticCurveTo(-6, -8, 0, -7.5); ctx.quadraticCurveTo(6, -8, 7, -2); ctx.lineTo(4, -3); ctx.lineTo(2, -5.5); ctx.lineTo(0, -3.5); ctx.lineTo(-2.5, -5.5); ctx.lineTo(-5, -3); ctx.closePath(); ctx.fill(); ctx.fillRect(-7.5, -3, 2, 4); }
    else if (fg.c.id === 'goro') { ctx.beginPath(); ctx.arc(0, -1, 6.8, PI, 0); ctx.fill(); ctx.fillRect(-6.8, -1, 13.6, 1.5); ctx.fillStyle = shade(c.hair, 1.3); ctx.fillRect(-4, 3.5, 8, 2.2); }
    else { ctx.beginPath(); ctx.arc(0, -0.5, 7, PI, 0); ctx.fill(); ctx.fillStyle = c.body2; ctx.fillRect(-7, 1.5, 14, 6); ctx.fillStyle = c.acc; ctx.fillRect(-7.2, -3.2, 14.4, 2.2); }
    // 目
    ctx.fillStyle = '#1a1418'; ctx.beginPath(); ctx.ellipse(3.2, -0.5, 1.1, 1.5, 0, 0, PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(-0.6, -0.5, 0.9, 1.4, 0, 0, PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(30,20,20,0.7)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(1.6, -2.8); ctx.lineTo(4.6, -2.4); ctx.stroke();
    ctx.restore();
  }
  function sword(ctx, hd, ang, c, outline) {
    ctx.save(); ctx.translate(hd[0], hd[1]); ctx.rotate(-ang);
    // 上向きの座標系で描く（ang=0で下向きだったものを rotate で合わせる）
    ctx.rotate(PI);
    if (outline) { ctx.fillStyle = 'rgba(15,12,20,0.95)'; ctx.beginPath(); ctx.moveTo(-2.6, -2); ctx.lineTo(-1.2, -25); ctx.lineTo(0, -28); ctx.lineTo(1.2, -25); ctx.lineTo(2.6, -2); ctx.closePath(); ctx.fill(); ctx.fillRect(-5.5, -3, 11, 2.6); }
    else {
      const g = ctx.createLinearGradient(-2, 0, 2, 0); g.addColorStop(0, '#eef2f8'); g.addColorStop(0.5, '#9aa4b4'); g.addColorStop(1, '#dfe5ee');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-1.8, -2); ctx.lineTo(-0.9, -24); ctx.lineTo(0, -27); ctx.lineTo(0.9, -24); ctx.lineTo(1.8, -2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, -23); ctx.stroke();
      ctx.fillStyle = shade(c.acc, 0.9); ctx.fillRect(-4.8, -2.4, 9.6, 1.8); ctx.fillStyle = '#4a3220'; ctx.fillRect(-1.2, -0.6, 2.4, 4);
    }
    ctx.restore();
  }

  // ---------- ファイター全体 ----------
  function groundUnder(fg) {
    const F = K.STAGE.floor; let best = null;
    if (fg.x >= F.x - 6 && fg.x <= F.x + F.w + 6 && F.y >= fg.y - 1) best = F.y;
    K.STAGE.plats.forEach((p) => { if (fg.x >= p.x - 4 && fg.x <= p.x + p.w + 4 && p.y >= fg.y - 1 && (best === null || p.y < best)) best = p.y; });
    return best;
  }
  function fighter(ctx, fg, f, world) {
    if (fg.dead) return;
    const p = pose(fg, f);
    // 影
    const gy = groundUnder(fg);
    if (gy !== null) { const h = Math.max(0, gy - fg.y), k = Math.max(0.25, 1 - h / 160); ctx.fillStyle = `rgba(0,0,0,${0.35 * k})`; ctx.beginPath(); ctx.ellipse(fg.x, gy + 1, 11 * k, 3.2 * k, 0, 0, PI * 2); ctx.fill(); }
    // 残像（シノの上B）
    fg.trail.forEach((t) => body(ctx, fg, POSES.jump, t.x, t.y, t.f, t.life / 20));
    // 武器の軌跡
    if (fg.wtrail && fg.wtrail.length > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); fg.wtrail.forEach((w, i) => (i ? ctx.lineTo(w[0], w[1]) : ctx.moveTo(w[0], w[1]))); ctx.stroke();
    }
    const blink = fg.invuln > 0 && (f >> 2) % 2 === 0;
    const info = body(ctx, fg, p, fg.x, fg.y, fg.facing, blink ? 0.45 : 1);
    // 技中は手の位置を記録して軌跡にする
    const active = fg.state === 'attack' && fg.md && fg.moveT > fg.md.startup && fg.moveT <= fg.md.startup + fg.md.active;
    if (active) { const hx = fg.x + info.hand[0] * fg.facing, hy = fg.y - p.crouch + info.hand[1]; fg.wtrail.push([hx, hy]); if (fg.wtrail.length > 5) fg.wtrail.shift(); }
    else fg.wtrail.length = 0;
    // シールド
    if (fg.state === 'shield') {
      const r = 15 + (fg.shieldHP / 60) * 14;
      const g = ctx.createRadialGradient(fg.x, fg.y - 22, r * 0.2, fg.x, fg.y - 22, r);
      const col = fg.idx === 0 ? '255,190,40' : '70,140,255';
      g.addColorStop(0, `rgba(${col},0.1)`); g.addColorStop(0.85, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0.7)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fg.x, fg.y - 22, r, 0, PI * 2); ctx.fill();
    }
    // ため
    if (fg.state === 'attack' && fg.md && fg.md.charge && fg.chargeT > 0) {
      const r = 6 + fg.chargeT / 5, g = ctx.createRadialGradient(fg.x + fg.facing * 14, fg.y - 28, 1, fg.x + fg.facing * 14, fg.y - 28, r);
      g.addColorStop(0, 'rgba(255,240,180,0.9)'); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fg.x + fg.facing * 14, fg.y - 28, r, 0, PI * 2); ctx.fill();
    }
    // 1P/2P マーカー
    ctx.fillStyle = fg.idx === 0 ? '#ffc23a' : '#4a8cff'; ctx.beginPath(); ctx.moveTo(fg.x - 5, fg.y - 60); ctx.lineTo(fg.x + 5, fg.y - 60); ctx.lineTo(fg.x, fg.y - 54); ctx.closePath(); ctx.fill();
    if (world.debug) { const h = fg.hitbox(); if (h) { ctx.fillStyle = 'rgba(255,0,0,.35)'; ctx.fillRect(h.x, h.y, h.w, h.h); } const u = fg.hurt; ctx.strokeStyle = 'rgba(0,255,0,.6)'; ctx.strokeRect(u.x, u.y, u.w, u.h); }
  }

  // ---------- 飛び道具・エフェクト ----------
  function projectiles(ctx, ps) {
    ps.forEach((p) => {
      if (p.kind === 'beam') {
        const g = ctx.createLinearGradient(p.x - p.w / 2, 0, p.x + p.w / 2, 0); g.addColorStop(0, 'rgba(180,220,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(120,180,255,0.9)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.w / 2 + 3, p.h / 2 + 1, 0, 0, PI * 2); ctx.fill();
      } else {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * 0.6);
        ctx.fillStyle = '#c9ced8'; ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * PI / 2; ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7); ctx.lineTo(Math.cos(a + PI / 4) * 2.5, Math.sin(a + PI / 4) * 2.5); } ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#d8324e'; ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, PI * 2); ctx.fill();
        ctx.restore();
      }
    });
  }
  function effects(ctx, fx) {
    fx.forEach((e) => {
      if (e.t === 'spark') {
        const r = (10 - e.life) * 3 + 6, g = ctx.createRadialGradient(e.x, e.y, 1, e.x, e.y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.4, 'rgba(255,220,120,0.7)'); g.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (let i = 0; i < 7; i++) { const a = i * PI * 2 / 7 + e.life * 0.15, r0 = 4 + (10 - e.life), r1 = r0 + 8 + (10 - e.life) * 1.5; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * r0, e.y + Math.sin(a) * r0); ctx.lineTo(e.x + Math.cos(a) * r1, e.y + Math.sin(a) * r1); ctx.stroke(); }
      } else if (e.t === 'dust' || e.t === 'puff') {
        const s = 10 - e.life; ctx.fillStyle = `rgba(255,255,255,${0.5 * e.life / 10})`;
        ctx.beginPath(); ctx.arc(e.x - 6 - s * 1.5, e.y - 2 - s * 0.3, 3 + s * 0.4, 0, PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(e.x + 6 + s * 1.5, e.y - 2 - s * 0.3, 3 + s * 0.4, 0, PI * 2); ctx.fill();
      } else if (e.t === 'ko') {
        const r = (30 - e.life) * 5; ctx.strokeStyle = e.col; ctx.lineWidth = 5; ctx.globalAlpha = e.life / 30; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, PI * 2); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; for (let i = 0; i < 10; i++) { const a = i * PI / 5; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * r * 0.5, e.y + Math.sin(a) * r * 0.5); ctx.lineTo(e.x + Math.cos(a) * r * 1.1, e.y + Math.sin(a) * r * 1.1); ctx.stroke(); }
        ctx.globalAlpha = 1;
      } else if (e.t === 'shieldhit') { ctx.strokeStyle = `rgba(255,255,255,${e.life / 8})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(e.x, e.y, 34 - e.life * 2, 0, PI * 2); ctx.stroke(); }
      else if (e.t === 'break') { ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 10; i++) { const a = i * PI / 5, r = (20 - e.life) * 2.5; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 2.5, 0, PI * 2); ctx.fill(); } }
    });
  }

  // ---------- HUD ----------
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function hud(ctx, fs) {
    fs.forEach((fg, i) => {
      const x = i === 0 ? 110 : K.W - 110 - 150, y = K.H - 66, w = 150, h = 56;
      ctx.fillStyle = 'rgba(10,12,24,0.72)'; roundRect(ctx, x, y, w, h, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = i === 0 ? '#ffc23a' : '#4a8cff'; roundRect(ctx, x, y, w, 4, 2); ctx.fill();
      ctx.save(); ctx.translate(x + 22, y + 52); ctx.scale(0.85, 0.85); body(ctx, fg, POSES.idle, 0, 0, 1); ctx.restore();
      ctx.textAlign = 'left'; ctx.fillStyle = '#e8ecf4'; ctx.font = '700 10px "Noto Sans JP", system-ui, sans-serif'; ctx.fillText(`${i + 1}P  ${fg.name}`, x + 46, y + 18);
      const pc = Math.round(fg.percent), col = pc < 50 ? '#ffffff' : pc < 100 ? '#ffd45a' : pc < 150 ? '#ff8a3a' : '#ff3a3a';
      ctx.fillStyle = col; ctx.font = '900 24px "Noto Sans JP", system-ui, sans-serif'; ctx.fillText(`${pc}`, x + 46, y + 45);
      ctx.font = '900 12px "Noto Sans JP", system-ui, sans-serif'; ctx.fillText('%', x + 46 + ctx.measureText(String(pc)).width * 2 - 2, y + 45);
      for (let s = 0; s < fg.stocks; s++) { ctx.fillStyle = fg.c.col.body; ctx.beginPath(); ctx.arc(x + 112 + s * 12, y + 16, 4, 0, PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x + 111 + s * 12, y + 15, 1.5, 0, PI * 2); ctx.fill(); }
    });
  }
  function portrait(canvas, ch) {
    const ctx = canvas.getContext('2d'); const s = canvas.width / 30;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(canvas.width / 2, canvas.height - 3 * s); ctx.scale(s, s);
    body(ctx, { c: ch, trail: [], wtrail: [] }, POSES.idle, 0, 0, 1);
    ctx.restore();
  }

  window.RENDER = { cam, updateCamera, begin, end, stage, fighter, projectiles, effects, hud, portrait, body, POSES };
})();
