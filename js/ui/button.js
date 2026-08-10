// Canvas button widget. Ported from the Python Button class (shadow-offset
// rect, press-offset, themed border, translated+RTL-aware label), with a
// press-scale animation, a glossy top highlight and a light haptic tick
// added for the visual overhaul.
//
// base/hover may be omitted (null) to dynamically track the current theme's
// panel/highlight colors every frame (mirrors the source's GRAY/LIGHT_GRAY
// sentinel trick, but explicit instead of a magic-color comparison).
MR.UI = MR.UI || {};

MR.UI.Button = class Button {
  constructor(x, y, w, h, textKey, opts) {
    opts = opts || {};
    this.rect = { x, y, w, h };
    this.textKey = textKey;
    this.base = opts.base || null;
    this.hover = opts.hover || null;
    this.fontSize = opts.fontSize || 34;
    this.enabled = opts.enabled !== undefined ? opts.enabled : true;
    this.isHovered = false;
    this.isPressed = false;
  }

  contains(pos) {
    return (
      pos.x >= this.rect.x && pos.x <= this.rect.x + this.rect.w &&
      pos.y >= this.rect.y && pos.y <= this.rect.y + this.rect.h
    );
  }

  checkHover(pos) {
    this.isHovered = this.contains(pos);
  }

  onPointerDown(pos) {
    if (!this.enabled) return false;
    if (this.contains(pos)) {
      this.isPressed = true;
      return true;
    }
    return false;
  }

  // Returns true if this pointer-up completes a click on this button.
  onPointerUp(pos) {
    const was = this.isPressed;
    this.isPressed = false;
    if (!this.enabled || !was) return false;
    if (this.contains(pos)) {
      MR.Sound.play("click");
      if (navigator.vibrate) {
        try { navigator.vibrate(10); } catch (e) { /* unsupported */ }
      }
      return true;
    }
    return false;
  }

  draw(ctx) {
    const theme = MR.Store.getCurrTheme();
    const baseColor = this.base || theme.panel;
    const hoverColor = this.hover || theme.highlight;
    const fillColor = !this.enabled
      ? MR.Colors.LIGHT_GRAY
      : this.isHovered
      ? hoverColor
      : baseColor;

    const pressed = this.enabled && this.isPressed && this.isHovered;
    const scale = pressed ? 0.965 : 1;
    const { x, y, w, h } = this.rect;
    const cx = x + w / 2, cy = y + h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    const r = Math.min(24, h / 2.4);
    const shadowOffset = pressed ? 3 : 7;

    MR.DrawUtils.fillRoundRect(ctx, x, y + shadowOffset, w, h, r, MR.Colors.SHADOW);
    const grad = MR.DrawUtils.autoGradient(ctx, x, y, w, h, fillColor);
    MR.DrawUtils.fillRoundRect(ctx, x, y, w, h, r, grad);

    // cheap glossy top highlight
    ctx.save();
    MR.DrawUtils.roundRectPath(ctx, x, y, w, h * 0.5, { tl: r, tr: r, br: 0, bl: 0 });
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x, y, w, h * 0.5);
    ctx.restore();

    // soft edge-lit glow -- brighter (theme highlight) when hovered/pressed
    // for a "futuristic" active feel; a gentle idle breathing pulse
    // otherwise so buttons never look fully static.
    const idlePulse = 5 + Math.sin(performance.now() / 900) * 3;
    ctx.save();
    ctx.shadowColor = this.isHovered && this.enabled ? hoverColor : theme.border;
    ctx.shadowBlur = this.isHovered && this.enabled ? 18 : idlePulse;
    MR.DrawUtils.strokeRoundRect(ctx, x, y, w, h, r, theme.border, 4);
    ctx.restore();

    let textColor = MR.Colors.WHITE;
    if (fillColor === theme.panel || fillColor === MR.Colors.WHITE) textColor = theme.text;

    MR.RTL.draw(ctx, MR.I18N.t(this.textKey), cx, cy + 2, {
      font: `700 ${this.fontSize}px ${MR.FONT_STACK}`,
      color: textColor
    });

    ctx.restore();
  }
};
