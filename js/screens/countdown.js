// 3-2-1-Go! pre-round countdown.
//
// Bug fix vs. the Python source: there, the state flips to the actual
// gameplay state (self.state = self.game_mode) in the very same update
// call where the timer first goes <=0, so the "Ready!"/"היכון!" pulse it
// tries to draw next can never actually render -- the state has already
// moved on by the time the draw call for that frame runs, making that
// whole code path dead. This port holds in the COUNTDOWN state for a
// short grace window after hitting zero so "Ready!" actually gets shown.
MR.Screens = MR.Screens || {};

const READY_HOLD = 0.45;

MR.Screens.Countdown = {
  onEnter(app) {
    app.countdownTimer = 2.99;
    this._soundPlayed = false;
  },

  update(app, dt) {
    if (!this._soundPlayed) { MR.Sound.play("countdown"); this._soundPlayed = true; }
    app.countdownTimer -= dt;
    if (app.countdownTimer <= -READY_HOLD) {
      app.goto(app.gameMode);
    }
  },

  onPointerDown() {},
  onPointerUp() {},
  onPointerMove() {},

  render(app, ctx) {
    MR.Screens.Gameplay.renderPlayersAndBar(app, ctx, true);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, MR.LOGICAL_W, MR.LOGICAL_H);
    ctx.restore();

    const t = app.countdownTimer;
    const countVal = Math.ceil(t);
    const ready = countVal <= 0;
    const txt = ready ? MR.I18N.t("היכון!") : String(countVal);
    const col = ready ? MR.Colors.GREEN : MR.Colors.GOLD;

    let frac;
    if (ready) {
      frac = Math.max(0, Math.min(1, (t + READY_HOLD) / READY_HOLD));
    } else {
      frac = t - Math.floor(t);
    }
    const scale = 1.0 + (1.0 - frac) * 0.5;

    ctx.save();
    ctx.globalAlpha = frac;
    ctx.translate(MR.LOGICAL_W / 2, MR.LOGICAL_H / 2);
    ctx.scale(scale, scale);
    MR.RTL.draw(ctx, txt, 0, 0, { font: `800 140px ${MR.FONT_STACK}`, color: col });
    ctx.restore();
  }
};
