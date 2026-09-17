// CPU。数フレームに一度だけ考えて、あとはその入力を保つ。
(function () {
  const K = window.K;
  class AI {
    constructor(me, level = 2) { this.me = me; this.level = level; this.v = {}; this.timer = 0; this.plan = null; }
    think(world) {
      const me = this.me, op = world.fighters.find((f) => f !== me);
      const v = { l: 0, r: 0, u: 0, d: 0, a: 0, b: 0, sh: 0, j: 0 };
      if (me.dead || !op) { this.v = v; return v; }
      // 崖につかまったら少し待って上がる
      if (me.state === 'ledge') { if (me.ledgeT > 16) { if (Math.random() < 0.3) v.aP = 1, v.a = 1; else v.u = 1; } this.v = v; return v; }
      const dx = op.x - me.x, dy = op.y - me.y, adx = Math.abs(dx);
      const F = K.STAGE.floor;
      const offstage = me.x < F.x - 10 || me.x > F.x + F.w + 10;
      const react = [14, 9, 5][this.level - 1];

      // 復帰は毎フレーム判断する
      if (offstage || (me.y > F.y + 20 && !me.grounded)) {
        const cx = F.x + F.w / 2;
        if (me.x < cx) v.r = 1; else v.l = 1;
        if (!me.grounded && me.vy > 0) {
          if (me.jumpsLeft > 0 && me.y > F.y - 80) v.j = 1;
          else if (me.jumpsLeft === 0 && me.state !== 'helpless' && me.state !== 'attack' && me.y > F.y - 60) { v.u = 1; v.b = 1; }
        }
        this.v = v; return v;
      }

      if (--this.timer > 0) {
        const keep = { ...this.v, a: 0, b: 0, j: 0 };
        // 押しっぱなしにしない
        if (this.plan === 'shield' && me.state === 'shield' && this.timer < 4) keep.sh = 0;
        this.v = keep; return keep;
      }
      this.timer = react + Math.floor(Math.random() * react);
      const r = Math.random();
      const range = me.c.weapon === 'sword' ? 52 : 40;
      const opAttacking = op.state === 'attack' && op.moveT <= (op.md ? op.md.startup + 2 : 0);

      if (!me.grounded) {
        // 空中: 相手が近ければ空中攻撃、遠ければ寄る
        if (dx > 0) v.r = 1; else v.l = 1;
        if (adx < 60 && Math.abs(dy) < 60 && r < 0.7) { v.a = 1; if (dy < -20) { v.u = 1; v.l = v.r = 0; } else if (dy > 30) { v.d = 1; v.l = v.r = 0; } }
        else if (dy > 40 && r < 0.3) v.d = 1;
        this.plan = 'air'; this.v = v; return v;
      }

      if (opAttacking && adx < range + 30 && r < 0.35 + this.level * 0.15) { v.sh = 1; this.plan = 'shield'; this.timer = 14; this.v = v; return v; }

      if (adx > range + 20) {
        if (adx > 150 && r < 0.25) { v.b = 1; if (dx > 0) me.facing = 1; else me.facing = -1; this.plan = 'proj'; }
        else { if (dx > 0) v.r = 1; else v.l = 1; if (dy < -70 && r < 0.5) v.j = 1; this.plan = 'approach'; }
        this.v = v; return v;
      }

      // 近い: 攻撃を選ぶ
      this.plan = 'attack';
      if (dy < -50) { v.a = 1; v.u = 1; this.timer += 8; this.v = v; return v; }
      const pick = r;
      if (pick < 0.30) { v.a = 1; }
      else if (pick < 0.55) { v.a = 1; if (dx > 0) v.r = 1; else v.l = 1; }
      else if (pick < 0.72) { v.sm = 1; if (dx > 0) v.r = 1; else v.l = 1; }
      else if (pick < 0.82) { v.a = 1; v.d = 1; }
      else if (pick < 0.90) { v.j = 1; }
      else { if (dx > 0) v.l = 1; else v.r = 1; }
      this.v = v; return v;
    }
  }
  window.AI = AI;
})();
