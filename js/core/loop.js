// requestAnimationFrame loop with a clamped delta-time.
MR.Loop = {
  lastTime: 0,
  running: false,

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._tick(t));
  },

  _tick(now) {
    if (!this.running) return;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (!isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.05); // avoid huge steps after a backgrounded tab

    if (MR.GameApp) MR.GameApp.update(dt);

    const ctx = MR.CanvasScale.ctx;
    ctx.save();
    ctx.clearRect(0, 0, MR.LOGICAL_W, MR.LOGICAL_H);
    if (MR.GameApp) MR.GameApp.render(ctx);
    ctx.restore();

    requestAnimationFrame((t) => this._tick(t));
  }
};
