// ファイター本体。物理、状態、技、被弾。
(function () {
  const K = window.K;
  const AERIAL = new Set(['nair', 'fair', 'bair', 'uair', 'dair']);

  class Fighter {
    constructor(char, idx, input) {
      this.c = char; this.idx = idx; this.input = input;
      this.name = char.name;
      this.stocks = K.STOCKS;
      this.spawn();
    }
    spawn() {
      const s = K.SPAWN[this.idx];
      this.x = s.x; this.y = s.y - 60; this.vx = 0; this.vy = 0;
      this.facing = this.idx === 0 ? 1 : -1;
      this.grounded = false; this.onPlat = null;
      this.state = 'air'; this.stateT = 0;
      this.move = null; this.md = null; this.moveT = 0; this.hitIds = new Set();
      this.percent = 0; this.hitstun = 0; this.hitlag = 0; this.tumble = false;
      this.shieldHP = 60; this.shieldStun = 0;
      this.jumpsLeft = this.c.jumps - 1; this.fastfall = false; this.helpless = false;
      this.invuln = 90; this.dropT = 0; this.chargeT = 0; this.holdT = 0;
      this.dead = false; this.respawnT = 0; this.lastHit = -1;
      this.shake = 0; this.trail = []; this.wtrail = [];
      this.ledge = null; this.ledgeT = 0; this.ledgeCd = 0;
    }
    get hurt() { return { x: this.x - K.HURT.w / 2, y: this.y - K.HURT.h, w: K.HURT.w, h: K.HURT.h }; }
    get actionable() { return ['idle', 'walk', 'run', 'air'].includes(this.state); }

    // 技の当たり判定（ワールド座標）。出ていなければ null
    hitbox() {
      if (this.state !== 'attack' || !this.md || !this.md.box) return null;
      const s = this.md.startup, a = this.md.active;
      if (this.moveT <= s || this.moveT > s + a) return null;
      const b = this.md.box;
      const x = this.facing > 0 ? this.x + b.x : this.x - b.x - b.w;
      return { x, y: this.y + b.y, w: b.w, h: b.h, dmg: this.moveDmg(), angle: this.md.angle, bkb: this.md.bkb, kbg: this.md.kbg };
    }
    moveDmg() {
      if (!this.md) return 0;
      if (this.md.charge) return Math.round(this.md.dmg * (0.45 + 0.55 * Math.min(1, this.chargeT / 60)));
      return this.md.dmg;
    }

    startMove(name) {
      const md = this.c.moves[name]; if (!md) return;
      this.state = 'attack'; this.stateT = 0; this.move = name; this.md = md; this.moveT = 0;
      this.hitIds = new Set(); this.chargeT = 0; this.fastfall = false;
      if (md.motion) this.vy = Math.min(this.vy, 0);
      if (this.grounded && !AERIAL.has(name)) this.vx *= 0.3;
      SFX.swing();
    }
    endMove() {
      this.move = null; this.md = null; this.moveT = 0;
      this.state = this.grounded ? 'idle' : 'air'; this.stateT = 0;
    }

    update(inp, world) {
      if (this.hitlag > 0) { this.hitlag--; return; }
      if (this.dead) {
        if (--this.respawnT <= 0 && this.stocks > 0) { this.dead = false; this.spawn(); }
        return;
      }
      this.stateT++;
      if (this.invuln > 0) this.invuln--;
      if (this.dropT > 0) this.dropT--;
      if (this.ledgeCd > 0) this.ledgeCd--;
      if (this.shieldStun > 0) this.shieldStun--;
      if (this.state !== 'shield') this.shieldHP = Math.min(60, this.shieldHP + 0.12);

      // ---- 崖つかまり ----
      if (this.state === 'ledge') {
        const L = this.ledge; this.ledgeT++;
        this.vx = 0; this.vy = 0; this.x = L.x - L.dir * 8; this.y = L.y + 22; this.facing = L.dir;
        if (this.ledgeT > 8) {
          const climb = () => { this.leaveLedge(); this.x = L.x + L.dir * 16; this.y = L.y; this.grounded = true; this.onPlat = null; };
          if (inp.jP) { climb(); this.grounded = false; this.vy = this.c.jump * 0.9; this.state = 'air'; this.stateT = 0; SFX.jump(); }
          else if (inp.u || inp.x === L.dir) { climb(); this.state = 'landing'; this.landLag = 6; this.stateT = 0; }
          else if (inp.aP || inp.smP) { climb(); this.startMove('ftilt'); }
          else if (inp.d || inp.x === -L.dir || this.ledgeT > 120) { this.leaveLedge(); this.y += 14; this.state = 'air'; this.stateT = 0; }
        }
        return;
      }

      const g = this.grounded;

      // ---- 入力 ----
      if (this.actionable) {
        if (g) {
          if (inp.sh && this.shieldStun === 0) { this.state = 'shield'; this.stateT = 0; this.vx = 0; }
          else if (inp.jP) { this.state = 'jumpsquat'; this.stateT = 0; }
          else if (inp.smP) this.smashAttack(inp);
          else if (inp.aP) this.groundAttack(inp);
          else if (inp.bP) this.startMove(inp.u ? 'upspecial' : 'nspecial');
          else if (inp.d && this.onPlat && inp.dTap <= 6) { this.dropT = 10; this.grounded = false; this.onPlat = null; this.y += 2; this.state = 'air'; }
          else if (inp.x) {
            this.facing = inp.x; this.holdT++;
            const run = this.holdT > 6;
            this.vx = inp.x * (run ? this.c.run : this.c.walk);
            this.state = run ? 'run' : 'walk';
          } else { this.holdT = 0; this.vx *= 0.7; if (Math.abs(this.vx) < 0.2) this.vx = 0; this.state = 'idle'; }
        } else {
          if (inp.smP) this.airAttackDir(inp.smx, inp.smy);
          else if (inp.aP) this.airAttack(inp);
          else if (inp.bP) this.startMove(inp.u ? 'upspecial' : 'nspecial');
          else if (inp.jP && this.jumpsLeft > 0) { this.jumpsLeft--; this.vy = this.c.djump; this.fastfall = false; if (inp.x) this.facing = inp.x; world.fx.push({ t: 'puff', x: this.x, y: this.y, life: 10 }); SFX.jump(); }
        }
      }
      if (this.state === 'jumpsquat' && this.stateT >= 3) {
        this.vy = this.c.jump; this.grounded = false; this.onPlat = null; this.state = 'air'; this.stateT = 0; this.fastfall = false;
        world.fx.push({ t: 'dust', x: this.x, y: this.y, life: 10 }); SFX.jump();
      }
      if (this.state === 'shield') {
        this.shieldHP -= 0.25;
        if (this.shieldHP <= 0) { this.state = 'stun'; this.stateT = 0; this.shieldHP = 30; world.fx.push({ t: 'break', x: this.x, y: this.y - 20, life: 20 }); }
        else if (!inp.sh && this.shieldStun === 0) { this.state = 'idle'; this.stateT = 0; }
        else if (inp.jP && this.shieldStun === 0) { this.state = 'jumpsquat'; this.stateT = 0; }
      }
      if (this.state === 'stun' && this.stateT > 90) { this.state = 'idle'; this.stateT = 0; }
      if (this.state === 'landing' && this.stateT >= this.landLag) { this.state = 'idle'; this.stateT = 0; }
      if (this.state === 'hitstun') {
        if (--this.hitstun <= 0) { this.state = this.grounded ? 'idle' : 'air'; this.stateT = 0; this.tumble = false; }
      }

      // ---- 技の進行 ----
      if (this.state === 'attack') {
        const md = this.md;
        // ため（ゴロウの必殺）: 発生直前で止まってボタンを押している間ためる
        if (md.charge && this.moveT === md.startup - 1 && inp.b && this.chargeT < 60) { this.chargeT++; }
        else this.moveT++;
        if (md.projectile && this.moveT === md.startup) {
          const p = md.projectile;
          world.projectiles.push({ x: this.x + this.facing * 14, y: this.y - 26, vx: p.vx * this.facing, vy: p.vy, life: p.life, dmg: p.dmg, angle: p.angle, bkb: p.bkb, kbg: p.kbg, w: p.w, h: p.h, kind: p.kind, owner: this.idx, t: 0 });
          SFX.proj();
        }
        if (md.motion && this.moveT > md.startup && this.moveT <= md.startup + md.active) {
          this.vy = md.motion.vy;
          this.vx = inp.x ? inp.x * (md.motion.vx + 0.6) : this.facing * md.motion.vx * 0.5;
          if (inp.x) this.facing = inp.x;
          this.grounded = false; this.onPlat = null;
          if (md.intangible) this.trail.push({ x: this.x, y: this.y, f: this.facing, life: 8 });
        }
        if (this.moveT > md.startup + md.active + md.recover) {
          const wasHelpless = md.helpless && !this.grounded;
          this.endMove();
          if (wasHelpless) { this.state = 'helpless'; this.helpless = true; }
        }
      }

      // ---- 空中の操作（技中も少しだけ動ける） ----
      if (!this.grounded) {
        const canDrift = this.state === 'air' || this.state === 'helpless' || (this.state === 'attack' && AERIAL.has(this.move)) || (this.state === 'attack' && this.md && this.md.projectile);
        if (canDrift) {
          if (inp.x) { this.vx += inp.x * this.c.airAcc; this.vx = Math.max(-this.c.air, Math.min(this.c.air, this.vx)); }
          else this.vx *= 0.96;
        }
        if ((this.state === 'air' || this.state === 'helpless' || (this.state === 'attack' && AERIAL.has(this.move))) && inp.dTap === 0 && this.vy > 0) this.fastfall = true;
      }

      // ---- 物理 ----
      const prevY = this.y;
      if (!this.grounded) {
        if (!(this.state === 'attack' && this.md && this.md.motion && this.moveT > this.md.startup && this.moveT <= this.md.startup + this.md.active)) {
          this.vy += K.GRAV;
          const cap = this.fastfall ? this.c.ffall : this.c.fall;
          if (this.vy > cap) this.vy = cap;
        }
      } else {
        if (this.state !== 'walk' && this.state !== 'run') { this.vx *= 0.8; if (Math.abs(this.vx) < 0.1) this.vx = 0; }
      }
      this.x += this.vx; this.y += this.vy;
      this.trail.forEach((t) => t.life--); this.trail = this.trail.filter((t) => t.life > 0);

      // ---- 崖をつかむ ----
      if (!this.grounded && this.ledgeCd === 0 && this.vy >= -1.5 &&
          (this.state === 'air' || this.state === 'helpless' || (this.state === 'hitstun' && this.hitstun < 8))) {
        for (const L of K.LEDGES) {
          const outside = L.dir > 0 ? this.x < L.x + 2 : this.x > L.x - 2;
          if (outside && Math.abs(this.x - L.x) <= 18 && this.y >= L.y - 8 && this.y <= L.y + 44) { this.grabLedge(L, world); break; }
        }
        if (this.state === 'ledge') return;
      }

      // ---- 着地 / 落下 ----
      if (this.grounded) {
        if (!this.standingOn(this.x)) { this.grounded = false; this.onPlat = null; if (this.state === 'idle' || this.state === 'walk' || this.state === 'run') { this.state = 'air'; this.stateT = 0; } }
      } else if (this.vy >= 0) {
        const land = this.findLanding(prevY);
        if (land) {
          this.y = land.y; this.vy = 0; this.grounded = true; this.onPlat = land.plat; this.fastfall = false; this.helpless = false;
          this.jumpsLeft = this.c.jumps - 1;
          world.fx.push({ t: 'dust', x: this.x, y: this.y, life: 8 }); SFX.land();
          if (this.state === 'attack' && AERIAL.has(this.move)) { this.landLag = this.md.landing || 8; this.endMove(); this.state = 'landing'; this.stateT = 0; }
          else if (this.state === 'attack' && this.md && this.md.motion) { this.endMove(); this.state = 'landing'; this.landLag = 12; this.stateT = 0; }
          else if (this.state === 'helpless') { this.state = 'landing'; this.landLag = 14; this.stateT = 0; }
          else if (this.state === 'hitstun' && this.tumble) { this.state = 'landing'; this.landLag = 16; this.stateT = 0; this.hitstun = 0; this.tumble = false; }
          else if (this.state === 'air') { this.state = 'idle'; this.stateT = 0; }
        }
      }

      // ---- 場外 ----
      const B = K.BLAST;
      if (this.x < B.l || this.x > B.r || this.y < B.t || this.y > B.b) this.ko(world);
    }

    standingOn(x) {
      const F = K.STAGE.floor;
      if (this.onPlat === null && x >= F.x - 4 && x <= F.x + F.w + 4) return true;
      if (this.onPlat !== null) { const p = K.STAGE.plats[this.onPlat]; return x >= p.x - 4 && x <= p.x + p.w + 4; }
      return false;
    }
    findLanding(prevY) {
      const F = K.STAGE.floor;
      if (this.x >= F.x - 4 && this.x <= F.x + F.w + 4 && prevY <= F.y && this.y >= F.y) return { y: F.y, plat: null };
      if (this.dropT > 0) return null;
      for (let i = 0; i < K.STAGE.plats.length; i++) {
        const p = K.STAGE.plats[i];
        if (this.x >= p.x - 4 && this.x <= p.x + p.w + 4 && prevY <= p.y && this.y >= p.y) return { y: p.y, plat: i };
      }
      return null;
    }

    grabLedge(L, world) {
      this.ledge = L; this.state = 'ledge'; this.stateT = 0; this.ledgeT = 0;
      this.vx = 0; this.vy = 0; this.move = null; this.md = null;
      this.jumpsLeft = this.c.jumps - 1; this.helpless = false; this.fastfall = false; this.hitstun = 0; this.tumble = false;
      this.invuln = Math.max(this.invuln, 28);
      world.fx.push({ t: 'dust', x: L.x, y: L.y, life: 8 }); SFX.land();
    }
    leaveLedge() { this.ledge = null; this.ledgeCd = 30; }
    smashAttack(inp) {
      if (inp.smy < 0) return this.startMove('usmash');
      if (inp.smy > 0) return this.startMove('dsmash');
      if (inp.smx) this.facing = inp.smx;
      this.startMove('fsmash');
    }
    airAttackDir(x, y) {
      if (x === this.facing) return this.startMove('fair');
      if (x === -this.facing) return this.startMove('bair');
      if (y < 0) return this.startMove('uair');
      if (y > 0) return this.startMove('dair');
      this.startMove('nair');
    }
    groundAttack(inp) {
      const T = K.SMASH_TAP;
      const tapX = inp.x && ((inp.x > 0 ? inp.rTap : inp.lTap) <= T);
      if (tapX) { this.facing = inp.x; return this.startMove('fsmash'); }
      if (inp.u && inp.uTap <= T) return this.startMove('usmash');
      if (inp.d && inp.dTap <= T) return this.startMove('dsmash');
      if (inp.x) { this.facing = inp.x; return this.startMove('ftilt'); }
      if (inp.u) return this.startMove('utilt');
      if (inp.d) return this.startMove('dtilt');
      this.startMove('jab');
    }
    airAttack(inp) {
      if (inp.x === this.facing) return this.startMove('fair');
      if (inp.x === -this.facing) return this.startMove('bair');
      if (inp.u) return this.startMove('uair');
      if (inp.d) return this.startMove('dair');
      this.startMove('nair');
    }

    // 被弾。戻り値: 'hit' | 'shield' | null
    takeHit(h, dir, attackerIdx, world) {
      if (this.invuln > 0 || this.dead) return null;
      if (this.state === 'attack' && this.md && this.md.intangible && this.moveT > this.md.startup && this.moveT <= this.md.startup + this.md.active) return null;
      if (this.state === 'shield' && this.grounded) {
        this.shieldHP -= h.dmg * 1.3; this.shieldStun = Math.floor(h.dmg * 0.7) + 4; this.vx = dir * 2.5;
        world.fx.push({ t: 'shieldhit', x: this.x, y: this.y - 20, life: 8 }); SFX.shield();
        return 'shield';
      }
      if (this.state === 'ledge') this.leaveLedge();
      this.percent = Math.min(999, this.percent + h.dmg);
      const p = this.percent, d = h.dmg, w = this.c.weight;
      const kb = ((p / 10 + p * d / 20) * (200 / (w + 100)) * 1.4 + 18) * h.kbg + h.bkb;
      const ang = h.angle * Math.PI / 180;
      let vx = Math.cos(ang) * kb * 0.095 * dir, vy = -Math.sin(ang) * kb * 0.095;
      if (this.grounded && vy > 0) vy = -Math.abs(vy) * 0.6; // 地上で下方向は跳ね上げ
      this.vx = vx; this.vy = vy;
      this.hitstun = Math.floor(kb * 0.42) + 4;
      this.tumble = kb > 42;
      this.state = 'hitstun'; this.stateT = 0; this.move = null; this.md = null;
      this.grounded = false; this.onPlat = null; this.y -= 1; this.fastfall = false; this.helpless = false;
      this.facing = -dir; this.lastHit = attackerIdx; this.kb = kb;
      return 'hit';
    }

    ko(world) {
      if (this.dead) return;
      this.dead = true; this.stocks--; this.respawnT = 70;
      const x = Math.max(K.BLAST.l + 10, Math.min(K.BLAST.r - 10, this.x)), y = Math.max(K.BLAST.t + 10, Math.min(K.BLAST.b - 10, this.y));
      world.fx.push({ t: 'ko', x, y, life: 30, col: this.c.col.body });
      world.shake = 18; world.announce('KO!');
      SFX.ko();
    }
  }
  window.Fighter = Fighter;
})();
