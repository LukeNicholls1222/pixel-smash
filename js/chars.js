// 3体のファイター。数字は全部ここで調整する。
// 技: startup(発生まで) active(当たり判定が出ている) recover(硬直) dmg angle(ふっとぶ角度) bkb(基礎) kbg(伸び)
// box は向いている方向を +x とした相対座標（足元が原点）
(function () {
  const M = (startup, active, recover, dmg, angle, bkb, kbg, box, extra = {}) =>
    ({ startup, active, recover, dmg, angle, bkb, kbg, box, ...extra });

  const CHARS = [
    {
      id: 'kai', name: 'カオスナイト', desc: '大剣の騎士。射程が長く扱いやすい。',
      hurt: { w: 26, h: 50 }, art: { atlas: 'knight', src: 'assets/duelyst/knight.png', height: 54, clips: { idle: { name: 'idle', fps: 10 }, run: { name: 'run', fps: 14 }, attack1: { name: 'attack', hit: 0.45 }, hurt: { name: 'hit' }, death: { name: 'death' } } },
      weight: 100, walk: 2.0, run: 3.0, air: 2.2, airAcc: 0.28, jump: -9.6, djump: -8.8, jumps: 2, fall: 8, ffall: 13,
      col: { body: '#2f5fb8', body2: '#1d3c78', skin: '#e9b58c', hair: '#d9b25a', acc: '#d8dde6', glove: '#3a2a1a' }, weapon: 'none',
      moves: {
        jab:    M(4, 3, 9, 4, 50, 2, 0.5, { x: 8, y: -24, w: 30, h: 14 }),
        ftilt:  M(7, 4, 15, 9, 42, 4, 0.9, { x: 10, y: -28, w: 34, h: 18 }),
        utilt:  M(6, 5, 15, 8, 85, 4, 0.9, { x: -8, y: -56, w: 30, h: 30 }),
        dtilt:  M(5, 4, 12, 6, 75, 3, 0.7, { x: 6, y: -10, w: 34, h: 10 }),
        fsmash: M(15, 5, 24, 17, 40, 6, 1.15, { x: 10, y: -32, w: 42, h: 24 }),
        usmash: M(12, 6, 24, 15, 88, 6, 1.1, { x: -12, y: -64, w: 36, h: 36 }),
        dsmash: M(12, 5, 26, 13, 35, 5, 1.05, { x: -34, y: -12, w: 68, h: 14 }),
        nair:   M(5, 14, 10, 8, 45, 3, 0.8, { x: -20, y: -36, w: 40, h: 34 }, { landing: 8 }),
        fair:   M(8, 5, 14, 11, 40, 4, 0.95, { x: 6, y: -32, w: 32, h: 24 }, { landing: 10 }),
        bair:   M(7, 5, 14, 12, 40, 5, 1.0, { x: -38, y: -32, w: 30, h: 22 }, { landing: 10 }),
        uair:   M(6, 6, 12, 9, 85, 4, 0.9, { x: -14, y: -60, w: 28, h: 26 }, { landing: 8 }),
        dair:   M(12, 6, 16, 12, 270, 4, 1.0, { x: -10, y: -6, w: 20, h: 26 }, { landing: 16 }),
        nspecial: M(12, 1, 20, 0, 0, 0, 0, null, { projectile: { vx: 5.5, vy: 0, life: 42, dmg: 6, angle: 45, bkb: 3, kbg: 0.6, w: 16, h: 8, kind: 'beam' } }),
        upspecial: M(5, 18, 16, 10, 82, 5, 0.9, { x: -14, y: -52, w: 28, h: 44 }, { motion: { vy: -8.6, vx: 1.6 }, helpless: true }),
      },
    },
    {
      id: 'goro', name: 'モルテンゴーレム', desc: '溶岩の巨人。遅いが一撃が重い。',
      hurt: { w: 34, h: 58 }, art: { atlas: 'golem', src: 'assets/duelyst/golem.png', height: 60, clips: { idle: { name: 'idle', fps: 10 }, run: { name: 'run', fps: 12 }, attack1: { name: 'attack', hit: 0.5 }, hurt: { name: 'hit' }, death: { name: 'death' } } },
      weight: 128, walk: 1.5, run: 2.3, air: 1.6, airAcc: 0.22, jump: -9.2, djump: -8.4, jumps: 2, fall: 8.5, ffall: 13,
      col: { body: '#b8302a', body2: '#6e1a16', skin: '#d99a6c', hair: '#2c1a10', acc: '#e0b040', glove: '#8a1a10' }, weapon: 'none',
      moves: {
        jab:    M(5, 3, 11, 5, 50, 3, 0.5, { x: 8, y: -26, w: 24, h: 16 }),
        ftilt:  M(9, 4, 17, 12, 42, 5, 0.95, { x: 8, y: -30, w: 30, h: 20 }),
        utilt:  M(8, 5, 17, 11, 88, 5, 0.95, { x: -10, y: -58, w: 30, h: 30 }),
        dtilt:  M(7, 4, 14, 9, 70, 4, 0.8, { x: 6, y: -12, w: 30, h: 12 }),
        fsmash: M(19, 5, 28, 22, 38, 8, 1.2, { x: 8, y: -34, w: 38, h: 28 }),
        usmash: M(16, 6, 28, 19, 90, 7, 1.15, { x: -14, y: -66, w: 36, h: 38 }),
        dsmash: M(15, 5, 30, 17, 32, 7, 1.1, { x: -34, y: -14, w: 68, h: 16 }),
        nair:   M(6, 12, 12, 10, 45, 4, 0.85, { x: -20, y: -38, w: 40, h: 34 }, { landing: 10 }),
        fair:   M(11, 5, 16, 15, 38, 5, 1.05, { x: 6, y: -34, w: 30, h: 26 }, { landing: 14 }),
        bair:   M(9, 5, 16, 15, 40, 6, 1.05, { x: -36, y: -34, w: 30, h: 24 }, { landing: 14 }),
        uair:   M(8, 6, 14, 12, 85, 5, 0.95, { x: -14, y: -62, w: 28, h: 28 }, { landing: 10 }),
        dair:   M(14, 6, 20, 16, 270, 5, 1.05, { x: -12, y: -6, w: 24, h: 26 }, { landing: 20 }),
        nspecial: M(20, 6, 30, 22, 40, 8, 1.25, { x: 6, y: -32, w: 40, h: 26 }, { charge: true }),
        upspecial: M(6, 16, 20, 13, 85, 6, 0.95, { x: -14, y: -54, w: 30, h: 44 }, { motion: { vy: -9.2, vx: 1.2 }, helpless: true }),
      },
    },
    {
      id: 'shino', name: 'フェンリル', desc: '人狼。速くて3段ジャンプ。軽い。',
      hurt: { w: 28, h: 46 }, art: { atlas: 'wolf', src: 'assets/duelyst/wolf.png', height: 50, clips: { idle: { name: 'idle', fps: 10 }, run: { name: 'run', fps: 14 }, attack1: { name: 'attack', hit: 0.45 }, hurt: { name: 'hit' }, death: { name: 'death' } } },
      weight: 82, walk: 2.5, run: 3.7, air: 2.5, airAcc: 0.36, jump: -9.2, djump: -8.4, jumps: 3, fall: 8, ffall: 15,
      col: { body: '#3b3552', body2: '#241f36', skin: '#f0c9a4', hair: '#15121a', acc: '#d8324e', glove: '#241f36' }, weapon: 'none',
      moves: {
        jab:    M(2, 3, 7, 2, 55, 1, 0.4, { x: 8, y: -24, w: 22, h: 14 }),
        ftilt:  M(5, 3, 12, 7, 40, 3, 0.85, { x: 8, y: -28, w: 28, h: 16 }),
        utilt:  M(4, 4, 12, 6, 88, 3, 0.85, { x: -8, y: -54, w: 26, h: 28 }),
        dtilt:  M(4, 3, 10, 5, 70, 2, 0.7, { x: 6, y: -10, w: 30, h: 10 }),
        fsmash: M(11, 4, 20, 13, 40, 5, 1.05, { x: 8, y: -30, w: 34, h: 22 }),
        usmash: M(9, 5, 20, 12, 88, 5, 1.0, { x: -12, y: -62, w: 32, h: 34 }),
        dsmash: M(9, 4, 22, 11, 30, 4, 1.0, { x: -32, y: -12, w: 64, h: 14 }),
        nair:   M(3, 12, 8, 6, 45, 2, 0.75, { x: -18, y: -34, w: 36, h: 32 }, { landing: 6 }),
        fair:   M(6, 4, 12, 9, 40, 3, 0.9, { x: 6, y: -30, w: 30, h: 22 }, { landing: 8 }),
        bair:   M(5, 4, 12, 10, 40, 4, 0.95, { x: -34, y: -30, w: 28, h: 20 }, { landing: 8 }),
        uair:   M(4, 5, 10, 8, 85, 3, 0.85, { x: -12, y: -56, w: 26, h: 24 }, { landing: 6 }),
        dair:   M(9, 6, 14, 9, 270, 3, 1.0, { x: -10, y: -6, w: 20, h: 24 }, { landing: 12 }),
        nspecial: M(8, 1, 14, 0, 0, 0, 0, null, { projectile: { vx: 7.5, vy: 0, life: 50, dmg: 4, angle: 50, bkb: 2, kbg: 0.45, w: 10, h: 10, kind: 'star' } }),
        upspecial: M(6, 14, 14, 0, 0, 0, 0, null, { motion: { vy: -11, vx: 2.4 }, helpless: true, intangible: true }),
      },
    },
  ];
  window.CHARS = CHARS;
})();
