// Full Hebrew+English on-screen keyboard used for typing a player profile
// name (there is no physical keyboard on a phone). Ported layout/geometry
// from the Python VirtualKeyboard: short rows are centered against a
// 10-column grid (so e.g. the 9-key home row still lines up like a real
// keyboard), the bottom row (EN/HE, Space, Backspace, Enter) spans the
// full width. Responds on pointer-down (immediate feedback, matching the
// source, and standard keyboard UX).
MR.UI.VirtualKeyboard = class VirtualKeyboard {
  constructor(x, y, w, h) {
    this.rect = { x, y, w, h };
    this.isHebrew = true;
    this.caps = false;
    this.keys = [];
    this.buildKeys();
  }

  static layoutHe() {
    return [
      ["/", "'", "ק", "ר", "א", "ט", "ו", "ן", "ם", "פ"],
      ["ש", "ד", "ג", "כ", "ע", "י", "ח", "ל", "ך", "ף"],
      ["ז", "ס", "ב", "ה", "נ", "מ", "צ", "ת", "ץ", "."],
      ["EN/HE", "Space", "Backspace", "Enter"]
    ];
  }

  static layoutEn() {
    return [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["Caps", "z", "x", "c", "v", "b", "n", "m"],
      ["EN/HE", "Space", "Backspace", "Enter"]
    ];
  }

  buildKeys() {
    this.keys = [];
    const layout = this.isHebrew ? VirtualKeyboard.layoutHe() : VirtualKeyboard.layoutEn();
    const gap = 10;
    const keyH = (this.rect.h - (layout.length - 1) * gap) / layout.length;
    let y = this.rect.y;

    layout.forEach((row, ri) => {
      const isLastRow = ri === layout.length - 1;
      if (isLastRow) {
        const n = row.length;
        const keyW = (this.rect.w - (n - 1) * gap) / n;
        let x = this.rect.x;
        row.forEach((k) => {
          this.keys.push({ key: k, rect: { x, y, w: keyW, h: keyH } });
          x += keyW + gap;
        });
      } else {
        const keyW = (this.rect.w - 9 * gap) / 10;
        const rowW = row.length * keyW + (row.length - 1) * gap;
        let x = this.rect.x + (this.rect.w - rowW) / 2;
        row.forEach((k) => {
          this.keys.push({ key: k, rect: { x, y, w: keyW, h: keyH } });
          x += keyW + gap;
        });
      }
      y += keyH + gap;
    });
  }

  // Returns: undefined (no key hit), null (handled internally: caps/EN-HE
  // toggle), ' ' (space), 'BACKSPACE', 'ENTER', or a single character.
  onPointerDown(pos) {
    for (const { key, rect } of this.keys) {
      if (MR.DrawUtils.hit(pos, rect)) {
        MR.Sound.play("type");
        if (key === "EN/HE") { this.isHebrew = !this.isHebrew; this.buildKeys(); return null; }
        if (key === "Caps") { this.caps = !this.caps; this.buildKeys(); return null; }
        if (key === "Space") return " ";
        if (key === "Backspace") return "BACKSPACE";
        if (key === "Enter") return "ENTER";
        return !this.isHebrew && this.caps ? key.toUpperCase() : key.toLowerCase();
      }
    }
    return undefined;
  }

  draw(ctx, hoverPos) {
    const theme = MR.Store.getCurrTheme();
    MR.DrawUtils.panel(ctx, this.rect.x - 12, this.rect.y - 12, this.rect.w + 24, this.rect.h + 24, 20, theme, {
      fill: theme.bg
    });

    for (const { key, rect } of this.keys) {
      const hover = hoverPos && MR.DrawUtils.hit(hoverPos, rect);
      let fill = hover ? theme.highlight : theme.panel;
      if (key === "Enter") fill = MR.Colors.GREEN;
      else if (key === "Backspace") fill = MR.Colors.RED;
      else if (key === "Caps" && this.caps) fill = MR.Colors.BLUE;

      MR.DrawUtils.fillRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, fill);
      MR.DrawUtils.strokeRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, theme.border, 2);

      let label = key;
      if (!this.isHebrew && key.length === 1 && /[a-z]/i.test(key)) {
        label = this.caps ? key.toUpperCase() : key.toLowerCase();
      }
      if (key === "Backspace") label = MR.I18N.t("מחק");
      else if (key === "Enter") label = MR.I18N.t("אישור");
      else if (key === "Space") label = MR.I18N.isEn() ? "Space" : "רווח";

      const isSpecial = ["Enter", "Backspace", "Caps", "EN/HE", "Space"].includes(key);
      const textColor = key === "Enter" || key === "Backspace" || (key === "Caps" && this.caps)
        ? MR.Colors.WHITE
        : theme.text;
      MR.RTL.draw(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, {
        font: `700 ${isSpecial ? 22 : 30}px ${MR.FONT_STACK}`,
        color: textColor
      });
    }
  }
};
