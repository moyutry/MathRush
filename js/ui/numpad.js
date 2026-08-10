// Shared numeric keypad, built from a grid of rows so it can serve both
// jobs the Python source handled with two separate near-duplicate
// implementations: the in-gameplay digit pad (PlayerState) and the
// Settings numeric-field pad (with Delete/OK). Each button is a real
// MR.UI.Button so hover/press/hit-testing/haptics come for free.
//
// rows: array of arrays; each cell is null (empty spacer) or
// {key, label, danger, success}.
MR.UI.Numpad = class Numpad {
  constructor(cx, topY, rows, opts) {
    opts = opts || {};
    const unit = opts.unit || 118;
    const gap = opts.gap || 14;
    const h = opts.height || unit;
    this.buttons = [];
    let y = topY;
    rows.forEach((row) => {
      const cols = row.length;
      const totalW = cols * unit + (cols - 1) * gap;
      let x = cx - totalW / 2;
      row.forEach((cell) => {
        if (cell) {
          const btn = new MR.UI.Button(x, y, unit, h, cell.label || cell.key, {
            base: cell.danger ? MR.Colors.RED : cell.success ? MR.Colors.GREEN : null,
            fontSize: opts.fontSize || 44
          });
          btn.key = cell.key;
          this.buttons.push(btn);
        }
        x += unit + gap;
      });
      y += h + gap;
    });
    this.bottom = y - gap;
  }

  checkHover(pos) {
    this.buttons.forEach((b) => b.checkHover(pos));
  }

  containsPoint(pos) {
    return this.buttons.some((b) => b.contains(pos));
  }

  onPointerDown(pos) {
    let any = false;
    this.buttons.forEach((b) => { if (b.onPointerDown(pos)) any = true; });
    return any;
  }

  // Returns the key string of a completed tap, or null.
  onPointerUp(pos) {
    for (const b of this.buttons) {
      if (b.onPointerUp(pos)) return b.key;
    }
    return null;
  }

  draw(ctx) {
    this.buttons.forEach((b) => b.draw(ctx));
  }
};

// Gameplay digit pad: 5 columns x 2 rows. A 3x4 phone-style grid was tried
// first, but at large comfortable button sizes it grows tall enough to
// collide with the problem number above it (especially in the narrower
// VERSUS split-screen column); wide-and-short uses the same button area
// while costing far less vertical space, which the problem/vertical-math
// display needs.
MR.UI.Numpad.digitsOnlyRows = () => [
  [{ key: "1" }, { key: "2" }, { key: "3" }, { key: "4" }, { key: "5" }],
  [{ key: "6" }, { key: "7" }, { key: "8" }, { key: "9" }, { key: "0" }]
];

// Single wide row (used by the Settings screen, which always has the full
// canvas width available, unlike the split-screen gameplay numpad above).
MR.UI.Numpad.withDeleteOkSingleRow = () => [[
  { key: "1" }, { key: "2" }, { key: "3" }, { key: "4" }, { key: "5" },
  { key: "6" }, { key: "7" }, { key: "8" }, { key: "9" }, { key: "0" },
  { key: "del", label: "מחק", danger: true },
  { key: "ok", label: "אישור", success: true }
]];
