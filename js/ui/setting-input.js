// Numeric settings field. Entry happens via the shared on-screen numpad
// (js/ui/numpad.js, driven by the Settings screen) or a physical keyboard
// if one happens to be connected -- both paths funnel through the
// handleDigit/handleBackspace/handleEnter methods below.
MR.UI.SettingInput = class SettingInput {
  constructor(cx, y, w, h, labelKey, currentVal, onChange, maxLen) {
    this.rect = { x: cx - w / 2, y, w, h };
    this.labelKey = labelKey;
    this.valStr = String(currentVal);
    this.onChange = onChange;
    this.maxLen = maxLen || 4;
    this.active = false;
    this.hovered = false;
  }

  checkHover(pos) {
    this.hovered = MR.DrawUtils.hit(pos, this.rect);
  }

  commit() {
    this.active = false;
    if (!this.valStr || parseInt(this.valStr, 10) < 2) this.valStr = "2";
    this.onChange(parseInt(this.valStr, 10));
  }

  // Returns true if the tap was consumed by this field (opened or closed it).
  onPointerDown(pos) {
    const inside = MR.DrawUtils.hit(pos, this.rect);
    if (inside && !this.active) {
      this.active = true;
      MR.Sound.play("click");
      return true;
    }
    if (!inside && this.active) {
      this.commit();
      return false;
    }
    return false;
  }

  handleDigit(d) {
    if (this.valStr.length < this.maxLen) this.valStr += d;
  }

  handleBackspace() {
    this.valStr = this.valStr.slice(0, -1);
  }

  handleEnter() {
    this.commit();
  }

  draw(ctx) {
    const theme = MR.Store.getCurrTheme();
    const { x, y, w, h } = this.rect;
    const fill = this.active ? theme.highlight : this.hovered ? theme.border : theme.panel;
    MR.DrawUtils.panel(ctx, x, y, w, h, 14, theme, { fill });

    const txt = this.valStr + (this.active ? "_" : "");
    MR.RTL.draw(ctx, txt, x + w / 2, y + h / 2 + 1, {
      font: `700 28px ${MR.FONT_STACK}`,
      color: this.active ? MR.Colors.WHITE : theme.text
    });

    MR.RTL.draw(ctx, MR.I18N.t(this.labelKey), x + w / 2, y - 24, {
      font: `700 22px ${MR.FONT_STACK}`, color: theme.text
    });
  }
};
