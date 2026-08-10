// Round-results screen. Tap anywhere to return to the menu.
MR.Screens = MR.Screens || {};

MR.Screens.Over = {
  onPointerDown(app) { app.goto("MENU"); },
  onPointerUp() {},
  onPointerMove() {},
  update() {},

  render(app, ctx) {
    const theme = MR.Store.getCurrTheme();
    const cx = MR.LOGICAL_W / 2;

    MR.RTL.drawGradientHeadline(ctx, MR.I18N.t("הזמן נגמר!"), cx, 110, {
      font: `800 62px ${MR.FONT_STACK}`, color: MR.Colors.RED,
      gradient: ["#ffcf4d", "#ff7a3d", "#ff3d5c"]
    });

    if (app.players.length === 1) {
      const p1 = app.players[0];
      const sTxt = MR.I18N.isEn() ? `You solved ${p1.score} problems!` : `פתרת ${p1.score} תרגילים!`;
      MR.RTL.draw(ctx, sTxt, cx, 280, { font: `700 40px ${MR.FONT_STACK}`, color: theme.text });
    } else {
      const p1 = app.players[0], p2 = app.players[1];
      let wStr;
      if (p1.score === p2.score) {
        wStr = MR.I18N.t("תיקו!");
      } else {
        const winner = p1.score > p2.score ? p1 : p2;
        wStr = MR.I18N.isEn() ? `${winner.profileName} Won!` : `${winner.profileName} ניצח!`;
      }
      MR.RTL.draw(ctx, wStr, cx, 220, { font: `700 46px ${MR.FONT_STACK}`, color: MR.Colors.GOLD });
      MR.RTL.draw(ctx, `${p1.profileName}: ${p1.score}`, cx, 296, { font: `700 30px ${MR.FONT_STACK}`, color: p1.baseColor });
      MR.RTL.draw(ctx, `${p2.profileName}: ${p2.score}`, cx, 340, { font: `700 30px ${MR.FONT_STACK}`, color: p2.baseColor });
    }

    if (app.endMsg) {
      MR.RTL.draw(ctx, app.endMsg, cx, 470, { font: `700 28px ${MR.FONT_STACK}`, color: theme.highlight });
    }

    MR.RTL.draw(ctx, MR.I18N.t("לחץ על המסך כדי לחזור לתפריט"), cx, 660, {
      font: `700 22px ${MR.FONT_STACK}`, color: MR.Colors.LIGHT_GRAY
    });
  }
};
