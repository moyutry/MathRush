// Versus opponent picker: any other local profile, or a transient Guest.
MR.Screens = MR.Screens || {};

MR.Screens.VsSetup = {
  onEnter(app) {
    const names = Object.keys(MR.Store.saveData.profiles).filter((n) => n !== MR.Store.currentUser && n !== "אורח" && n !== "Guest");
    const items = [...names, "אורח"];
    const cx = MR.LOGICAL_W / 2;
    const top = 156, maxBottom = 692;
    const btnW = 560, gap = 16, backH = 74, backGap = 18;
    const n = items.length;
    const available = maxBottom - top - backH - backGap;
    const step = Math.max(56, Math.min(90, (available - (n - 1) * gap) / n) + gap);
    const btnH = Math.min(74, step - gap);

    this.buttons = items.map((name, i) => {
      const label = name === "אורח" ? "אורח" : name;
      const b = new MR.UI.Button(cx - btnW / 2, top + i * step, btnW, btnH, label, { hover: MR.Colors.RED });
      b.rawName = name;
      return b;
    });

    const backY = top + n * step + (n > 0 ? backGap - gap : 0);
    this.btnBack = new MR.UI.Button(cx - btnW / 2, Math.min(backY, maxBottom - backH), btnW, backH, "חזור", { hover: MR.Colors.PURPLE });
  },

  onPointerMove(app, pos) {
    this.buttons.forEach((b) => b.checkHover(pos));
    this.btnBack.checkHover(pos);
  },
  onPointerDown(app, pos) {
    this.buttons.forEach((b) => b.onPointerDown(pos));
    this.btnBack.onPointerDown(pos);
  },
  onPointerUp(app, pos) {
    for (const b of this.buttons) {
      if (b.onPointerUp(pos)) {
        app.p2Name = b.rawName;
        app.startGame("VERSUS");
        return;
      }
    }
    if (this.btnBack.onPointerUp(pos)) app.goto("MENU");
  },

  render(app, ctx) {
    const theme = MR.Store.getCurrTheme();
    MR.RTL.drawGradientHeadline(ctx, MR.I18N.t("בחר את שחקן 2"), MR.LOGICAL_W / 2, 74, {
      font: `700 42px ${MR.FONT_STACK}`, color: theme.highlight, gradient: theme.titleGrad
    });
    this.buttons.forEach((b) => b.draw(ctx));
    this.btnBack.draw(ctx);
  }
};
