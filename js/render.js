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
  // 実際の人の比率（頭身 6.3）に寄せた骨格。手足は先に向かって細くなる円柱、
  // 光は画面の左上から。顔は 3/4 向きで両目を描く。
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, r * k)); g = Math.max(0, Math.min(255, g * k)); b = Math.max(0, Math.min(255, b * k));
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  const OUT = 'rgba(14,10,16,0.92)';
  let MODE = 'fill', LX = -1;
  // 先細りの円柱。p0 が根元、p1 が先。
  function cap(ctx, p0, p1, w0, w1, col) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
    let nx = -dy / L, ny = dx / L;
    if (nx * LX + ny * -0.7 < 0) { nx = -nx; ny = -ny; }   // 光の当たる側を決める
    if (MODE === 'outline') { w0 += 1.1; w1 += 1.1; ctx.fillStyle = OUT; }
    else {
      const g = ctx.createLinearGradient(p0[0] + nx * w0, p0[1] + ny * w0, p0[0] - nx * w0, p0[1] - ny * w0);
      g.addColorStop(0, shade(col, 1.28)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, 0.58));
      ctx.fillStyle = g;
    }
    ctx.beginPath();
    ctx.moveTo(p0[0] + nx * w0, p0[1] + ny * w0); ctx.lineTo(p1[0] + nx * w1, p1[1] + ny * w1);
    ctx.lineTo(p1[0] - nx * w1, p1[1] - ny * w1); ctx.lineTo(p0[0] - nx * w0, p0[1] - ny * w0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(p0[0], p0[1], w0, 0, PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p1[0], p1[1], w1, 0, PI * 2); ctx.fill();
  }
  function poly(ctx, pts, col, grad) {
    if (MODE === 'outline') { ctx.fillStyle = OUT; ctx.lineWidth = 2.2; ctx.strokeStyle = OUT; }
    else if (grad) ctx.fillStyle = grad; else ctx.fillStyle = col;
    ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill();
    if (MODE === 'outline') ctx.stroke();
  }
  function joint(ctx, pt, r) { // 関節の影
    if (MODE === 'outline') return;
    const g = ctx.createRadialGradient(pt[0], pt[1], 0, pt[0], pt[1], r); g.addColorStop(0, 'rgba(0,0,0,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pt[0], pt[1], r, 0, PI * 2); ctx.fill();
  }

  function body(ctx, fg, p, x, y, facing, alpha = 1) {
    const c = fg.c.col, id = fg.c.id, wp = fg.c.weapon;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y - p.crouch); ctx.scale(facing, 1); ctx.rotate(p.spin || 0);
    LX = -1; // 反転後に画面左上から光が当たる
    // ---- 骨格 ----
    const hip = [0, -21];
    const R = (len, ang) => [Math.sin(ang) * len, Math.cos(ang) * len];
    const knee = (t) => { const r = R(10.5, t); return [hip[0] + r[0], hip[1] + r[1]]; };
    const foot = (t, k) => { const kn = knee(t), r = R(10.5, t + k); return [kn, [kn[0] + r[0], kn[1] + r[1]]]; };
    const [knB, ftB] = foot(p.tB, p.kB), [knF, ftF] = foot(p.tF, p.kF);
    // 上半身は腰でひねる
    const tw = p.lean * 0.9, cx = 0, cy = -27;
    const T = (q) => { const dx = q[0] - cx, dy = q[1] - cy; return [cx + dx * Math.cos(tw) - dy * Math.sin(tw), cy + dx * Math.sin(tw) + dy * Math.cos(tw)]; };
    const shB = T([-4.6, -36]), shF = T([4.6, -36]);
    const arm = (sh, a, e) => { const el = [sh[0] + R(9.5, a)[0], sh[1] + R(9.5, a)[1]]; const r = R(9, a + e); return [el, [el[0] + r[0], el[1] + r[1]]]; };
    const [elB, hdB] = arm(shB, p.aB, p.eB), [elF, hdF] = arm(shF, p.aF, p.eF);
    const heavy = id === 'goro';
    const skinArm = heavy || id === 'kai' ? c.skin : c.body;   // シノは袖あり
    const sleeve = id === 'kai' ? c.body : heavy ? null : c.body;

    for (MODE of ['outline', 'fill']) {
      // 後ろの腕
      if (sleeve) cap(ctx, shB, elB, heavy ? 4.6 : 3.6, 3.0, shade(sleeve, 0.8));
      else cap(ctx, shB, elB, 4.6, 3.4, shade(c.skin, 0.8));
      cap(ctx, elB, hdB, 3.0, 2.3, shade(skinArm, 0.8));
      if (MODE === 'fill') hand(ctx, hdB, c, wp, 0.82);
      // 後ろの脚
      cap(ctx, [hip[0] - 2.6, hip[1]], knB, heavy ? 4.8 : 4.0, 3.0, shade(c.body2, 0.8));
      cap(ctx, knB, ftB, 3.0, 2.2, shade(c.body2, 0.78));
      if (MODE === 'fill') shoeR(ctx, ftB, p.tB + p.kB, c, 0.85);
      // 骨盤とベルト
      poly(ctx, [[-5.4, -20], [5.4, -20], [5.0, -26.5], [-5.0, -26.5]], c.body2, MODE === 'fill' ? lin(ctx, -5, 5, shade(c.body2, 1.15), shade(c.body2, 0.7)) : null);
      poly(ctx, [T([-5.0, -26.5]), T([5.0, -26.5]), T([5.0, -28.2]), T([-5.0, -28.2])], id === 'kai' ? '#5a3a20' : heavy ? '#2a2a30' : c.acc);
      // 胴
      const chest = [T([-4.9, -28.2]), T([4.9, -28.2]), T([6.4, -35.2]), T([3.2, -37.2]), T([-3.2, -37.2]), T([-6.4, -35.2])];
      poly(ctx, chest, c.body, MODE === 'fill' ? lin(ctx, -6, 6, shade(c.body, 1.2), shade(c.body, 0.62)) : null);
      if (MODE === 'fill') clothDetail(ctx, id, c, T);
      // 前の脚
      cap(ctx, [hip[0] + 2.6, hip[1]], knF, heavy ? 4.8 : 4.0, 3.0, c.body2);
      cap(ctx, knF, ftF, 3.0, 2.2, shade(c.body2, 0.95));
      if (MODE === 'fill') { shoeR(ctx, ftF, p.tF + p.kF, c, 1); joint(ctx, knF, 3.2); joint(ctx, knB, 3.2); }
      // 首と頭
      cap(ctx, T([0, -36.2]), T([0.4, -40]), heavy ? 2.6 : 1.9, heavy ? 2.4 : 1.7, shade(c.skin, 0.9));
      if (MODE === 'fill') { const g = ctx.createRadialGradient(...T([0, -36]), 0, ...T([0, -36]), 6); g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(...T([0, -35]), 6, 0, PI * 2); ctx.fill(); }
      headR(ctx, fg, p, T([0.6, -44.8]), tw);
      // 前の腕
      if (sleeve) cap(ctx, shF, elF, heavy ? 4.6 : 3.6, 3.0, sleeve);
      else cap(ctx, shF, elF, 4.8, 3.5, c.skin);
      cap(ctx, elF, hdF, 3.0, 2.3, skinArm);
      if (MODE === 'fill') { hand(ctx, hdF, c, wp, 1); joint(ctx, elF, 2.6); }
      if (wp === 'sword') swordR(ctx, hdF, p.aF + p.eF + p.wpn, c);
    }
    MODE = 'fill';
    ctx.restore();
    return { hand: hdF };
  }
  function lin(ctx, x0, x1, c0, c1) { const g = ctx.createLinearGradient(x0 * LX, 0, x1 * LX, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }
  function clothDetail(ctx, id, c, T) {
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.7;
    // 中心の縫い目と、しわ
    ctx.beginPath(); ctx.moveTo(...T([0.2, -28.5])); ctx.lineTo(...T([0.6, -34])); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...T([-3.8, -29])); ctx.quadraticCurveTo(...T([-2.5, -31]), ...T([-3.6, -33])); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...T([3.9, -29.5])); ctx.quadraticCurveTo(...T([2.6, -31.5]), ...T([3.8, -33.5])); ctx.stroke();
    // 襟
    ctx.fillStyle = id === 'goro' ? c.skin : shade(c.body, 1.25);
    ctx.beginPath(); ctx.moveTo(...T([-2.6, -36.8])); ctx.lineTo(...T([0.4, -33.6])); ctx.lineTo(...T([3.2, -36.8])); ctx.closePath(); ctx.fill();
    if (id === 'goro') { // タンクトップの肩と胸筋
      ctx.fillStyle = shade(c.skin, 0.95); ctx.beginPath(); ctx.moveTo(...T([-6.2, -35])); ctx.lineTo(...T([-3.5, -37])); ctx.lineTo(...T([-3.2, -33])); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(...T([6.2, -35])); ctx.lineTo(...T([3.5, -37])); ctx.lineTo(...T([3.2, -33])); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(...T([-3.5, -31.5])); ctx.quadraticCurveTo(...T([0, -30.2]), ...T([3.5, -31.5])); ctx.stroke();
    }
    if (id === 'kai') { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(...T([-3.4, -36.4])); ctx.lineTo(...T([-1.2, -30])); ctx.lineTo(...T([-0.2, -30])); ctx.lineTo(...T([-2.2, -36.6])); ctx.closePath(); ctx.fill(); }
    if (id === 'shino') { ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(...T([-4.5, -29.5 - i * 2.2])); ctx.lineTo(...T([4.5, -30.5 - i * 2.2])); ctx.stroke(); } }
  }
  function hand(ctx, hd, c, wp, k) {
    const r = wp === 'fist' ? 3.1 : 1.9;
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(hd[0], hd[1], r + 1, 0, PI * 2); ctx.fill();
    const col = wp === 'fist' ? (c.glove || c.body2) : c.skin;
    const g = ctx.createRadialGradient(hd[0] - r * 0.4, hd[1] - r * 0.4, 0.3, hd[0], hd[1], r); g.addColorStop(0, shade(col, 1.3 * k)); g.addColorStop(1, shade(col, 0.7 * k));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hd[0], hd[1], r, 0, PI * 2); ctx.fill();
    if (wp !== 'fist') { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(hd[0] - 0.8, hd[1] + 0.6); ctx.lineTo(hd[0] + 1.0, hd[1] + 0.6); ctx.stroke(); }
  }
  function shoeR(ctx, ft, ang, c, k) {
    ctx.save(); ctx.translate(ft[0], ft[1]); ctx.rotate(-ang * 0.35);
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.ellipse(1.6, 0.6, 4.6, 2.3, 0, 0, PI * 2); ctx.fill();
    const col = shade(c.body2, 0.5 * k);
    const g = ctx.createLinearGradient(0, -2, 0, 2); g.addColorStop(0, shade(c.body2, 0.75 * k)); g.addColorStop(1, col);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(1.6, 0.4, 3.8, 1.7, 0, 0, PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(1.0, -0.3, 2.0, 0.6, 0, 0, PI * 2); ctx.fill();
    ctx.restore();
  }
  function headR(ctx, fg, p, hc, tw) {
    const c = fg.c.col, id = fg.c.id;
    ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate(tw * 0.5 + p.head * 0.35);
    const rx = 3.9, ry = 4.6;
    if (MODE === 'outline') { ctx.fillStyle = OUT; ctx.beginPath(); ctx.ellipse(0, 0, rx + 1.1, ry + 1.1, 0, 0, PI * 2); ctx.fill(); ctx.restore(); return; }
    // 顔の面（あごを少し細く）
    const g = ctx.createRadialGradient(-1.6, -1.8, 0.5, 0, 0, 5); g.addColorStop(0, shade(c.skin, 1.14)); g.addColorStop(0.7, c.skin); g.addColorStop(1, shade(c.skin, 0.7));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-rx, -0.8); ctx.quadraticCurveTo(-rx, -ry - 0.2, 0, -ry); ctx.quadraticCurveTo(rx, -ry - 0.2, rx, -0.8);
    ctx.quadraticCurveTo(rx, 3.2, 0.6, ry); ctx.quadraticCurveTo(-rx + 0.6, 3.0, -rx, -0.8); ctx.closePath(); ctx.fill();
    // 耳
    ctx.fillStyle = shade(c.skin, 0.85); ctx.beginPath(); ctx.ellipse(-3.6, 0.0, 0.9, 1.4, 0, 0, PI * 2); ctx.fill();
    // 目（3/4 向き。手前の目を大きく）
    const eye = (ex, ey, w, h) => {
      ctx.fillStyle = '#f4f2f0'; ctx.beginPath(); ctx.ellipse(ex, ey, w, h, 0, 0, PI * 2); ctx.fill();
      ctx.fillStyle = id === 'kai' ? '#3d6fb5' : '#3a2416'; ctx.beginPath(); ctx.arc(ex + 0.15, ey, h * 0.72, 0, PI * 2); ctx.fill();
      ctx.fillStyle = '#0d0a0c'; ctx.beginPath(); ctx.arc(ex + 0.2, ey, h * 0.38, 0, PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(ex - 0.15, ey - 0.25, h * 0.2, 0, PI * 2); ctx.fill();
      ctx.strokeStyle = '#2a1a16'; ctx.lineWidth = 0.55; ctx.beginPath(); ctx.moveTo(ex - w, ey - h * 0.3); ctx.quadraticCurveTo(ex, ey - h - 0.35, ex + w, ey - h * 0.35); ctx.stroke();
    };
    eye(1.7, -0.5, 1.15, 0.85); eye(-1.3, -0.5, 0.85, 0.7);
    // 眉、鼻、口
    ctx.strokeStyle = shade(c.hair, 0.9); ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(0.6, -1.9); ctx.lineTo(2.9, -2.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-2.1, -1.9); ctx.lineTo(-0.5, -2.0); ctx.stroke();
    ctx.strokeStyle = shade(c.skin, 0.62); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(2.5, -0.3); ctx.lineTo(3.2, 1.0); ctx.lineTo(2.3, 1.3); ctx.stroke();
    ctx.strokeStyle = '#7a3a3a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(1.0, 2.5); ctx.quadraticCurveTo(1.9, 2.9, 2.8, 2.4); ctx.stroke();
    // 髪
    ctx.fillStyle = c.hair;
    if (id === 'kai') {
      ctx.beginPath(); ctx.moveTo(-rx - 0.3, -0.6); ctx.quadraticCurveTo(-rx - 0.4, -ry - 1.2, -0.5, -ry - 1.0); ctx.quadraticCurveTo(2.6, -ry - 1.2, 3.9, -2.4);
      ctx.lineTo(2.6, -2.9); ctx.lineTo(1.4, -4.0); ctx.lineTo(0.2, -3.0); ctx.lineTo(-1.6, -4.1); ctx.lineTo(-2.8, -2.8); ctx.lineTo(-rx + 0.6, -1.4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3.5, -3.5); ctx.lineTo(-6.2, -3.0); ctx.lineTo(-4.2, -1.6); ctx.lineTo(-6.6, -0.4); ctx.lineTo(-4.0, 0.0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(c.hair, 1.35); ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(-2.5, -4.2); ctx.lineTo(-4.5, -2.4); ctx.stroke();
    } else if (id === 'goro') {
      ctx.beginPath(); ctx.moveTo(-rx - 0.3, -1.2); ctx.quadraticCurveTo(-rx - 0.3, -ry - 0.9, 0, -ry - 0.8); ctx.quadraticCurveTo(rx + 0.2, -ry - 0.9, rx + 0.2, -2.2); ctx.quadraticCurveTo(0, -3.0, -rx - 0.3, -1.2); ctx.fill();
      ctx.fillStyle = 'rgba(40,25,15,0.35)'; ctx.beginPath(); ctx.moveTo(-2.6, 1.6); ctx.quadraticCurveTo(0.5, 5.0, 3.6, 1.8); ctx.quadraticCurveTo(1.0, 3.4, -2.6, 1.6); ctx.fill(); // ひげ
    } else {
      ctx.beginPath(); ctx.moveTo(-rx - 0.4, -0.5); ctx.quadraticCurveTo(-rx - 0.4, -ry - 1.0, 0, -ry - 0.9); ctx.quadraticCurveTo(rx + 0.3, -ry - 1.0, rx + 0.3, -1.6);
      ctx.lineTo(2.4, -2.6); ctx.lineTo(1.0, -1.6); ctx.lineTo(-0.6, -2.8); ctx.lineTo(-2.0, -1.7); ctx.lineTo(-rx + 0.4, -1.0); ctx.closePath(); ctx.fill();
      // 口元のマスクと額のはちまき
      ctx.fillStyle = c.body2; ctx.beginPath(); ctx.moveTo(-rx + 0.2, 0.9); ctx.quadraticCurveTo(0.6, 1.4, rx, 0.9); ctx.quadraticCurveTo(rx, 3.6, 0.6, ry + 0.2); ctx.quadraticCurveTo(-rx + 0.8, 3.4, -rx + 0.2, 0.9); ctx.fill();
      ctx.fillStyle = c.acc; ctx.fillRect(-rx - 0.6, -3.3, rx * 2 + 1.2, 1.3);
      ctx.strokeStyle = c.acc; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-rx - 0.4, -2.6); ctx.quadraticCurveTo(-8, -1, -10.5, 1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-rx - 0.4, -2.6); ctx.quadraticCurveTo(-7.5, -3.5, -10, -4.5); ctx.stroke();
    }
    ctx.restore();
  }
  function swordR(ctx, hd, ang, c) {
    ctx.save(); ctx.translate(hd[0], hd[1]); ctx.rotate(-ang); ctx.rotate(PI);
    if (MODE === 'outline') { ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(-2.4, -1.5); ctx.lineTo(-1.2, -25.5); ctx.lineTo(0, -28.5); ctx.lineTo(1.2, -25.5); ctx.lineTo(2.4, -1.5); ctx.closePath(); ctx.fill(); ctx.fillRect(-5.5, -2.6, 11, 2.4); }
    else {
      const g = ctx.createLinearGradient(-1.6, 0, 1.6, 0); g.addColorStop(0, '#f6f8fc'); g.addColorStop(0.48, '#a9b2c2'); g.addColorStop(0.52, '#7e8797'); g.addColorStop(1, '#e3e8f0');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-1.6, -1.5); ctx.lineTo(-0.8, -24.5); ctx.lineTo(0, -27.5); ctx.lineTo(0.8, -24.5); ctx.lineTo(1.6, -1.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(c.acc, 0.85); ctx.fillRect(-4.8, -2.2, 9.6, 1.6); ctx.fillStyle = '#4a3220'; ctx.fillRect(-1.1, -0.6, 2.2, 4.2);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-1.1, 0 + i); ctx.lineTo(1.1, 0.6 + i); ctx.stroke(); }
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
    const HS = fg.hurtSize || K.HURT;
    if (gy !== null) { const h = Math.max(0, gy - fg.y), k = Math.max(0.25, 1 - h / 160); ctx.fillStyle = `rgba(0,0,0,${0.35 * k})`; ctx.beginPath(); ctx.ellipse(fg.x, gy + 1, HS.w * 0.55 * k, 3.4 * k, 0, 0, PI * 2); ctx.fill(); }
    // 残像（シノの上B）
    fg.trail.forEach((t) => { if (!(fg.c.art && SPRITES.draw(ctx, fg, f, t.x, t.y, t.f, t.life / 20, 'jump', 0))) body(ctx, fg, POSES.jump, t.x, t.y, t.f, t.life / 20); });
    // 武器の軌跡
    if (fg.wtrail && fg.wtrail.length > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); fg.wtrail.forEach((w, i) => (i ? ctx.lineTo(w[0], w[1]) : ctx.moveTo(w[0], w[1]))); ctx.stroke();
    }
    const blink = fg.invuln > 0 && (f >> 2) % 2 === 0;
    let info = null;
    if (fg.c.art) { if (!SPRITES.draw(ctx, fg, f, fg.x, fg.y, fg.facing, blink ? 0.45 : 1)) info = body(ctx, fg, p, fg.x, fg.y, fg.facing, blink ? 0.45 : 1); }
    else info = body(ctx, fg, p, fg.x, fg.y, fg.facing, blink ? 0.45 : 1);
    // 技中は手の位置を記録して軌跡にする
    const active = fg.state === 'attack' && fg.md && fg.moveT > fg.md.startup && fg.moveT <= fg.md.startup + fg.md.active;
    if (active && info) { const hx = fg.x + info.hand[0] * fg.facing, hy = fg.y - p.crouch + info.hand[1]; fg.wtrail.push([hx, hy]); if (fg.wtrail.length > 5) fg.wtrail.shift(); }
    else fg.wtrail.length = 0;
    // シールド
    if (fg.state === 'shield') {
      const r = HS.h * 0.42 + (fg.shieldHP / 60) * 12, sy = fg.y - HS.h / 2;
      const g = ctx.createRadialGradient(fg.x, sy, r * 0.2, fg.x, sy, r);
      const col = fg.idx === 0 ? '255,190,40' : '70,140,255';
      g.addColorStop(0, `rgba(${col},0.1)`); g.addColorStop(0.85, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0.7)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fg.x, sy, r, 0, PI * 2); ctx.fill();
    }
    // ため
    if (fg.state === 'attack' && fg.md && fg.md.charge && fg.chargeT > 0) {
      const r = 6 + fg.chargeT / 5, g = ctx.createRadialGradient(fg.x + fg.facing * 14, fg.y - 28, 1, fg.x + fg.facing * 14, fg.y - 28, r);
      g.addColorStop(0, 'rgba(255,240,180,0.9)'); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fg.x + fg.facing * 14, fg.y - 28, r, 0, PI * 2); ctx.fill();
    }
    // 1P/2P マーカー
    const my = fg.y - HS.h - 14;
    ctx.fillStyle = fg.idx === 0 ? '#ffc23a' : '#4a8cff'; ctx.beginPath(); ctx.moveTo(fg.x - 5, my); ctx.lineTo(fg.x + 5, my); ctx.lineTo(fg.x, my + 6); ctx.closePath(); ctx.fill();
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

  // 3D のときのエフェクト。ワールド座標を画面に投影して、その場で描く
  function effectsProjected(ctx, fx, project, zoom) {
    fx.forEach((e) => {
      const [px, py] = project(e.x, e.y);
      ctx.save(); ctx.translate(px, py); ctx.scale(zoom, zoom); ctx.translate(-e.x, -e.y);
      effects(ctx, [e]);
      ctx.restore();
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
      ctx.save(); roundRect(ctx, x + 2, y + 5, 40, h - 7, 6); ctx.clip();
      const p3 = fg.c.model && window.R3D && window.R3D.ready ? window.R3D.portrait(fg.c.model, 160) : null;
      if (p3) ctx.drawImage(p3, x + 2, y + 4, 40, 50);
      else {
        const ph = fg.c.art ? (fg.c.art.height || 48) : 49, ps = 44 / ph;
        ctx.translate(x + 22, y + 52); ctx.scale(ps, ps);
        if (!(fg.c.art && SPRITES.draw(ctx, { c: fg.c, state: 'idle', stateT: 0, idx: 0 }, 0, 0, 0, 1, 1, 'idle', 0))) body(ctx, fg, POSES.idle, 0, 0, 1);
      }
      ctx.restore();
      ctx.textAlign = 'left'; ctx.fillStyle = '#e8ecf4'; ctx.font = '700 10px "Noto Sans JP", system-ui, sans-serif'; ctx.fillText(`${i + 1}P  ${fg.name}`, x + 46, y + 18);
      const pc = Math.round(fg.percent), col = pc < 50 ? '#ffffff' : pc < 100 ? '#ffd45a' : pc < 150 ? '#ff8a3a' : '#ff3a3a';
      ctx.fillStyle = col; ctx.font = '900 24px "Noto Sans JP", system-ui, sans-serif'; ctx.fillText(`${pc}`, x + 46, y + 45);
      ctx.font = '900 12px "Noto Sans JP", system-ui, sans-serif'; ctx.fillText('%', x + 46 + ctx.measureText(String(pc)).width * 2 - 2, y + 45);
      for (let s = 0; s < fg.stocks; s++) { ctx.fillStyle = fg.c.col.body; ctx.beginPath(); ctx.arc(x + 112 + s * 12, y + 16, 4, 0, PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x + 111 + s * 12, y + 15, 1.5, 0, PI * 2); ctx.fill(); }
    });
  }
  function portrait(canvas, ch) {
    if (ch.model && window.R3D && window.R3D.ready) {
      const draw3 = (img) => { const c = canvas.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height); c.drawImage(img, 0, 0, canvas.width, canvas.height); };
      const img = window.R3D.portrait(ch.model, 160, draw3); if (img) draw3(img); return;
    }
    const ctx = canvas.getContext('2d'); const s = canvas.height * 0.86 / (ch.art ? (ch.art.height || 48) : 58);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(canvas.width / 2, canvas.height - 3 * s); ctx.scale(s, s);
    const dummy = { c: ch, trail: [], wtrail: [], state: 'idle', stateT: 0, idx: 0 };
    if (!(ch.art && SPRITES.draw(ctx, dummy, 0, 0, 0, 1, 1, 'idle', 0))) body(ctx, dummy, POSES.idle, 0, 0, 1);
    ctx.restore();
  }

  window.RENDER = { cam, updateCamera, begin, end, stage, fighter, projectiles, effects, effectsProjected, hud, portrait, body, POSES };
})();
