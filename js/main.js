(function () {
  const K = window.K, R = window.RENDER;
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const $ = (id) => document.getElementById(id);

  function fit() {
    const s = Math.min(innerWidth / K.W, innerHeight / K.H);
    const st = $('stage'); st.style.transform = `scale(${s})`;
    st.style.left = `${(innerWidth - K.W * s) / 2}px`; st.style.top = `${(innerHeight - K.H * s) / 2}px`;
  }
  addEventListener('resize', fit); fit();

  const inputs = [new INPUT.Input(0), new INPUT.Input(1)];
  const world = { fighters: [], projectiles: [], fx: [], shake: 0, debug: false, announce: (t) => announce(t) };
  let scene = 'title', f = 0, picks = [null, null], p2cpu = true, ai = null, endT = 0, startT = 0;
  // デバッグ用。コンソールから中を見られる
  window.__dbg = { world, inputs, get ai() { return ai; }, get scene() { return scene; }, step: (n = 1) => { for (let i = 0; i < n; i++) step(); draw(); } };
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function show(id) { ['s-title', 's-select', 's-result'].forEach((s) => $(s).classList.toggle('hidden', s !== id)); }
  let annT = null;
  function announce(text, ms = 900) {
    const el = $('announce'); el.textContent = text; el.classList.remove('hidden');
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    clearTimeout(annT); annT = setTimeout(() => el.classList.add('hidden'), ms);
  }

  // ---------- キャラ選択 ----------
  function buildSelect() {
    [0, 1].forEach((pi) => {
      const box = $(`pick-${pi + 1}`).querySelector('.cards'); box.innerHTML = '';
      CHARS.forEach((ch, ci) => {
        const card = document.createElement('div'); card.className = 'card';
        const c = document.createElement('canvas'); c.width = 24; c.height = 32; R.portrait(c, ch);
        card.appendChild(c);
        const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = ch.name; card.appendChild(nm);
        const ds = document.createElement('div'); ds.className = 'ds'; ds.textContent = ch.desc; card.appendChild(ds);
        card.onclick = () => { picks[pi] = ci; SFX.menu(); refreshSelect(); };
        box.appendChild(card);
      });
    });
    refreshSelect();
  }
  function refreshSelect() {
    [0, 1].forEach((pi) => { $(`pick-${pi + 1}`).querySelectorAll('.card').forEach((c, ci) => c.classList.toggle('on', picks[pi] === ci)); });
    $('btn-fight').disabled = picks[0] === null || picks[1] === null;
    $('btn-p2mode').textContent = p2cpu ? 'CPU' : 'ひと';
    $('cpu-level').style.display = p2cpu ? '' : 'none';
  }
  $('btn-p2mode').onclick = () => { p2cpu = !p2cpu; SFX.menu(); refreshSelect(); };
  $('btn-title').onclick = () => { SFX.unlock(); SFX.menu(); scene = 'select'; show('s-select'); buildSelect(); };
  $('btn-fight').onclick = () => startMatch();
  $('btn-rematch').onclick = () => startMatch();
  $('btn-select').onclick = () => { scene = 'select'; show('s-select'); refreshSelect(); };
  addEventListener('keydown', (e) => {
    if (scene === 'title' && (e.code === 'Enter' || e.code === 'Space')) $('btn-title').click();
    if (scene === 'select' && e.code === 'Enter' && !$('btn-fight').disabled) startMatch();
    if (e.code === 'F2') world.debug = !world.debug;
  });

  // ---------- 試合 ----------
  function startMatch() {
    SFX.unlock(); SFX.go();
    world.fighters = [new Fighter(CHARS[picks[0]], 0, inputs[0]), new Fighter(CHARS[picks[1]], 1, inputs[1])];
    world.projectiles = []; world.fx = []; world.shake = 0;
    ai = p2cpu ? new AI(world.fighters[1], Number($('cpu-level').value)) : null;
    inputs[1].setVirtual(ai ? {} : null);
    scene = 'fight'; show(null); startT = 90; endT = 0;
    announce('READY', 800); setTimeout(() => announce('GO!', 600), 900);
  }
  function endMatch() {
    const w = world.fighters.find((x) => x.stocks > 0);
    $('winner').textContent = w ? `${w.idx + 1}P ${w.name} の かち!` : 'ひきわけ';
    $('result-sub').textContent = world.fighters.map((x) => `${x.idx + 1}P ${x.name} ${Math.round(x.percent)}% / のこり ${x.stocks}`).join('   ');
    scene = 'result'; show('s-result'); $('announce').classList.add('hidden'); SFX.win();
  }

  function step() {
    f++;
    if (scene !== 'fight') return;
    if (startT > 0) startT--;
    const fs = world.fighters;
    // 入力
    if (ai) inputs[1].setVirtual(ai.think(world));
    const ins = fs.map((fg, i) => { const s = inputs[i].read(); return startT > 30 ? INPUT.blank() : s; });
    // 更新
    fs.forEach((fg, i) => fg.update(ins[i], world));
    // 当たり判定
    fs.forEach((a) => {
      const h = a.hitbox(); if (!h) return;
      fs.forEach((v) => {
        if (v === a || a.hitIds.has(v.idx) || v.dead) return;
        if (!overlap(h, v.hurt)) return;
        a.hitIds.add(v.idx);
        const dir = v.x >= a.x ? 1 : -1;
        const res = v.takeHit(h, dir, a.idx, world);
        if (res === 'hit') {
          const lag = Math.floor(h.dmg * 0.35) + 3; a.hitlag = lag; v.hitlag = lag;
          world.fx.push({ t: 'spark', x: (h.x + h.w / 2 + v.x) / 2, y: v.y - 22, life: 10 });
          world.shake = Math.min(14, 3 + h.dmg * 0.5); SFX.hit(h.dmg);
        } else if (res === 'shield') { a.hitlag = 4; }
      });
    });
    // 飛び道具
    world.projectiles.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.t++; p.life--;
      fs.forEach((v) => {
        if (v.idx === p.owner || v.dead || p.life <= 0) return;
        if (overlap({ x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h }, v.hurt)) {
          const res = v.takeHit(p, p.vx > 0 ? 1 : -1, p.owner, world);
          if (res) { p.life = 0; world.fx.push({ t: 'spark', x: p.x, y: p.y, life: 8 }); if (res === 'hit') { v.hitlag = 4; SFX.hit(p.dmg); } }
        }
      });
    });
    world.projectiles = world.projectiles.filter((p) => p.life > 0 && p.x > K.BLAST.l && p.x < K.BLAST.r);
    world.fx.forEach((e) => e.life--); world.fx = world.fx.filter((e) => e.life > 0);
    if (world.shake > 0) world.shake *= 0.85; if (world.shake < 0.5) world.shake = 0;
    // 決着
    if (!endT && fs.some((x) => x.stocks <= 0)) { endT = 80; announce('GAME!', 1400); }
    if (endT > 0 && --endT === 0) endMatch();
  }

  function draw() {
    ctx.clearRect(0, 0, K.W, K.H);
    if (scene === 'fight' || scene === 'result') {
      R.updateCamera(world.fighters, world.shake);
      R.begin(ctx);
      R.stage(ctx, f);
      R.projectiles(ctx, world.projectiles);
      world.fighters.forEach((fg) => R.fighter(ctx, fg, f, world));
      R.effects(ctx, world.fx);
      R.end(ctx);
      R.hud(ctx, world.fighters);
    } else {
      R.cam.x = 320; R.cam.y = 200; R.cam.z = 1;
      R.begin(ctx); R.stage(ctx, f); R.end(ctx);
    }
  }

  let acc = 0, last = performance.now();
  function loop(now) {
    acc = Math.min(acc + (now - last), 100); last = now;
    while (acc >= 1000 / 60) { acc -= 1000 / 60; step(); }
    draw();
    requestAnimationFrame(loop);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(loop)); else requestAnimationFrame(loop);
})();
