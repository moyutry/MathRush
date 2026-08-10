// Studio splash screen shown once on launch.
MR.Screens = MR.Screens || {};

MR.Screens.Intro = {
  onEnter(app) { app.introTimer = 0; },

  update(app, dt) {
    app.introTimer += dt;
    if (app.introTimer > 3) app.goto("PROFILES");
  },

  render(app, ctx) {
    const theme = MR.Store.getCurrTheme();
    const alpha = Math.min(1, app.introTimer / 1.8);
    ctx.save();
    ctx.globalAlpha = alpha;
    MR.RTL.drawGradientHeadline(ctx, "AMITAY GAMES PRESENTS", MR.LOGICAL_W / 2, MR.LOGICAL_H / 2, {
      font: `800 54px ${MR.FONT_STACK}`, color: theme.highlight, gradient: theme.titleGrad
    });
    ctx.restore();
  },

  onPointerDown(app) { app.goto("PROFILES"); },
  onPointerUp() {},
  onPointerMove() {},
  onKeyDown(app) { app.goto("PROFILES"); }
};
