// Profile picker: select / rename / delete a local player profile, or
// create a new one. Row height adapts to the profile count so the list
// never needs to scroll, down to a floor of 48px for the (unlikely) case
// of many profiles.
MR.Screens = MR.Screens || {};

MR.Screens.Profiles = {
  onEnter(app) {
    const names = Object.keys(MR.Store.saveData.profiles);
    const cx = MR.LOGICAL_W / 2;
    const top = 150, maxBottom = 706;
    const newBtnH = 66, newBtnGap = 16;
    const rowGap = 14;
    const n = Math.max(names.length, 1);
    const availableForRows = maxBottom - top - newBtnH - newBtnGap;
    const rowH = Math.max(48, Math.min(92, (availableForRows - (n - 1) * rowGap) / n));

    const rowW = 1200, gap = 16, sideW = 168;
    const nameW = rowW - sideW * 2 - gap * 2;
    const left = cx - rowW / 2;

    this.rows = [];
    let y = top;
    names.forEach((name) => {
      const displayName = name === "אורח" ? "אורח" : name;
      const fs = Math.min(30, rowH * 0.42);
      const nameBtn = new MR.UI.Button(left, y, nameW, rowH, displayName, { hover: MR.Colors.BLUE, fontSize: fs });
      const editBtn = new MR.UI.Button(left + nameW + gap, y, sideW, rowH, "ערוך", { hover: MR.Colors.GOLD, fontSize: fs * 0.86 });
      const delBtn = new MR.UI.Button(left + nameW + gap * 2 + sideW, y, sideW, rowH, "מחק", { hover: MR.Colors.RED, fontSize: fs * 0.86 });
      this.rows.push({ name, nameBtn, editBtn, delBtn });
      y += rowH + rowGap;
    });

    this.btnNew = new MR.UI.Button(left, y, rowW, newBtnH, "+ משתמש חדש", { hover: MR.Colors.GREEN });
  },

  onPointerMove(app, pos) {
    this.rows.forEach((r) => { r.nameBtn.checkHover(pos); r.editBtn.checkHover(pos); r.delBtn.checkHover(pos); });
    this.btnNew.checkHover(pos);
  },

  onPointerDown(app, pos) {
    this.rows.forEach((r) => { r.nameBtn.onPointerDown(pos); r.editBtn.onPointerDown(pos); r.delBtn.onPointerDown(pos); });
    this.btnNew.onPointerDown(pos);
  },

  onPointerUp(app, pos) {
    for (const r of this.rows) {
      if (r.nameBtn.onPointerUp(pos)) {
        MR.Store.setCurrentUser(r.name);
        MR.Store.save();
        MR.CanvasScale.syncThemeBg();
        app.goto("MENU");
        return;
      }
      if (r.editBtn.onPointerUp(pos)) {
        app.profileToEdit = r.name;
        app.currentInputText = r.name;
        app.textInputMode = "RENAME";
        app.goto("TEXT_INPUT");
        return;
      }
      if (r.delBtn.onPointerUp(pos)) {
        if (Object.keys(MR.Store.saveData.profiles).length > 1) {
          app.profileToDelete = r.name;
          app.goto("CONFIRM_DELETE");
        }
        return;
      }
    }
    if (this.btnNew.onPointerUp(pos)) {
      app.currentInputText = "";
      app.textInputMode = "NEW_PROFILE";
      app.goto("TEXT_INPUT");
    }
  },

  render(app, ctx) {
    const theme = MR.Store.getCurrTheme();
    MR.RTL.drawGradientHeadline(ctx, MR.I18N.t("מי משחק עכשיו?"), MR.LOGICAL_W / 2, 68, {
      font: `700 42px ${MR.FONT_STACK}`, color: theme.highlight, gradient: theme.titleGrad
    });
    const onlyOne = Object.keys(MR.Store.saveData.profiles).length <= 1;
    this.rows.forEach((r) => {
      r.nameBtn.draw(ctx);
      r.editBtn.draw(ctx);
      r.delBtn.enabled = !onlyOne;
      r.delBtn.draw(ctx);
    });
    this.btnNew.draw(ctx);
  }
};
