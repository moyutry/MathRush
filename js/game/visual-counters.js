// "Visual Mode" counting dots for young learners: shows a+b as rows of
// colored circles when both operands are <=10. Ported from the Python
// source's visual_mode block (only active in quick-answer, non-vertical
// display, matching the original).
MR.Game = MR.Game || {};

MR.Game.VisualCounters = {
  draw(ctx, player, cx, cy) {
    const { a, b } = player.problem;
    if (a > 10 || b > 10) return;
    const theme = MR.Store.getCurrTheme();

    const r = 12, spacing = 32, rowSpacing = 27;
    const drawGroup = (count, xOffset, color) => {
      const cols = Math.min(count, 5);
      const totalW = (cols - 1) * spacing;
      const startX = cx + xOffset - totalW / 2;
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const x = startX + col * spacing;
        const y = cy - 68 - row * rowSpacing;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawGroup(a, -78, theme.highlight);
    drawGroup(b, 78, theme.player1);
  }
};
