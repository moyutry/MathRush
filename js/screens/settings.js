// Settings screen. The Python source's WINDOWED/BORDERLESS/FULLSCREEN
// display-mode carousel and the on-screen-numpad on/off toggle are gone
// (desktop-only, not applicable to a touch phone), and the two-column
// language-mirrored layout becomes a three-column layout -- fits our wide
// landscape canvas better and keeps every row generously spaced.
MR.Screens = MR.Screens || {};

MR.Screens.Settings = {
  onEnter(app) {
    const prof = MR.Store.getCurrProfile();
    const s = prof.settings;
    const isEn = MR.I18N.isEn();

    const setVal = (key) => (val) => {
      MR.Store.getCurrProfile().settings[key] = val;
      if (key === "theme" || key === "language") {
        MR.CanvasScale.syncThemeBg();
        this.onEnter(app);
      }
    };

    const setTime = (val) => {
      const noLimitLabels = ["ללא זמן", "No Limit"];
      MR.Store.getCurrProfile().settings.time = noLimitLabels.includes(val) ? 0 : parseInt(val, 10);
    };

    const colCenters = isEn ? [420, 800, 1180] : [1180, 800, 420];
    const rowY = (i) => 148 + i * 122;
    const widW = 350, widH = 66;

    const timeOpts = [30, 60, 90, 120, isEn ? "No Limit" : "ללא זמן"];
    const tVal = s.time || 60;
    const currTimeDisp = tVal === 0 ? (isEn ? "No Limit" : "ללא זמן") : tVal;
    let timeIdx = timeOpts.indexOf(currTimeDisp);
    if (timeIdx < 0) timeIdx = 1;

    this.carousels = [
      new MR.UI.SettingCarousel(colCenters[0], rowY(0), widW, widH, "שפה", ["עברית", "English"],
        s.language === "en" ? 1 : 0, (v) => setVal("language")(v === "English" ? "en" : "he")),
      new MR.UI.SettingCarousel(colCenters[0], rowY(1), widW, widH, "ערכת נושא", prof.unlocked_themes,
        Math.max(0, prof.unlocked_themes.indexOf(s.theme || "צבעוני (ילדים)")), setVal("theme")),
      new MR.UI.SettingCarousel(colCenters[0], rowY(2), widW, widH, "זמן משחק", timeOpts, timeIdx, setTime),
      new MR.UI.SettingCarousel(colCenters[0], rowY(3), widW, widH, "תצוגה במאונך (רשות)", ["מופעל", "כבוי"],
        s.vertical_math ? 0 : 1, (v) => setVal("vertical_math")(v === "מופעל")),
      new MR.UI.SettingCarousel(colCenters[1], rowY(0), widW, widH, "מצב ויזואלי (עד 10)", ["מופעל", "כבוי"],
        s.visual_mode ? 0 : 1, (v) => setVal("visual_mode")(v === "מופעל"))
    ];

    this.opsSelector = new MR.UI.OpsSelector(colCenters[1], rowY(1), widW, widH, "פעולות", s.active_ops, setVal("active_ops"));

    this.inputs = [
      new MR.UI.SettingInput(colCenters[1], rowY(2), 220, widH, "עד תוצאה (חיבור/חיסור)", s.max_num || 20, setVal("max_num")),
      new MR.UI.SettingInput(colCenters[1], rowY(3), 220, widH, "כפל - גורם 1 (עד)", s.mult_f1 || 10, setVal("mult_f1")),
      new MR.UI.SettingInput(colCenters[2], rowY(0), 220, widH, "כפל - גורם 2 (עד)", s.mult_f2 || 10, setVal("mult_f2")),
      new MR.UI.SettingInput(colCenters[2], rowY(1), 220, widH, "חילוק - מחלק (עד)", s.div_f1 || 10, setVal("div_f1")),
      new MR.UI.SettingInput(colCenters[2], rowY(2), 220, widH, "חילוק - מנה (עד)", s.div_f2 || 10, setVal("div_f2"))
    ];

    this.btnBack = new MR.UI.Button(MR.LOGICAL_W / 2 - 230, 638, 460, 78, "שמור וחזור", { hover: MR.Colors.RED });
    this.numpad = new MR.UI.Numpad(MR.LOGICAL_W / 2, 636, MR.UI.Numpad.withDeleteOkSingleRow(), {
      unit: 88, gap: 12, height: 82, fontSize: 30
    });
  },

  _activeInput() {
    return this.inputs.find((i) => i.active);
  },

  onPointerMove(app, pos) {
    const anyActive = !!this._activeInput();
    if (anyActive) this.numpad.checkHover(pos);
    else this.btnBack.checkHover(pos);
    this.carousels.forEach((c) => c.checkHover(pos));
    this.inputs.forEach((i) => i.checkHover(pos));
  },

  onPointerDown(app, pos) {
    const anyActiveBefore = !!this._activeInput();
    const numpadHit = anyActiveBefore && this.numpad.containsPoint(pos);

    if (anyActiveBefore) this.numpad.onPointerDown(pos);

    if (!numpadHit) {
      this.carousels.forEach((c) => c.onPointerDown(pos));
      this.inputs.forEach((i) => i.onPointerDown(pos));
      this.opsSelector.onPointerDown(pos);
      if (!this._activeInput()) this.btnBack.onPointerDown(pos);
    }
  },

  onPointerUp(app, pos) {
    const active = this._activeInput();
    if (active) {
      const key = this.numpad.onPointerUp(pos);
      if (key === "ok") active.handleEnter();
      else if (key === "del") active.handleBackspace();
      else if (key) active.handleDigit(key);
      return;
    }
    if (this.btnBack.onPointerUp(pos)) {
      MR.Store.save();
      app.goto("MENU");
    }
  },

  onKeyDown(app, e) {
    const active = this._activeInput();
    if (!active) return;
    if (e.key >= "0" && e.key <= "9") active.handleDigit(e.key);
    else if (e.key === "Backspace") active.handleBackspace();
    else if (e.key === "Enter") active.handleEnter();
  },

  render(app, ctx) {
    const theme = MR.Store.getCurrTheme();
    MR.RTL.draw(ctx, MR.I18N.t("הגדרות המשחק"), MR.LOGICAL_W / 2, 58, {
      font: `700 40px ${MR.FONT_STACK}`, color: theme.text
    });

    this.carousels.forEach((c) => c.draw(ctx));
    this.inputs.forEach((i) => i.draw(ctx));
    this.opsSelector.draw(ctx);

    if (this._activeInput()) this.numpad.draw(ctx);
    else this.btnBack.draw(ctx);
  }
};
