// Settings screen. The Python source's WINDOWED/BORDERLESS/FULLSCREEN
// display-mode carousel and the on-screen-numpad on/off toggle are gone
// (desktop-only, not applicable to a touch phone). Content is grouped into
// three tabs -- General / Operations / Fractions -- since a single flat
// grid ran out of room once fraction-specific controls were added; tabs
// swap which prebuilt widget array is active for hit-testing/rendering
// rather than rebuilding widgets on every switch, so an in-progress numeric
// edit is never silently lost mid-switch (it's committed first instead).
MR.Screens = MR.Screens || {};

MR.Screens.Settings = {
  onEnter(app) {
    const prof = MR.Store.getCurrProfile();
    const s = prof.settings;
    const isEn = MR.I18N.isEn();
    if (!this.activeTab) this.activeTab = "general";

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
    const rowY = (i) => 232 + i * 122;
    const widW = 350, widH = 66;

    const timeOpts = [30, 60, 90, 120, isEn ? "No Limit" : "ללא זמן"];
    const tVal = s.time || 60;
    const currTimeDisp = tVal === 0 ? (isEn ? "No Limit" : "ללא זמן") : tVal;
    let timeIdx = timeOpts.indexOf(currTimeDisp);
    if (timeIdx < 0) timeIdx = 1;

    // General: language/theme/time/visual-mode -- a 2x2 grid (rather than
    // one tall column) so nothing sits uncomfortably far down the screen.
    this.generalWidgets = [
      new MR.UI.SettingCarousel(colCenters[0], rowY(0), widW, widH, "שפה", ["עברית", "English"],
        s.language === "en" ? 1 : 0, (v) => setVal("language")(v === "English" ? "en" : "he")),
      new MR.UI.SettingCarousel(colCenters[2], rowY(0), widW, widH, "ערכת נושא", prof.unlocked_themes,
        Math.max(0, prof.unlocked_themes.indexOf(s.theme || "צבעוני (ילדים)")), setVal("theme")),
      new MR.UI.SettingCarousel(colCenters[0], rowY(1), widW, widH, "זמן משחק", timeOpts, timeIdx, setTime),
      new MR.UI.SettingCarousel(colCenters[2], rowY(1), widW, widH, "מצב ויזואלי (עד 10)", ["מופעל", "כבוי"],
        s.visual_mode ? 0 : 1, (v) => setVal("visual_mode")(v === "מופעל"))
    ];

    // Operations: whole-number exercise config -- toggle, op symbols, bounds.
    this.opsWidgets = [
      new MR.UI.SettingCarousel(colCenters[0], rowY(0), widW, widH, "תצוגה במאונך (רשות)", ["מופעל", "כבוי"],
        s.vertical_math ? 0 : 1, (v) => setVal("vertical_math")(v === "מופעל")),
      new MR.UI.OpsSelector(colCenters[1], rowY(0), widW, widH, "פעולות", s.active_ops, setVal("active_ops")),
      new MR.UI.SettingInput(colCenters[2], rowY(0), 220, widH, "עד תוצאה (חיבור/חיסור)", s.max_num || 20, setVal("max_num")),
      new MR.UI.SettingInput(colCenters[0], rowY(1), 220, widH, "כפל - גורם 1 (עד)", s.mult_f1 || 10, setVal("mult_f1")),
      new MR.UI.SettingInput(colCenters[1], rowY(1), 220, widH, "כפל - גורם 2 (עד)", s.mult_f2 || 10, setVal("mult_f2")),
      new MR.UI.SettingInput(colCenters[2], rowY(1), 220, widH, "חילוק - מחלק (עד)", s.div_f1 || 10, setVal("div_f1")),
      new MR.UI.SettingInput(colCenters[0], rowY(2), 220, widH, "חילוק - מנה (עד)", s.div_f2 || 10, setVal("div_f2"))
    ];

    // Fractions: on/off + its own independent op-symbol selector -- fully
    // decoupled from active_ops, so e.g. regular multiplication and
    // fraction multiplication can be toggled independently of each other.
    this.fractionWidgets = [
      new MR.UI.SettingCarousel(colCenters[1], rowY(0), widW, widH, "תרגילי שברים", ["מופעל", "כבוי"],
        s.fractions_enabled ? 0 : 1, (v) => setVal("fractions_enabled")(v === "מופעל")),
      new MR.UI.OpsSelector(colCenters[1], rowY(1), widW, widH, "פעולות בשברים", s.fraction_ops, setVal("fraction_ops"))
    ];

    const tabW = 320, tabGap = 20, tabY = 110, tabH = 46;
    const totalTabW = tabW * 3 + tabGap * 2;
    const tabStartX = MR.LOGICAL_W / 2 - totalTabW / 2;
    const tabPos = [tabStartX, tabStartX + tabW + tabGap, tabStartX + (tabW + tabGap) * 2];
    const tabDefs = [
      { key: "general", label: "כללי" },
      { key: "operations", label: "פעולות" },
      { key: "fractions", label: "שברים" }
    ];
    const order = isEn ? [0, 1, 2] : [2, 1, 0];
    this.tabs = tabDefs.map((t, i) => ({
      key: t.key, label: t.label,
      rect: { x: tabPos[order.indexOf(i)], y: tabY, w: tabW, h: tabH },
      hover: false
    }));

    this.btnBack = new MR.UI.Button(MR.LOGICAL_W / 2 - 230, 638, 460, 78, "שמור וחזור", { hover: MR.Colors.RED });
    this.numpad = new MR.UI.Numpad(MR.LOGICAL_W / 2, 636, MR.UI.Numpad.withDeleteOkSingleRow(), {
      unit: 88, gap: 12, height: 82, fontSize: 30
    });
  },

  _currentWidgets() {
    if (this.activeTab === "general") return this.generalWidgets;
    if (this.activeTab === "operations") return this.opsWidgets;
    return this.fractionWidgets;
  },

  _activeInput() {
    return this._currentWidgets().find((w) => w instanceof MR.UI.SettingInput && w.active);
  },

  _switchTab(app, key) {
    if (key === this.activeTab) return;
    const active = this._activeInput();
    if (active) active.commit();
    this.activeTab = key;
    MR.Sound.play("click");
  },

  onPointerMove(app, pos) {
    const anyActive = !!this._activeInput();
    if (anyActive) this.numpad.checkHover(pos);
    else this.btnBack.checkHover(pos);
    this.tabs.forEach((t) => { t.hover = MR.DrawUtils.hit(pos, t.rect); });
    this._currentWidgets().forEach((w) => w.checkHover(pos));
  },

  onPointerDown(app, pos) {
    const anyActiveBefore = !!this._activeInput();
    const numpadHit = anyActiveBefore && this.numpad.containsPoint(pos);

    if (anyActiveBefore) this.numpad.onPointerDown(pos);

    if (!numpadHit) {
      for (const t of this.tabs) {
        if (MR.DrawUtils.hit(pos, t.rect)) { this._switchTab(app, t.key); return; }
      }
      this._currentWidgets().forEach((w) => w.onPointerDown(pos));
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

    this.tabs.forEach((t) => {
      const isActive = t.key === this.activeTab;
      const fill = isActive ? theme.highlight : t.hover ? theme.border : theme.panel;
      MR.DrawUtils.panel(ctx, t.rect.x, t.rect.y, t.rect.w, t.rect.h, 14, theme, { fill });
      MR.RTL.draw(ctx, MR.I18N.t(t.label), t.rect.x + t.rect.w / 2, t.rect.y + t.rect.h / 2 + 1, {
        font: `700 24px ${MR.FONT_STACK}`, color: isActive ? MR.Colors.WHITE : theme.text
      });
    });

    this._currentWidgets().forEach((w) => w.draw(ctx));

    if (this._activeInput()) this.numpad.draw(ctx);
    else this.btnBack.draw(ctx);
  }
};
