// Native RTL text rendering. Canvas2D implements the real Unicode Bidi
// Algorithm via ctx.direction, so Hebrew (and mixed Hebrew+number) strings
// can just be drawn in natural logical order -- no manual word/char
// reversal hack needed (the Python source's heb() function is not ported).
MR.RTL = {
  HEB_RE: /[֐-ת]/,

  isHebrew(text) {
    return this.HEB_RE.test(String(text));
  },

  // align/baseline use canvas' absolute (not direction-relative) keywords:
  // 'left' | 'center' | 'right', and textBaseline values.
  draw(ctx, text, x, y, opts) {
    opts = opts || {};
    text = String(text);
    ctx.save();
    if (opts.font) ctx.font = opts.font;
    if (opts.color) ctx.fillStyle = opts.color;
    ctx.direction = this.isHebrew(text) ? "rtl" : "ltr";
    ctx.textAlign = opts.align || "center";
    ctx.textBaseline = opts.baseline || "middle";
    if (opts.maxWidth) {
      ctx.fillText(text, x, y, opts.maxWidth);
    } else {
      ctx.fillText(text, x, y);
    }
    if (opts.shadow) {
      // shadow already drawn as a second pass by caller if needed
    }
    ctx.restore();
  },

  // Convenience: draws a soft drop-shadow copy then the main text on top.
  drawShadowed(ctx, text, x, y, opts) {
    opts = opts || {};
    const dy = opts.shadowOffset || 3;
    this.draw(ctx, text, x, y + dy, Object.assign({}, opts, { color: opts.shadowColor || "rgba(0,0,0,0.25)" }));
    this.draw(ctx, text, x, y, opts);
  },

  // Headline variant: drop-shadow + a horizontal color-gradient fill across
  // the text's own measured width (used for the handful of big screen
  // titles, as part of the "futuristic" gradient visual pass).
  drawGradientHeadline(ctx, text, x, y, opts) {
    opts = opts || {};
    const colors = opts.gradient || [opts.color, opts.color];
    const dy = opts.shadowOffset || 4;
    this.draw(ctx, text, x, y + dy, Object.assign({}, opts, { color: opts.shadowColor || "rgba(0,0,0,0.3)" }));

    const font = opts.font || "16px sans-serif";
    const w = this.measure(ctx, text, font);
    const align = opts.align || "center";
    const gx = align === "left" ? x : align === "right" ? x - w : x - w / 2;
    const grad = MR.DrawUtils.linearGradient(ctx, gx, y, w, 0, colors, false);
    this.draw(ctx, text, x, y, Object.assign({}, opts, { color: grad }));
  },

  measure(ctx, text, font) {
    ctx.save();
    if (font) ctx.font = font;
    ctx.direction = this.isHebrew(text) ? "rtl" : "ltr";
    const w = ctx.measureText(String(text)).width;
    ctx.restore();
    return w;
  }
};
