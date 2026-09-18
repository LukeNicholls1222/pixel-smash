// 3D 描画（three.js）。動きと当たり判定は 2D のまま、見た目だけ 3D にする。
// 2D の座標 (x, y, y は下向き) を 3D の (x, -y, 0) に置く。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';

const K = window.K, PI = Math.PI;
const R3D = { ready: false, failed: false };
window.R3D = R3D;

let renderer, scene, camera, sun, hemi;
const actors = new Map();     // fighter -> { group, model, mixer, actions, cfg, placeholder }
const projMeshes = new Map(); // projectile -> mesh
let shieldMeshes = [];
const loader = new GLTFLoader();
const modelCache = new Map();

function init() {
  const cv = document.getElementById('gl');
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { R3D.failed = true; console.warn('WebGL unavailable', e); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(K.W, K.H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x9db8e6, 520, 1900);
  camera = new THREE.PerspectiveCamera(34, K.W / K.H, 1, 4000);

  // 光
  hemi = new THREE.HemisphereLight(0xbfd8ff, 0x5a4a30, 0.9); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xfff1dc, 2.4); sun.position.set(-160, 260, 220); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -320; sc.right = 320; sc.top = 220; sc.bottom = -120; sc.near = 50; sc.far = 900;
  sun.shadow.bias = -0.0006; sun.target.position.set(320, -270, 0); scene.add(sun); scene.add(sun.target);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  buildSky(); buildStage(); buildBackdrop();
  R3D.ready = true;
}

// ---------- 空 ----------
function buildSky() {
  const geo = new THREE.SphereGeometry(2500, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x0c1a44) }, mid: { value: new THREE.Color(0x3f74c8) }, bot: { value: new THREE.Color(0xf3dcb5) } },
    vertexShader: 'varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top, mid, bot; varying vec3 vW; void main(){ float h = normalize(vW - vec3(320.0,-270.0,0.0)).y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.55)) : mix(mid, bot, pow(-h, 0.8)); gl_FragColor = vec4(c, 1.0); }',
  });
  const sky = new THREE.Mesh(geo, mat); sky.position.set(320, -270, 0); scene.add(sky);
  // 太陽
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(28, 24, 24), new THREE.MeshBasicMaterial({ color: 0xfff6d5, fog: false }));
  sunMesh.position.set(-160 + 320, 260 - 270 + 300, -900); scene.add(sunMesh);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.18, fog: false }));
  halo.position.copy(sunMesh.position); scene.add(halo);
}

// ---------- ステージ ----------
function mat(color, rough = 0.85, metal = 0) { return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }); }
function buildStage() {
  const F = K.STAGE.floor, depth = 110;
  const rock = mat(0x5a4838, 0.95), grass = mat(0x4f9a33, 0.9), dark = mat(0x2a2119, 0.95);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(F.w + 8, 420, depth), [rock, rock, grass, dark, rock, rock]);
  floor.position.set(F.x + F.w / 2, -(F.y + 210), 0); floor.receiveShadow = true; floor.castShadow = true; scene.add(floor);
  // 縁の草の帯と土のひび
  const rim = new THREE.Mesh(new THREE.BoxGeometry(F.w + 10, 5, depth + 2), mat(0x3f8a24, 0.9));
  rim.position.set(F.x + F.w / 2, -(F.y + 2.5), 0); rim.receiveShadow = true; scene.add(rim);
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(4 + Math.random() * 10, 2 + Math.random() * 3, 3), mat(0x3a2a1c, 1));
    s.position.set(F.x + 10 + Math.random() * (F.w - 20), -(F.y + 20 + Math.random() * 300), depth / 2 + 1.2); scene.add(s);
  }
  K.STAGE.plats.forEach((p) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(p.w, 7, 40), [mat(0x7f7367), mat(0x7f7367), mat(0x9a8e80, 0.8), mat(0x4e463e), mat(0x8a7d70), mat(0x8a7d70)]);
    m.position.set(p.x + p.w / 2, -(p.y + 3.5), 0); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    const g = new THREE.Mesh(new THREE.BoxGeometry(p.w - 6, 1.5, 34), mat(0x5f9e3a, 0.9)); g.position.set(p.x + p.w / 2, -(p.y - 0.5), 0); scene.add(g);
  });
}
function buildBackdrop() {
  // 遠くの山と雲
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 26; i++) {
    const far = i % 2 === 0;
    const h = 90 + rnd(i) * 170, r = 110 + rnd(i * 3) * 140;
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6 + (i % 3)), mat(far ? 0x7d95c8 : 0x56709f, 1));
    m.position.set(-600 + i * 70 + rnd(i * 7) * 60, -270 - 120 + h / 2, far ? -1100 - rnd(i * 5) * 400 : -700 - rnd(i * 5) * 250);
    m.rotation.y = rnd(i * 9) * PI; scene.add(m);
  }
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0x334455, emissiveIntensity: 0.4 });
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group();
    for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(18 + rnd(i * 11 + k) * 18, 12, 10), cloudMat); s.position.set(k * 22 - 30, (rnd(i + k) - 0.5) * 8, (rnd(i * 2 + k) - 0.5) * 20); s.scale.y = 0.55; g.add(s); }
    g.position.set(-400 + rnd(i * 13) * 1500, 60 + rnd(i * 17) * 160, -600 - rnd(i * 19) * 500);
    g.userData.speed = 0.06 + rnd(i) * 0.08; scene.add(g); clouds.push(g);
  }
}
const clouds = [];

// ---------- ファイター ----------
function placeholder(col) {
  const g = new THREE.Group();
  const bodyM = new THREE.Mesh(new THREE.CapsuleGeometry(9, 22, 6, 14), mat(col, 0.6)); bodyM.position.y = 20; bodyM.castShadow = true; g.add(bodyM);
  const head = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 14), mat(0xe9b58c, 0.7)); head.position.y = 40; head.castShadow = true; g.add(head);
  return g;
}
function loadModel(cfg) {
  if (modelCache.has(cfg.src)) return modelCache.get(cfg.src);
  const p = new Promise((res, rej) => loader.load(cfg.src, res, undefined, rej));
  modelCache.set(cfg.src, p); return p;
}
// スキンメッシュは Box3 が当てにならないので、骨の位置から背丈と足元を測る
function measure(scn) {
  scn.updateMatrixWorld(true);
  const p = new THREE.Vector3(); let minY = Infinity, maxY = -Infinity, n = 0;
  scn.traverse((o) => { if (o.isBone) { o.getWorldPosition(p); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); n++; } });
  if (n < 2) { const box = new THREE.Box3().setFromObject(scn); return { minY: box.min.y, h: box.max.y - box.min.y || 1 }; }
  const h = (maxY - minY) * 1.12 || 1;   // 骨の範囲に肉付きぶんを足す
  return { minY: minY - (maxY - minY) * 0.04, h };
}
function ensureActor(fg) {
  let a = actors.get(fg); if (a) return a;
  const cfg = fg.c.model || null;
  const group = new THREE.Group(); scene.add(group);
  a = { group, cfg, model: null, mixer: null, actions: {}, cur: null, ph: placeholder(parseInt(fg.c.col.body.slice(1), 16)) };
  group.add(a.ph); actors.set(fg, a);
  if (cfg) loadModel(cfg).then((gltf) => {
    const scn = skClone(gltf.scene);
    // 元の身長を測って、食らい判定の高さに合わせる
    const m = measure(scn);
    const s = ((fg.c.hurt || K.HURT).h + 4) / m.h; scn.scale.setScalar(s);
    scn.position.y = -m.minY * s;
    if (window.__dbg) (window.__dbg.models = window.__dbg.models || {})[fg.c.id] = { rawH: m.h.toFixed(2), scale: s.toFixed(4) };
    scn.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; if (o.material && o.material.map) o.material.map.colorSpace = THREE.SRGBColorSpace; } });
    scn.rotation.y = cfg.face || 0;
    a.model = scn; a.mixer = new THREE.AnimationMixer(scn);
    gltf.animations.forEach((clip) => { a.actions[clip.name] = a.mixer.clipAction(clip); });
    group.remove(a.ph); group.add(scn);
  }).catch((e) => console.warn('model load failed', cfg.src, e));
  return a;
}
function clipName(fg, cfg) {
  const c = cfg.clips || {}, st = fg.state;
  const pick = (...ns) => ns.map((n) => c[n]).find(Boolean) || c.idle;
  switch (st) {
    case 'walk': return pick('walk', 'run');
    case 'run': return pick('run', 'walk');
    case 'air': return fg.vy < 0 ? pick('jump', 'fall', 'idle') : pick('fall', 'jump', 'idle');
    case 'helpless': return pick('fall', 'hurt', 'idle');
    case 'hitstun': case 'stun': return pick('hurt', 'idle');
    case 'ledge': return pick('hang', 'jump', 'idle');
    case 'jumpsquat': case 'landing': return pick('crouch', 'idle');
    case 'shield': return pick('block', 'idle');
    case 'attack': {
      const mv = fg.move;
      if (/smash$/.test(mv)) return pick('attack2', 'attack1');
      if (mv === 'nspecial') return pick('attack3', 'attack2', 'attack1');
      if (mv === 'upspecial') return pick('jump', 'attack1');
      if (/air$/.test(mv)) return pick('attackAir', 'attack1');
      return pick('attack1');
    }
    default: return c.idle;
  }
}
function updateActor(fg, a, dt) {
  const HS = fg.c.hurt || K.HURT;
  a.group.position.set(fg.x, -fg.y, 0);
  a.group.rotation.y = fg.facing > 0 ? 0 : PI;
  a.group.visible = !fg.dead && !(fg.invuln > 0 && (Math.floor(performance.now() / 66) % 2 === 0));
  if (!a.model || !a.mixer) {
    // 仮の立体は状態に合わせて少しだけ動かす
    const t = performance.now() / 1000;
    a.ph.rotation.z = fg.state === 'attack' ? 0.35 : fg.state === 'hitstun' ? -0.5 : 0;
    a.ph.position.y = fg.state === 'run' ? Math.abs(Math.sin(t * 14)) * 3 : 0;
    return;
  }
  const name = clipName(fg, a.cfg), act = a.actions[name] || a.actions[a.cfg.clips.idle];
  if (!act) return;
  if (fg.state === 'attack' && fg.md) {
    // 技の進みに合わせて時間をなぞる
    if (a.cur !== act) { if (a.cur) a.cur.stop(); act.reset().play(); a.cur = act; }
    act.paused = true;
    const total = fg.md.startup + fg.md.active + fg.md.recover, hitPoint = a.cfg.hit ?? 0.45;
    const p = fg.moveT <= fg.md.startup ? (fg.moveT / fg.md.startup) * hitPoint : hitPoint + ((fg.moveT - fg.md.startup) / (total - fg.md.startup)) * (1 - hitPoint);
    act.time = Math.min(act.getClip().duration - 0.001, p * act.getClip().duration);
  } else if (fg.state === 'hitstun' || fg.state === 'stun' || fg.state === 'helpless') {
    if (a.cur !== act) { if (a.cur) a.cur.fadeOut(0.05); act.reset().setLoop(THREE.LoopOnce, 1).fadeIn(0.05).play(); act.clampWhenFinished = true; a.cur = act; }
    act.paused = false;
  } else {
    if (a.cur !== act) { if (a.cur) a.cur.fadeOut(0.12); act.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.12).play(); a.cur = act; }
    act.paused = false;
    act.timeScale = fg.state === 'run' ? 1.25 : 1;
  }
  a.mixer.update(dt);
}

// ---------- 投射と描画 ----------
const _v = new THREE.Vector3();
function project(x, y) {
  _v.set(x, -y, 0).project(camera);
  return [(_v.x + 1) / 2 * K.W, (1 - _v.y) / 2 * K.H];
}
let lastT = performance.now();
function draw(world, cam, f) {
  if (!R3D.ready) return;
  const now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  // カメラ: 2D のカメラ（中心と倍率）から距離を出す
  const visH = K.H / cam.z, d = (visH / 2) / Math.tan(camera.fov * PI / 360);
  camera.position.set(cam.x + cam.sx * 0.5, -cam.y + d * 0.14 + cam.sy * 0.5, d);
  camera.lookAt(cam.x, -cam.y, 0);
  // 影の光源はステージに追従
  sun.position.set(cam.x - 160, -cam.y + 260, 220); sun.target.position.set(cam.x, -cam.y, 0);
  clouds.forEach((c) => { c.position.x += c.userData.speed; if (c.position.x > 1300) c.position.x = -600; });
  // ファイター
  const seen = new Set();
  world.fighters.forEach((fg) => { const a = ensureActor(fg); seen.add(fg); updateActor(fg, a, dt); });
  for (const [fg, a] of actors) if (!seen.has(fg)) { scene.remove(a.group); actors.delete(fg); }
  // シールド
  shieldMeshes.forEach((m) => scene.remove(m)); shieldMeshes = [];
  world.fighters.forEach((fg) => {
    if (fg.state !== 'shield' || fg.dead) return;
    const HS = fg.c.hurt || K.HURT, r = HS.h * 0.42 + (fg.shieldHP / 60) * 12;
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), new THREE.MeshPhysicalMaterial({ color: fg.idx === 0 ? 0xffc23a : 0x4a8cff, transparent: true, opacity: 0.35, roughness: 0.1, transmission: 0.4, thickness: 4 }));
    m.position.set(fg.x, -fg.y + HS.h / 2, 0); scene.add(m); shieldMeshes.push(m);
  });
  // 飛び道具
  const live = new Set(world.projectiles);
  for (const [p, m] of projMeshes) if (!live.has(p)) { scene.remove(m); projMeshes.delete(p); }
  world.projectiles.forEach((p) => {
    let m = projMeshes.get(p);
    if (!m) {
      m = new THREE.Group();
      const core = new THREE.Mesh(new THREE.SphereGeometry(p.kind === 'beam' ? 6 : 4, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: p.kind === 'beam' ? 0x66aaff : 0xff4060, emissiveIntensity: 2.5 }));
      m.add(core); const l = new THREE.PointLight(p.kind === 'beam' ? 0x66aaff : 0xff4060, 60, 90); m.add(l);
      scene.add(m); projMeshes.set(p, m);
    }
    m.position.set(p.x, -p.y, 0); m.rotation.z += 0.3;
  });
  renderer.render(scene, camera);
}
function resize() { if (renderer) { renderer.setSize(K.W, K.H, false); camera.aspect = K.W / K.H; camera.updateProjectionMatrix(); } }
function reset() { for (const [, a] of actors) scene.remove(a.group); actors.clear(); }

// ---------- 顔写真（オフスクリーンでモデルを1枚描く） ----------
let pr = null, pscene = null, pcam = null;
const portraitCache = new Map();
function portrait(cfg, size = 160, cb) {
  if (!R3D.ready) return null;
  const key = cfg.src + ':' + size;
  if (portraitCache.has(key)) { const c = portraitCache.get(key); if (cb) { if (c.done) cb(c.canvas); else c.cbs.push(cb); } return c.canvas; }
  const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size * 1.25;
  const entry = { canvas, done: false, cbs: cb ? [cb] : [] }; portraitCache.set(key, entry);
  if (!pr) {
    pr = new THREE.WebGLRenderer({ antialias: true, alpha: true }); pr.setPixelRatio(1); pr.outputColorSpace = THREE.SRGBColorSpace; pr.toneMapping = THREE.ACESFilmicToneMapping;
    pscene = new THREE.Scene();
    pscene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2));
    const l = new THREE.DirectionalLight(0xffffff, 2.2); l.position.set(-2, 3, 4); pscene.add(l);
    pcam = new THREE.PerspectiveCamera(28, 0.8, 0.1, 1000);
  }
  loadModel(cfg).then((gltf) => {
    const m = skClone(gltf.scene);
    const mm = measure(m); const h = mm.h;
    m.position.set(0, -mm.minY, 0); m.rotation.y = (cfg.face || 0) - Math.PI / 2 + 0.5;
    const holder = new THREE.Group(); holder.add(m); pscene.add(holder);
    pr.setSize(size, size * 1.25, false); pcam.aspect = 0.8; pcam.updateProjectionMatrix();
    const d = (h / 2) / Math.tan(pcam.fov * PI / 360) * 1.25;
    pcam.position.set(0, h * 0.55, d); pcam.lookAt(0, h * 0.5, 0);
    pr.render(pscene, pcam);
    canvas.getContext('2d').drawImage(pr.domElement, 0, 0);
    pscene.remove(holder); entry.done = true; entry.cbs.forEach((f) => f(canvas)); entry.cbs = [];
  }).catch((e) => console.warn('portrait failed', e));
  return canvas;
}
Object.assign(R3D, { init, draw, project, resize, reset, portrait });
init();
