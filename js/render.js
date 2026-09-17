// 描画。カメラ、ステージ、ファイター（ポーズを技から作る）、エフェクト、HUD
(function () {
  const K = window.K;
  const PI = Math.PI;
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- カメラ ----------
  const cam = { x: 320, y: 200, z: 1, sx: 0, sy: 0 };
  function updateCamera(fs, shake) {
    const alive = fs.filter((f) => !f.dead);
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    (alive.length ? alive : fs).forEach((f) => { minX = Math.min(minX, f.x); maxX = Math.max(maxX, f.x); minY = Math.min(minY, f.y - 40); maxY = Math.max(maxY, f.y); });
    const F = K.STAGE.floor;
    minX = Math.min(minX, F.x + 60); maxX = Math.max(maxX, F.x + F.w - 60); minY = Math.min(minY, 150); maxY = Math.max(maxY, F.y + 10);
    const bw = maxX - minX + 200, bh = maxY - minY + 160;
    const tz = Math.max(0.62, Math.min(1.25, Math.min(K.W / bw, K.H / bh)));
    const tx = (minX + maxX) / 2, ty = (minY + maxY) / 2 + 10;
    cam.z = lerp(cam.z, tz, 0.08); cam.x = lerp(cam.x, tx, 0.1); cam.y = lerp(cam.y, ty, 0.1);
    cam.sx = shake ? (Math.random() - 0.5) * shake : 0; cam.sy = shake ? (Math.random() - 0.5) * shake : 0;
  }
  function begin(ctx) { ctx.save(); ctx.translate(K.W / 2 + cam.sx, K.H / 2 + cam.sy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y); }
  function end(ctx) { ctx.restore(); }

  // ---------- ステージ ----------
  function stage(ctx, f) {
    // 空（カメラの外まで塗る）
    ctx.fillStyle = '#5c94fc'; ctx.fillRect(-2000, -2000, 5000, 5000);
    const g = ctx.createLinearGradient(0, -200, 0, 500); g.addColorStop(0, '#2a3a8a'); g.addColorStop(0.6, '#5c94fc'); g.addColorStop(1, '#a8d8ff');
    ctx.fillStyle = g; ctx.fillRect(-2000, -300, 5000, 900);
    // 遠くの山と雲（少しだけ動く）
    ctx.fillStyle = '#3c5aa8';
    for (let i = -3; i < 9; i++) { const x = i * 220 - (f * 0.05 % 220); ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x + 110, 200 + (i % 3) * 25); ctx.lineTo(x + 220, 330); ctx.fill(); }
    ctx.fillStyle = '#fff';
    for (let i = -2; i < 8; i++) { const x = i * 260 - (f * 0.2 % 260), y = 40 + (i % 2) * 60; ctx.fillRect(x, y, 40, 10); ctx.fillRect(x + 8, y - 8, 24, 8); ctx.fillRect(x + 4, y + 10, 30, 6); }
    // 足場
    const F = K.STAGE.floor;
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(F.x, F.y, F.w, F.h + 400);
    ctx.fillStyle = '#4a2a10';
    for (let y = F.y + 12; y < F.y + F.h + 400; y += 12) for (let x = F.x + ((y / 12) % 2 ? 12 : 0); x < F.x + F.w; x += 24) ctx.fillRect(x, y, 12, 1);
    ctx.fillStyle = '#00a800'; ctx.fillRect(F.x, F.y - 6, F.w, 8);
    ctx.fillStyle = '#80f880'; ctx.fillRect(F.x, F.y - 6, F.w, 2);
    ctx.fillStyle = '#005000'; for (let x = F.x; x < F.x + F.w; x += 10) ctx.fillRect(x + 4, F.y, 3, 2);
    K.STAGE.plats.forEach((p) => {
      ctx.fillStyle = '#c84c0c'; ctx.fillRect(p.x, p.y, p.w, 8);
      ctx.fillStyle = '#f8b878'; ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.fillStyle = '#7a2800'; for (let x = p.x; x < p.x + p.w; x += 16) ctx.fillRect(x, p.y + 2, 1, 6);
    });
  }

  // ---------- ポーズ ----------
  // 腕と脚の角度。0 = 真下、正 = 向いている方向へ。ラジアン。
  function pose(fg, f) {
    const P = { lean: 0, armF: 0.15, armB: -0.15, legF: 0, legB: 0, crouch: 0, wpn: 0.3, spin: 0, flail: 0 };
    const t = fg.stateT;
    switch (fg.state) {
      case 'idle': P.armF = 0.15 + Math.sin(f * 0.1) * 0.05; break;
      case 'walk': case 'run': {
        const s = Math.sin(t * (fg.state === 'run' ? 0.5 : 0.3)) * (fg.state === 'run' ? 0.8 : 0.5);
        P.legF = s; P.legB = -s; P.armF = -s * 0.7 + 0.2; P.armB = s * 0.7 - 0.2; P.lean = fg.state === 'run' ? 0.18 : 0.06; break;
      }
      case 'jumpsquat': P.crouch = 6; P.legF = 0.5; P.legB = -0.4; break;
      case 'air': P.legF = fg.vy < 0 ? 0.8 : 0.4; P.legB = -0.3; P.armF = 0.6; P.armB = -0.5; break;
      case 'helpless': P.armF = 2.6 + Math.sin(t * 0.6) * 0.4; P.armB = -2.6 - Math.sin(t * 0.6) * 0.4; P.legF = 0.7; P.legB = -0.7; P.flail = 1; break;
      case 'shield': P.crouch = 3; P.armF = 0.9; P.armB = -0.9; break;
      case 'stun': P.crouch = 5; P.lean = Math.sin(t * 0.5) * 0.25; P.armF = 0.4; P.armB = -0.4; break;
      case 'landing': P.crouch = 5; P.armF = 0.4; P.armB = -0.4; break;
      case 'hitstun': P.lean = -0.6; P.armF = 2.2; P.armB = -2.0; P.legF = 1.0; P.legB = -0.6; P.flail = fg.tumble ? 1 : 0; break;
      case 'attack': attackPose(P, fg); break;
    }
    return P;
  }
  function attackPose(P, fg) {
    const md = fg.md, s = md.startup, a = md.active, r = md.recover, t = fg.moveT;
    let ph, p; // 0 ため, 1 ヒット, 2 もどり
    if (t <= s) { ph = 0; p = t / s; } else if (t <= s + a) { ph = 1; p = (t - s) / a; } else { ph = 2; p = (t - s - a) / r; }
    const mv = fg.move;
    const fam = /^(jab|ftilt|fair|fsmash|nspecial)$/.test(mv) ? 'fwd' : /^(utilt|usmash|uair|upspecial)$/.test(mv) ? 'up'
      : mv === 'dtilt' ? 'low' : mv === 'dsmash' ? 'both' : mv === 'bair' ? 'back' : mv === 'dair' ? 'down' : 'spin';
    const wind = { fwd: [-0.7, 0.2, 0.15], up: [0.6, -0.4, 0.15], low: [-0.4, 0.1, 0.15], both: [0.3, -0.3, 0.1], back: [0.3, 0.3, -0.1], down: [1.6, -0.6, 0.1], spin: [0.5, -0.5, 0] };
    const hit = { fwd: [1.65, -0.4, 0.25], up: [3.0, -0.6, 0.0], low: [1.1, -0.2, 0.05], both: [1.6, -1.6, 0.05], back: [0.4, -1.65, -0.2], down: [0.05, -0.2, 0.05], spin: [1.4, -1.4, 0] };
    const idle = [0.15, -0.15, 0];
    let from, to, k;
    if (ph === 0) { from = wind[fam]; to = hit[fam]; k = Math.pow(p, 3); }
    else if (ph === 1) { from = hit[fam]; to = hit[fam]; k = 1; }
    else { from = hit[fam]; to = idle; k = p; }
    P.armF = lerp(from[0], to[0], k); P.armB = lerp(from[1], to[1], k); P.lean = lerp(from[2], to[2], k);
    if (fam === 'low' || fam === 'both') P.crouch = ph === 2 ? lerp(6, 0, p) : 6;
    if (fam === 'down') { P.legF = ph === 1 ? 0.1 : 0.6; P.legB = ph === 1 ? -0.1 : -0.4; }
    if (fam === 'spin' && ph === 1) P.spin = p * PI * 2;
    if (md.charge && ph === 0 && p >= 0.95) P.lean = -0.25 + Math.sin(fg.chargeT * 0.8) * 0.06;
    if (!fg.grounded && fam !== 'down') { P.legF = 0.5; P.legB = -0.3; }
  }

  // ---------- ファイター ----------
  function seg(ctx, x, y, ang, len, col, w) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ang) * len, y + Math.cos(ang) * len); ctx.stroke();
    return [x + Math.sin(ang) * len, y + Math.cos(ang) * len];
  }
  function fighter(ctx, fg, f, world) {
    if (fg.dead) return;
    const P = pose(fg, f), c = fg.c.col;
    // 残像（シノの上B）
    fg.trail.forEach((t) => { ctx.globalAlpha = t.life / 16; drawBody(ctx, fg, P, t.x, t.y, t.f, c, true); ctx.globalAlpha = 1; });
    const blink = fg.invuln > 0 && (f >> 2) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.45;
    drawBody(ctx, fg, P, fg.x, fg.y, fg.facing, c, false);
    ctx.globalAlpha = 1;
    // シールド
    if (fg.state === 'shield') {
      const r = 14 + (fg.shieldHP / 60) * 14;
      ctx.fillStyle = fg.idx === 0 ? 'rgba(248,184,0,0.45)' : 'rgba(60,120,255,0.45)';
      ctx.beginPath(); ctx.arc(fg.x, fg.y - 20, r, 0, PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    }
    // ため
    if (fg.state === 'attack' && fg.md && fg.md.charge && fg.chargeT > 0) {
      ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(fg.x + fg.facing * 16, fg.y - 28, 6 + fg.chargeT / 8, 0, PI * 2); ctx.stroke();
    }
    // 1P/2P マーカー
    const mk = fg.idx === 0 ? '#f8b800' : '#3c78ff';
    ctx.fillStyle = mk; ctx.beginPath(); ctx.moveTo(fg.x - 5, fg.y - 56); ctx.lineTo(fg.x + 5, fg.y - 56); ctx.lineTo(fg.x, fg.y - 50); ctx.fill();
    // 当たり判定（デバッグ）
    if (world.debug) { const h = fg.hitbox(); if (h) { ctx.fillStyle = 'rgba(255,0,0,.35)'; ctx.fillRect(h.x, h.y, h.w, h.h); } const u = fg.hurt; ctx.strokeStyle = 'rgba(0,255,0,.6)'; ctx.strokeRect(u.x, u.y, u.w, u.h); }
  }
  function drawBody(ctx, fg, P, x, y, facing, c, ghost) {
    ctx.save(); ctx.translate(x, y - P.crouch); ctx.scale(facing, 1); ctx.rotate(P.lean);
    const passes = ghost ? [['#fff', 0]] : [['#000', 1], [null, 0]];
    passes.forEach(([outline, o]) => {
      const col = (k) => outline || c[k];
      const w = outline ? 5 : 3, hw = outline ? 8 : 6;
      // 脚
      const hip = [0, -16];
      seg(ctx, hip[0] - 3 + o * 0, hip[1], P.legB, 16, col('body2'), w);
      seg(ctx, hip[0] + 3, hip[1], P.legF, 16, col('body2'), w);
      // 胴
      ctx.fillStyle = col('body'); ctx.fillRect(-6 - (outline ? 1 : 0), -33 - (outline ? 1 : 0), 12 + (outline ? 2 : 0), 18 + (outline ? 2 : 0));
      // 後ろの腕
      const sh = [0, -30];
      let hb = seg(ctx, sh[0] - 3, sh[1], P.armB + P.spin, 13, col('skin'), w);
      if (fg.c.weapon === 'fist') { ctx.fillStyle = col('skin'); ctx.fillRect(hb[0] - hw / 2, hb[1] - hw / 2, hw, hw); }
      // 頭
      ctx.fillStyle = col('skin'); ctx.fillRect(-6 - (outline ? 1 : 0), -45 - (outline ? 1 : 0), 12 + (outline ? 2 : 0), 12 + (outline ? 2 : 0));
      ctx.fillStyle = col('hair'); ctx.fillRect(-7 - (outline ? 1 : 0), -47 - (outline ? 1 : 0), 14 + (outline ? 2 : 0), 5 + (outline ? 2 : 0));
      if (!outline) { ctx.fillStyle = '#000'; ctx.fillRect(2, -40, 2, 2); if (fg.c.weapon === 'none') { ctx.fillStyle = c.acc; ctx.fillRect(-7, -42, 14, 3); ctx.fillRect(-14, -42, 8, 2); } }
      // 前の腕と武器
      const hf = seg(ctx, sh[0] + 3, sh[1], P.armF + P.spin, 13, col('skin'), w);
      if (fg.c.weapon === 'sword') seg(ctx, hf[0], hf[1], P.armF + P.spin + P.wpn, 20, col('acc'), outline ? 4 : 2);
      if (fg.c.weapon === 'fist') { ctx.fillStyle = col('skin'); ctx.fillRect(hf[0] - hw / 2, hf[1] - hw / 2, hw, hw); }
    });
    ctx.restore();
  }

  // ---------- 飛び道具・エフェクト ----------
  function projectiles(ctx, ps) {
    ps.forEach((p) => {
      if (p.kind === 'beam') { ctx.fillStyle = '#c0e0ff'; ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h); ctx.fillStyle = '#fff'; ctx.fillRect(p.x - p.w / 2 + 2, p.y - 1, p.w - 4, 2); }
      else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * 0.5); ctx.fillStyle = '#ddd'; ctx.fillRect(-5, -1, 10, 2); ctx.fillRect(-1, -5, 2, 10); ctx.fillStyle = '#f83060'; ctx.fillRect(-1, -1, 2, 2); ctx.restore(); }
    });
  }
  function effects(ctx, fx) {
    fx.forEach((e) => {
      const p = 1 - e.life / (e.max || e.life0 || 10);
      if (e.t === 'spark') {
        ctx.strokeStyle = e.life > 4 ? '#fff' : '#f8b800'; ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) { const a = i * PI / 3 + e.life * 0.2, r = 6 + (10 - e.life) * 2; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * 3, e.y + Math.sin(a) * 3); ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r); ctx.stroke(); }
      } else if (e.t === 'dust' || e.t === 'puff') {
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; const s = 10 - e.life; ctx.fillRect(e.x - 8 - s, e.y - 3, 4, 3); ctx.fillRect(e.x + 4 + s, e.y - 3, 4, 3);
      } else if (e.t === 'ko') {
        ctx.strokeStyle = e.col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y, (30 - e.life) * 4, 0, PI * 2); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * PI / 4; const r = (30 - e.life) * 5; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * r * 0.6, e.y + Math.sin(a) * r * 0.6); ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r); ctx.stroke(); }
      } else if (e.t === 'shieldhit') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, 30 - e.life * 2, 0, PI * 2); ctx.stroke(); }
      else if (e.t === 'break') { ctx.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { const a = i * PI / 4; ctx.fillRect(e.x + Math.cos(a) * (20 - e.life) * 2, e.y + Math.sin(a) * (20 - e.life) * 2, 4, 4); } }
    });
  }

  // ---------- HUD ----------
  function hud(ctx, fs) {
    fs.forEach((fg, i) => {
      const x = i === 0 ? 90 : K.W - 90 - 130, y = K.H - 62;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y, 130, 54);
      ctx.fillStyle = i === 0 ? '#f8b800' : '#3c78ff'; ctx.fillRect(x, y, 130, 3);
      // 顔
      ctx.save(); ctx.translate(x + 18, y + 48); ctx.scale(0.8, 0.8);
      drawBody(ctx, fg, pose({ state: 'idle', stateT: 0, vy: 0 }, 0), 0, 0, 1, fg.c.col, false);
      ctx.restore();
      ctx.font = '9px "DotGothic16"'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(`${i + 1}P ${fg.name}`, x + 40, y + 14);
      const pc = fg.percent, col = pc < 50 ? '#fff' : pc < 100 ? '#f8d060' : pc < 150 ? '#f87020' : '#f82020';
      ctx.font = '18px "Press Start 2P"'; ctx.fillStyle = col; ctx.fillText(`${Math.round(pc)}%`, x + 40, y + 40);
      for (let s = 0; s < fg.stocks; s++) { ctx.fillStyle = fg.c.col.body; ctx.fillRect(x + 100 + s * 9, y + 10, 6, 6); ctx.fillStyle = '#fff'; ctx.fillRect(x + 100 + s * 9, y + 10, 6, 1); }
    });
  }
  function portrait(canvas, ch) {
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(canvas.width / 2, canvas.height - 4);
    drawBody(ctx, { c: ch, trail: [] }, pose({ state: 'idle', stateT: 0, vy: 0 }, 0), 0, 0, 1, ch.col, false);
    ctx.restore();
  }

  window.RENDER = { cam, updateCamera, begin, end, stage, fighter, projectiles, effects, hud, portrait };
})();
