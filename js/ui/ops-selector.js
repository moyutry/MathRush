// 4 toggle tiles for + - x / (multi-select, must keep at least one active).
MR.UI.OpsSelector = class OpsSelector {
  constructor(cx, y, w, h, labelKey, activeOps, onChange) {
    this.labelKey = labelKey;
    this.ops = ["+", "-", "*", "/"];
    this.displayOps = ["+", "−", "×", "÷"];
    this.activeOps = activeOps;
    this.onChange = onChange;
    this.rects = [];
    const bw = (w - 30) / 4;
    const startX = cx - w / 2;
    for (let i = 0; i < 4; i++) this.rects.push({ x: startX + i * (bw + 10), y, w: bw, h });
  }

  onPointerDown(pos) {
    for (let i = 0; i < 4; i++) {
      if (MR.DrawUtils.hit(pos, this.rects[i])) {
        const op = this.ops[i];
        const idx = this.activeOps.indexOf(op);
        if (idx >= 0) {
          if (this.activeOps.length > 1) {
            this.activeOps.splice(idx, 1);
            MR.Sound.play("click");
          }
        } else {
          this.activeOps.push(op);
          MR.Sound.play("click");
        }
        this.onChange(this.activeOps);
        return true;
      }
    }
    return false;
  }

  draw(ctx) {
    const theme = MR.Store.getCurrTheme();
    for (let i = 0; i < 4; i++) {
      const rect = this.rects[i];
      const op = this.ops[i];
      const isActive = this.activeOps.includes(op);
      const fill = isActive ? MR.Colors.GREEN : theme.panel;
      MR.DrawUtils.panel(ctx, rect.x, rect.y, rect.w, rect.h, 14, theme, { fill });
      MR.RTL.draw(ctx, this.displayOps[i], rect.x + rect.w / 2, rect.y + rect.h / 2 + 2, {
        font: `700 42px ${MR.FONT_STACK}`,
        color: isActive ? MR.Colors.WHITE : theme.text
      });
    }
    const totalW = this.rects[3].x + this.rects[3].w - this.rects[0].x;
    const cx = this.rects[0].x + totalW / 2;
    MR.RTL.draw(ctx, MR.I18N.t(this.labelKey), cx, this.rects[0].y - 24, {
      font: `700 24px ${MR.FONT_STACK}`, color: theme.text
    });
  }
};
