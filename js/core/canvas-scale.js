// Fixed-logical-resolution canvas, scaled to "contain"-fit the viewport and
// letterboxed with the active theme's background color. This mirrors the
// exact technique the Python source already uses on its Android code path
// (render to a fixed WIDTH x HEIGHT surface, then scale to the real device
// size) -- a pattern already proven for this game -- so every screen's draw
// code can work in clean, fixed logical coordinates (0..1600 / 0..740)
// regardless of the real device's resolution or aspect ratio.
MR.CanvasScale = {
  canvas: null,
  ctx: null,
  wrapper: null,
  fitScale: 1,
  dpr: 1,
  cssW: 0,
  cssH: 0,

  init() {
    this.canvas = document.getElementById("game-canvas");
    this.wrapper = document.getElementById("game-wrapper");
    this.ctx = this.canvas.getContext("2d");
    this.recompute();

    window.addEventListener("resize", () => this.recompute());
    window.addEventListener("orientationchange", () => setTimeout(() => this.recompute(), 60));
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", () => this.recompute());
    }
  },

  recompute() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const fitScale = Math.min(vw / MR.LOGICAL_W, vh / MR.LOGICAL_H);
    this.fitScale = fitScale;

    const cssW = Math.max(1, Math.round(MR.LOGICAL_W * fitScale));
    const cssH = Math.max(1, Math.round(MR.LOGICAL_H * fitScale));
    this.cssW = cssW;
    this.cssH = cssH;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.dpr = dpr;

    this.canvas.style.width = cssW + "px";
    this.canvas.style.height = cssH + "px";
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);

    // All draw code below this point works in logical 0..LOGICAL_W /
    // 0..LOGICAL_H space; this one transform handles both the fit-scale
    // and the device-pixel-ratio crispness.
    this.ctx.setTransform(fitScale * dpr, 0, 0, fitScale * dpr, 0, 0);

    this.syncThemeBg();
  },

  // Keeps the letterbox bars (the wrapper's background, showing around the
  // canvas) themed instead of plain black bars.
  syncThemeBg() {
    try {
      const theme = MR.Store.getCurrTheme();
      const grad = theme.bgGrad || [theme.bg, theme.bg];
      this.wrapper.style.background = `radial-gradient(ellipse at 50% 40%, ${grad[0]}, ${grad[1]})`;
      document.documentElement.style.setProperty("--theme-bg", theme.bg);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", theme.bg);
    } catch (e) {
      // storage not initialized yet -- CSS default background applies
    }
  },

  clientToLogical(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;
    return {
      x: (clientX - rect.left) * (MR.LOGICAL_W / w),
      y: (clientY - rect.top) * (MR.LOGICAL_H / h)
    };
  }
};
