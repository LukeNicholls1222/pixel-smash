// 画像スプライトの読み込みと、ファイターの状態に合わせたコマ選び。
// art.atlas があれば ATLAS（TexturePacker 形式を変換したもの）のコマ矩形を使う。
(function () {
  function load(art) {
    if (!art || art._loaded !== undefined) return;
    art._loaded = false;
    const img = new Image();
    img.onload = () => { measure(art, img); art._loaded = true; };
    img.onerror = () => { console.warn('sprite load failed', art.src); art._loaded = true; art._failed = true; };
    img.src = art.src; art._img = img;
  }
  // 待機1コマ目の不透明な範囲から、足元の位置と縮尺を決める。
  // 画像には余白が入っているので、コマの矩形そのままでは足が浮く。
  function measure(art, img) {
    const A = window.ATLAS?.[art.atlas]; if (!A || !A.clips.idle) return;
    const [sx, sy, w, h, ox, oy] = A.clips.idle[0];
    const cv = document.createElement('canvas'); cv.width = A.sw; cv.height = A.sh;
    const c = cv.getContext('2d');
    c.drawImage(img, sx, sy, w, h, (A.sw - w) / 2 + ox, (A.sh - h) / 2 - oy, w, h);
    const d = c.getImageData(0, 0, A.sw, A.sh).data;
    let top = A.sh, bottom = -1, left = A.sw, right = -1;
    for (let y = 0; y < A.sh; y++) for (let x = 0; x < A.sw; x++) {
      if (d[(y * A.sw + x) * 4 + 3] > 40) { if (y < top) top = y; if (y > bottom) bottom = y; if (x < left) left = x; if (x > right) right = x; }
    }
    if (bottom < 0) return;
    art._base = bottom + 1;
    art._cx = (left + right) / 2 - A.sw / 2;   // 中心のずれ
    art._scale = (art.height || 48) / (bottom - top + 1);
  }
  function hasClip(art, n) { return !!(art.clips && art.clips[n] && (window.ATLAS?.[art.atlas]?.clips?.[art.clips[n].name || art.clips[n]])); }
  function clipFor(fg) {
    const art = fg.c.art, st = fg.state;
    const pick = (...names) => names.find((n) => hasClip(art, n)) || 'idle';
    switch (st) {
      case 'walk': return pick('walk', 'run');
      case 'run': return pick('run', 'walk');
      case 'jumpsquat': case 'landing': return pick('idle');
      case 'air': return fg.vy < 0 ? pick('jump', 'run', 'idle') : pick('fall', 'jump', 'run', 'idle');
      case 'helpless': return pick('hurt', 'fall', 'idle');
      case 'hitstun': case 'stun': return pick('hurt', 'idle');
      case 'ledge': return pick('hang', 'idle');
      case 'attack': {
        const mv = fg.move;
        if (/smash$/.test(mv)) return pick('attack2', 'attack1');
        if (mv === 'nspecial') return pick('attack3', 'attack2', 'attack1');
        if (mv === 'upspecial') return pick('jump', 'run', 'attack1');
        return pick('attack1');
      }
      default: return pick('idle');
    }
  }
  function framesOf(art, clipName) {
    const c = art.clips[clipName]; if (!c) return null;
    const name = c.name || c;
    return { frames: window.ATLAS?.[art.atlas]?.clips?.[name] || null, fps: c.fps || 10, hit: c.hit, hold: c.hold };
  }
  function frameFor(fg, clip, f) {
    const n = clip.frames.length;
    if (fg.state === 'attack' && fg.md) {
      const total = fg.md.startup + fg.md.active + fg.md.recover;
      const hitPoint = (clip.hit !== undefined ? clip.hit : 0.5) * n;
      let idx;
      if (fg.moveT <= fg.md.startup) idx = (fg.moveT / fg.md.startup) * hitPoint;
      else idx = hitPoint + ((fg.moveT - fg.md.startup) / (total - fg.md.startup)) * (n - hitPoint);
      return Math.min(n - 1, Math.max(0, Math.floor(idx)));
    }
    if (fg.state === 'hitstun' || fg.state === 'stun' || fg.state === 'helpless') return Math.min(n - 1, Math.floor(fg.stateT / 4));
    if (clip.hold) return Math.min(n - 1, Math.floor(fg.stateT / (60 / clip.fps)));
    return Math.floor((fg.stateT + (fg.idx || 0) * 3) / (60 / clip.fps)) % n;
  }
  function draw(ctx, fg, f, x, y, facing, alpha = 1, forceClip = null, forceFrame = null) {
    const art = fg.c.art; if (!art || !art._loaded || art._failed) return false;
    const A = window.ATLAS?.[art.atlas]; if (!A) return false;
    const name = forceClip || clipFor(fg), clip = framesOf(art, name);
    if (!clip || !clip.frames) return false;
    const idx = forceFrame !== null ? Math.min(clip.frames.length - 1, forceFrame) : frameFor(fg, clip, f);
    const [sx, sy, w, h, ox, oy] = clip.frames[idx];
    const top = (A.sh - h) / 2 - oy;               // 元キャンバス内での上端
    const dx = -A.sw / 2 + (A.sw - w) / 2 + ox;    // 元キャンバス内での左端（中心基準）
    const dy = top - (art._base ?? A.base);         // 足元を y=0 に
    const s = art._scale || art.scale || 0.5, dir = facing * (art.faceLeft ? -1 : 1);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y + (art.lift || 0)); ctx.scale(dir * s, s);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(art._img, sx, sy, w, h, dx - (art._cx || 0) + (art.ox || 0), dy, w, h);
    ctx.restore();
    return true;
  }
  window.SPRITES = { load, draw, clipFor };
})();
