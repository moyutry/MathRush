// Name entry (new profile / rename) via the on-screen virtual keyboard
// (always shown -- there is no physical keyboard on a phone) with a
// physical-keyboard passthrough for desktop testing convenience.
//
// The cursor placement hack from the Python source (prepend "_" instead of
// appending, only for Hebrew strings) is unnecessary here: Canvas2D's real
// bidi implementation places a trailing "_" on the correct (leading) edge
// automatically once ctx.direction is set, for both Hebrew and English.
MR.Screens = MR.Screens || {};

MR.Screens.TextInput = {
  onEnter(app) {
    const kbW = 1380, kbH = 320;
    this.keyboard = new MR.UI.VirtualKeyboard(MR.LOGICAL_W / 2 - kbW / 2, MR.LOGICAL_H - kbH - 34, kbW, kbH);
    this._hoverPos = { x: -1, y: -1 };
  },

  onPointerMove(app, pos) { this._hoverPos = pos; },
  onPointerUp() {},

  onPointerDown(app, pos) {
    const result = this.keyboard.onPointerDown(pos);
    if (result === undefined) return;
    this._applyKeyResult(app, result);
  },

  _applyKeyResult(app, result) {
    if (result === "BACKSPACE") app.currentInputText = app.currentInputText.slice(0, -1);
    else if (result === "ENTER") this._commit(app);
    else if (result !== null && app.currentInputText.length < 12) app.currentInputText += result;
  },

  onKeyDown(app, e) {
    if (e.key === "Enter") { this._commit(app); return; }
    if (e.key === "Escape") { app.goto("PROFILES"); return; }
    if (e.key === "Backspace") { app.currentInputText = app.currentInputText.slice(0, -1); return; }
    if (e.key.length === 1 && app.currentInputText.length < 12) app.currentInputText += e.key;
  },

  _commit(app) {
    const name = app.currentInputText.trim();
    if (!name) return;
    if (app.textInputMode === "NEW_PROFILE") {
      if (!MR.Store.saveData.profiles[name]) MR.Store.saveData.profiles[name] = MR.Defaults.getDefaultProfile();
      MR.Store.setCurrentUser(name);
    } else if (app.textInputMode === "RENAME") {
      if (name !== app.profileToEdit && !MR.Store.saveData.profiles[name]) {
        MR.Store.saveData.profiles[name] = MR.Store.saveData.profiles[app.profileToEdit];
        delete MR.Store.saveData.profiles[app.profileToEdit];
        if (MR.Store.currentUser === app.profileToEdit) MR.Store.setCurrentUser(name);
      }
    }
    MR.Store.save();
    app.goto("MENU");
  },

  render(app, ctx) {
    const theme = MR.Store.getCurrTheme();
    const cx = MR.LOGICAL_W / 2;
    const txtKey = app.textInputMode === "NEW_PROFILE" ? "הכנס שם חדש (ולחץ Enter)" : "שנה שם (ולחץ Enter)";
    MR.RTL.draw(ctx, MR.I18N.t(txtKey), cx, 66, { font: `700 36px ${MR.FONT_STACK}`, color: theme.highlight });

    MR.RTL.draw(ctx, app.currentInputText + "_", cx, 190, {
      font: `800 74px ${MR.FONT_STACK}`, color: theme.text
    });

    this.keyboard.draw(ctx, this._hoverPos);
  }
};
