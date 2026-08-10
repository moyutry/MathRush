// "Titles & Rewards" level roadmap. Tap anywhere to return to the menu.
MR.Screens = MR.Screens || {};

MR.Screens.Battlepass = {
  onPointerDown(app) { app.goto("MENU"); },
  onPointerUp() {},
  onPointerMove() {},
  update() {},

  render(app, ctx) {
    const theme = MR.Store.getCurrTheme();
    const cx = MR.LOGICAL_W / 2;
    MR.RTL.drawGradientHeadline(ctx, MR.I18N.t("תארים ופרסים"), cx, 48, {
      font: `800 42px ${MR.FONT_STACK}`, color: theme.highlight, gradient: theme.titleGrad
    });

    const prof = MR.Store.getCurrProfile();
    const myLvl = prof.level;
    const isEn = MR.I18N.isEn();
    const top = 116, step = 56;

    for (let lvl = 1; lvl <= 10; lvl++) {
      const y = top + (lvl - 1) * step;
      const unlocked = myLvl >= lvl;
      const color = unlocked ? MR.Colors.GREEN : MR.Colors.GRAY;

      ctx.save();
      if (unlocked) { ctx.shadowColor = MR.Colors.GREEN; ctx.shadowBlur = 14; }
      const beadGrad = ctx.createRadialGradient(cx - 6, y - 7, 2, cx, y, 22);
      beadGrad.addColorStop(0, MR.DrawUtils.shade(color, 0.3));
      beadGrad.addColorStop(1, MR.DrawUtils.shade(color, -0.15));
      ctx.beginPath();
      ctx.fillStyle = beadGrad;
      ctx.arc(cx, y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (lvl < 10) {
        ctx.strokeStyle = MR.Colors.GRAY;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, y + 20);
        ctx.lineTo(cx, y + step - 20);
        ctx.stroke();
      }

      MR.RTL.draw(ctx, String(lvl), cx, y + 1, {
        font: `700 22px ${MR.FONT_STACK}`, color: unlocked ? MR.Colors.BLACK : MR.Colors.LIGHT_GRAY
      });

      const tier = MR.Battlepass.TIERS[lvl];
      const msg = tier ? tier.msg : "תיבת הפתעה";
      const descX = isEn ? cx - 46 : cx + 46;
      const align = isEn ? "right" : "left";
      MR.RTL.draw(ctx, MR.I18N.t(msg), descX, y + 1, {
        font: `700 24px ${MR.FONT_STACK}`, color: unlocked ? theme.text : MR.Colors.GRAY, align
      });
    }

    MR.RTL.draw(ctx, MR.I18N.t("לחץ על המסך כדי לחזור"), cx, 700, {
      font: `700 20px ${MR.FONT_STACK}`, color: MR.Colors.LIGHT_GRAY
    });
  }
};
