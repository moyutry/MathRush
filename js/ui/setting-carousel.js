// "< value >" cycling selector used in Settings (language, theme, time, ...).
MR.UI.SettingCarousel = class SettingCarousel {
  constructor(cx, y, w, h, labelKey, options, currentIdx, onChange) {
    this.labelKey = labelKey;
    this.options = options;
    this.idx = currentIdx;
    this.onChange = onChange;
    this.box = { x: cx - w / 2, y, w, h };
    const arrowW = Math.min(72, w / 3);
    this.btnLeft = { x: this.box.x, y, w: arrowW, h };
    this.btnRight = { x: this.box.x + w - arrowW, y, w: arrowW, h };
    this.hoverL = false;
    this.hoverR = false;
  }

  checkHover(pos) {
    this.hoverL = MR.DrawUtils.hit(pos, this.btnLeft);
    this.hoverR = MR.DrawUtils.hit(pos, this.btnRight);
  }

  onPointerDown(pos) {
    if (MR.DrawUtils.hit(pos, this.btnLeft)) {
      this.idx = (this.idx - 1 + this.options.length) % this.options.length;
      MR.Sound.play("click");
      this.onChange(this.options[this.idx]);
      return true;
    }
    if (MR.DrawUtils.hit(pos, this.btnRight)) {
      this.idx = (this.idx + 1) % this.options.length;
      MR.Sound.play("click");
      this.onChange(this.options[this.idx]);
      return true;
    }
    return false;
  }

  draw(ctx) {
    const theme = MR.Store.getCurrTheme();
    const { x, y, w, h } = this.box;
    MR.DrawUtils.panel(ctx, x, y, w, h, 16, theme);

    const val = this.options[this.idx];
    const valText = MR.I18N.t(String(val));
    MR.RTL.draw(ctx, valText, x + w / 2, y + h / 2 + 1, {
      font: `700 28px ${MR.FONT_STACK}`, color: theme.text
    });

    const colL = this.hoverL ? theme.highlight : theme.border;
    const colR = this.hoverR ? theme.highlight : theme.border;
    MR.RTL.draw(ctx, "‹", this.btnLeft.x + this.btnLeft.w / 2, y + h / 2, {
      font: `700 40px ${MR.FONT_STACK}`, color: colL, align: "center"
    });
    MR.RTL.draw(ctx, "›", this.btnRight.x + this.btnRight.w / 2, y + h / 2, {
      font: `700 40px ${MR.FONT_STACK}`, color: colR, align: "center"
    });

    MR.RTL.draw(ctx, MR.I18N.t(this.labelKey), x + w / 2, y - 24, {
      font: `700 24px ${MR.FONT_STACK}`, color: theme.text
    });
  }
};
