// Unified pointer (mouse + touch + pen) input, mapped into logical canvas
// coordinates and dispatched to the active GameApp screen. Only the primary
// pointer is tracked so a second accidental finger can't interfere.
MR.Input = {
  hoverPos: { x: -1, y: -1 },
  activePointerId: null,

  init() {
    const canvas = MR.CanvasScale.canvas;
    canvas.addEventListener("pointerdown", (e) => this._onDown(e));
    canvas.addEventListener("pointermove", (e) => this._onMove(e));
    window.addEventListener("pointerup", (e) => this._onUp(e));
    window.addEventListener("pointercancel", (e) => this._onUp(e));
    window.addEventListener("keydown", (e) => this._onKeyDown(e));
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  },

  _toLogical(e) {
    return MR.CanvasScale.clientToLogical(e.clientX, e.clientY);
  },

  _onDown(e) {
    if (this.activePointerId !== null) return;
    this.activePointerId = e.pointerId;
    const pos = this._toLogical(e);
    this.hoverPos = pos;
    if (MR.GameApp) MR.GameApp.onPointerDown(pos);
  },

  _onMove(e) {
    const pos = this._toLogical(e);
    this.hoverPos = pos;
    if (MR.GameApp) MR.GameApp.onPointerMove(pos);
  },

  _onUp(e) {
    if (this.activePointerId !== e.pointerId) return;
    this.activePointerId = null;
    const pos = this._toLogical(e);
    if (MR.GameApp) MR.GameApp.onPointerUp(pos);
  },

  _onKeyDown(e) {
    if (MR.GameApp) MR.GameApp.onKeyDown(e);
  }
};
