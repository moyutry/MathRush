// Small shared canvas-drawing helpers used by every UI widget/screen.
MR.DrawUtils = {
  roundRectPath(ctx, x, y, w, h, r) {
    if (typeof r === "number") r = { tl: r, tr: r, br: r, bl: r };
    const tl = Math.min(r.tl, w / 2, h / 2);
    const tr = Math.min(r.tr, w / 2, h / 2);
    const br = Math.min(r.br, w / 2, h / 2);
    const bl = Math.min(r.bl, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.arcTo(x + w, y, x + w, y + tr, tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    ctx.lineTo(x + bl, y + h);
    ctx.arcTo(x, y + h, x, y + h - bl, bl);
    ctx.lineTo(x, y + tl);
    ctx.arcTo(x, y, x + tl, y, tl);
    ctx.closePath();
  },

  fillRoundRect(ctx, x, y, w, h, r, fillStyle) {
    this.roundRectPath(ctx, x, y, w, h, r);
    if (fillStyle) ctx.fillStyle = fillStyle;
    ctx.fill();
  },

  strokeRoundRect(ctx, x, y, w, h, r, strokeStyle, lineWidth) {
    this.roundRectPath(ctx, x, y, w, h, r);
    if (strokeStyle) ctx.strokeStyle = strokeStyle;
    if (lineWidth) ctx.lineWidth = lineWidth;
    ctx.stroke();
  },

  linearGradient(ctx, x, y, w, h, colors, vertical) {
    const grad = vertical
      ? ctx.createLinearGradient(x, y, x, y + h)
      : ctx.createLinearGradient(x, y, x + w, y);
    const n = colors.length;
    colors.forEach((c, i) => grad.addColorStop(n > 1 ? i / (n - 1) : 0, c));
    return grad;
  },

  // Turns any fill source into a gradient for the "futuristic" glossy look:
  // an explicit [c1, c2, ...] array is used as-is (curated theme gradients
  // like theme.bgGrad/panelGrad), a plain "#rrggbb" gets an automatic
  // lighter-top/darker-bottom sheen derived from itself via shade(), and
  // anything else (already a CanvasGradient, an rgba() string, etc.) passes
  // through untouched.
  autoGradient(ctx, x, y, w, h, source, vertical) {
    if (!source) return source;
    if (Array.isArray(source)) return this.linearGradient(ctx, x, y, w, h, source, vertical !== false);
    if (typeof source === "string" && source[0] === "#" && source.length === 7) {
      return this.linearGradient(ctx, x, y, w, h, [this.shade(source, 0.22), this.shade(source, -0.2)], vertical !== false);
    }
    return source;
  },

  // Soft blurred color blob (radial gradient -> transparent) used for the
  // slow-drifting ambient background glow behind panels -- part of the
  // "futuristic" visual pass.
  glowBlob(ctx, cx, cy, radius, color) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  // Lightens (positive percent 0..1) or darkens (negative) a "#rrggbb" color.
  // Non-hex inputs (e.g. already-built gradients) are returned unchanged.
  shade(hexColor, percent) {
    if (typeof hexColor !== "string" || hexColor[0] !== "#" || hexColor.length !== 7) return hexColor;
    const num = parseInt(hexColor.slice(1), 16);
    let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
    const amt = Math.round(255 * percent);
    r = Math.min(255, Math.max(0, r + amt));
    g = Math.min(255, Math.max(0, g + amt));
    b = Math.min(255, Math.max(0, b + amt));
    return `rgb(${r},${g},${b})`;
  },

  hit(pos, rect) {
    return (
      pos.x >= rect.x && pos.x <= rect.x + rect.w &&
      pos.y >= rect.y && pos.y <= rect.y + rect.h
    );
  },

  // Soft drop-shadow panel used by most UI containers. Gradient-filled
  // (gloss sheen on top, auto-darkened bottom) with a faint glowing border
  // instead of a flat fill/stroke, for the "futuristic" visual pass.
  panel(ctx, x, y, w, h, r, theme, opts) {
    opts = opts || {};
    ctx.save();
    ctx.shadowColor = opts.shadowColor || "rgba(0,0,0,0.25)";
    ctx.shadowBlur = opts.blur !== undefined ? opts.blur : 18;
    ctx.shadowOffsetY = opts.offsetY !== undefined ? opts.offsetY : 8;
    const fillSrc = opts.fill || theme.panelGrad || theme.panel;
    const fill = this.autoGradient(ctx, x, y, w, h, fillSrc);
    this.fillRoundRect(ctx, x, y, w, h, r, fill);
    ctx.restore();

    if (opts.sheen !== false) {
      ctx.save();
      this.roundRectPath(ctx, x, y, w, h, r);
      ctx.clip();
      const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.55);
      sheen.addColorStop(0, "rgba(255,255,255,0.14)");
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(x, y, w, h * 0.55);
      ctx.restore();
    }

    const borderColor = opts.border || theme.border;
    if (opts.glow !== false) {
      ctx.save();
      ctx.shadowColor = borderColor;
      ctx.shadowBlur = opts.glowBlur !== undefined ? opts.glowBlur : 10;
      this.strokeRoundRect(ctx, x, y, w, h, r, borderColor, opts.borderWidth || 3);
      ctx.restore();
    } else {
      this.strokeRoundRect(ctx, x, y, w, h, r, borderColor, opts.borderWidth || 3);
    }
  }
};
