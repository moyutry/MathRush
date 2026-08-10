// Main menu. Buttons are laid out as a 2x3 grid (rather than the Python
// source's single tall column of 6) -- a wide landscape phone has width to
// spare but limited height, so a grid keeps every button comfortably
// touch-sized without the column running off the bottom of the screen.
MR.Screens = MR.Screens || {};

MR.Screens.Menu = {
  onEnter(app) {
    const cx = MR.LOGICAL_W / 2;
    const btnW = 460, btnH = 108, colGap = 24, rowGap = 22;
    const gridW = btnW * 2 + colGap;
    const gridTop = 206;
    const left = cx - gridW / 2;
    const col0 = left, col1 = left + btnW + colGap;

    const rowY = (r) => gridTop + r * (btnH + rowGap);

    this.btnSingle   = new MR.UI.Button(col0, rowY(0), btnW, btnH, "שחקן יחיד", { hover: MR.Colors.BLUE });
    this.btnVersus   = new MR.UI.Button(col1, rowY(0), btnW, btnH, "ראש בראש", { hover: MR.Colors.RED });
    this.btnBp       = new MR.UI.Button(col0, rowY(1), btnW, btnH, "תארים", { hover: MR.Colors.GOLD });
    this.btnStats    = new MR.UI.Button(col1, rowY(1), btnW, btnH, "איזור אישי", { hover: MR.Colors.GREEN });
    this.btnSettings = new MR.UI.Button(col0, rowY(2), btnW, btnH, "הגדרות", { hover: MR.Colors.LIGHT_GRAY });
    this.btnSwitch   = new MR.UI.Button(col1, rowY(2), btnW, btnH, "החלף שחקן", { hover: MR.Colors.PURPLE });

    this.buttons = [this.btnSingle, this.btnVersus, this.btnBp, this.btnStats, this.btnSettings, this.btnSwitch];
  },

  onPointerMove(app, pos) { this.buttons.forEach((b) => b.checkHover(pos)); },
  onPointerDown(app, pos) { this.buttons.forEach((b) => b.onPointerDown(pos)); },

  onPointerUp(app, pos) {
    if (this.btnSingle.onPointerUp(pos)) { app.startGame("SINGLE"); return; }
    if (this.btnVersus.onPointerUp(pos)) { app.goto("VS_SETUP"); return; }
    if (this.btnBp.onPointerUp(pos)) { app.goto("BATTLEPASS"); return; }
    if (this.btnStats.onPointerUp(pos)) { app.goto("STATS"); return; }
    if (this.btnSettings.onPointerUp(pos)) { app.goto("SETTINGS"); return; }
    if (this.btnSwitch.onPointerUp(pos)) { app.goto("PROFILES"); return; }
  },

  render(app, ctx) {
    const theme = MR.Store.getCurrTheme();
    const prof = MR.Store.getCurrProfile();
    const cx = MR.LOGICAL_W / 2;

    MR.RTL.drawGradientHeadline(ctx, "MATH RUSH", cx, 54, {
      font: `800 62px ${MR.FONT_STACK}`, color: theme.highlight, gradient: theme.titleGrad
    });

    const userStr = MR.I18N.isEn() ? `Hello, ${MR.Store.currentUser}` : `שלום, ${MR.Store.currentUser}`;
    const titleStr = MR.I18N.isEn()
      ? `Title: ${MR.I18N.t(prof.title)}`
      : `תואר: ${prof.title}`;
    MR.RTL.draw(ctx, userStr, cx, 100, { font: `700 30px ${MR.FONT_STACK}`, color: theme.text });
    MR.RTL.draw(ctx, titleStr, cx, 130, { font: `700 22px ${MR.FONT_STACK}`, color: MR.Colors.PURPLE });

    this.buttons.forEach((b) => b.draw(ctx));

    const comboStr = MR.I18N.isEn()
      ? `High Score: ${prof.high_score_single}   ·   Streak: ${prof.streak || 0}`
      : `שיא אישי: ${prof.high_score_single}   ·   רצף: ${prof.streak || 0}`;
    MR.RTL.draw(ctx, comboStr, cx, 646, { font: `700 22px ${MR.FONT_STACK}`, color: MR.Colors.LIGHT_GRAY });

    this._drawProgressBar(ctx, theme, prof, cx);
  },

  _drawProgressBar(ctx, theme, prof, cx) {
    const xp = prof.xp, needed = prof.level * 1000;
    const barW = 620, barH = 30, x = cx - barW / 2, y = 674;
    MR.DrawUtils.panel(ctx, x, y, barW, barH, 15, theme);
    let fillW = needed > 0 ? Math.round((xp / needed) * barW) : barW;
    if (prof.level >= 10) fillW = barW;
    if (fillW > 4) {
      const grad = MR.DrawUtils.linearGradient(ctx, x + 2, y + 2, fillW - 4, 0,
        [MR.DrawUtils.shade(theme.highlight, 0.22), theme.highlight], false);
      MR.DrawUtils.fillRoundRect(ctx, x + 2, y + 2, fillW - 4, barH - 4, 12, grad);
    }

    const lvlStr = prof.level >= 10
      ? MR.I18N.t("רמה מקסימלית!")
      : `${MR.I18N.t("רמה ")}${prof.level} | ${xp}/${needed} XP`;
    MR.RTL.draw(ctx, lvlStr, cx, y + barH / 2 + 1, {
      font: `700 20px ${MR.FONT_STACK}`, color: theme.text
    });
  }
};
