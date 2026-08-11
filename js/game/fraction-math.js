// Fraction exercises: a plug-in engine module parallel to VerticalMath (see
// vertical-math.js) -- it owns its own per-player state (player.fm) and is
// dispatched from PlayerState purely based on problem.opKind, without any
// separate "vertical" toggle. Generation always builds backward from a
// valid, already-reduced target where non-negativity/non-zero matters
// (subtraction, division) and forward otherwise (addition, multiplication),
// so every problem is exact and solvable by construction -- no runtime
// validity checks are needed anywhere below.
//
// Every stage is player-driven -- there is deliberately no auto-advancing
// "watch this" reveal anywhere. For +/- with unlike denominators, the
// player has to find a common denominator themselves (not be told one),
// then is asked to do each equivalent-fraction multiplication by hand; a
// correct answer strikes out the old numerator/denominator and writes the
// new one in its place, mirroring VerticalMath's own borrow visual (old
// value shrinks/fades with a red strike-through, new value takes over) so
// the two engines share one visual language for "this got replaced". For
// x/division, the method is an optional on-demand hint (a small "?"
// button the player can tap to reveal connecting lines) rather than
// something forced on every problem.
MR.Game = MR.Game || {};

function fracRandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

MR.Game.FractionMath = {
  DENOM_MAX: 6,

  // ---- generation -----------------------------------------------------

  generate(op) {
    if (op === "+") return this._genAdd();
    if (op === "-") return this._genSub();
    if (op === "*") return this._genMul();
    return this._genDiv();
  },

  _randFrac() {
    const FU = MR.Game.FractionUtils;
    const d = fracRandInt(2, this.DENOM_MAX);
    const n = fracRandInt(1, d - 1);
    return FU.reduce({ n, d });
  },

  _buildProblem(op, displayOp, a, b, ans) {
    const FU = MR.Game.FractionUtils;
    let lcd = null, crossA = null, crossB = null;
    if ((op === "+" || op === "-") && a.d !== b.d) {
      lcd = FU.lcm(a.d, b.d);
      crossA = a.n * (lcd / a.d);
      crossB = b.n * (lcd / b.d);
    }
    return {
      opKind: "fraction", op,
      q: `${a.n}/${a.d} ${displayOp} ${b.n}/${b.d}`,
      a, b, ans, lcd, crossA, crossB
    };
  },

  // a + b = ans. Both operands are positive by construction, so a forward
  // pick (unlike subtraction) can never produce an invalid problem.
  _genAdd() {
    const FU = MR.Game.FractionUtils;
    const a = this._randFrac();
    const b = this._randFrac();
    return this._buildProblem("+", "+", a, b, FU.add(a, b));
  },

  // a - b = ans. Picking ans and b first and deriving a = ans + b
  // guarantees a >= b, i.e. a non-negative result, exactly like the
  // integer generator's a = randInt(...); b = randInt(1, a-1) trick.
  _genSub() {
    const FU = MR.Game.FractionUtils;
    const ans = this._randFrac();
    const b = this._randFrac();
    const a = FU.add(ans, b);
    return this._buildProblem("-", "-", a, b, ans);
  },

  _genMul() {
    const FU = MR.Game.FractionUtils;
    const a = this._randFrac();
    const b = this._randFrac();
    return this._buildProblem("*", "×", a, b, FU.mul(a, b));
  },

  // a / b = ans. Picking ans and b first and deriving a = ans * b
  // guarantees an exact, remainder-free division.
  _genDiv() {
    const FU = MR.Game.FractionUtils;
    const ans = this._randFrac();
    const b = this._randFrac();
    const a = FU.mul(ans, b);
    return this._buildProblem("/", "÷", a, b, ans);
  },

  // ---- state machine ----------------------------------------------------

  needsCrossMultiply(problem) {
    return (problem.op === "+" || problem.op === "-") && problem.lcd !== null;
  },

  resetState(player) {
    const p = player.problem;
    if (!p || p.opKind !== "fraction") { player.fm = null; return; }

    const stages = [];
    if (this.needsCrossMultiply(p)) {
      stages.push("FIND_LCD");
      if (p.a.d !== p.lcd) stages.push("CONVERT_A");
      if (p.b.d !== p.lcd) stages.push("CONVERT_B");
    }
    stages.push("ENTER_NUM");
    if (p.ans.d !== 1) stages.push("ENTER_DEN");

    player.fm = {
      stages, stageIdx: 0, appearT: 0, hintOn: false, hintRect: null,
      aConv: null, bConv: null, numEntered: null
    };
  },

  // Purely cosmetic entrance fade -- never gates input, so there is
  // nothing here for the player to wait out or need to skip.
  updateAnim(fm, dt) {
    if (!fm) return;
    if (fm.appearT < 1) fm.appearT = Math.min(1, fm.appearT + dt * 3.2);
  },

  handleHintTap(player, pos) {
    const fm = player.fm, p = player.problem;
    if (!fm || (p.op !== "*" && p.op !== "/")) return false;
    if (fm.hintRect && MR.DrawUtils.hit(pos, fm.hintRect)) {
      fm.hintOn = !fm.hintOn;
      MR.Sound.play("click");
      return true;
    }
    return false;
  },

  processInput(player) {
    const fm = player.fm, p = player.problem;
    const stageName = fm.stages[fm.stageIdx];

    if (stageName === "FIND_LCD") {
      this._checkStage(player, String(p.lcd), () => this._advance(fm));
    } else if (stageName === "CONVERT_A") {
      this._checkStage(player, String(p.crossA), () => {
        fm.aConv = { newN: p.crossA, newD: p.lcd };
        this._advance(fm);
      });
    } else if (stageName === "CONVERT_B") {
      this._checkStage(player, String(p.crossB), () => {
        fm.bConv = { newN: p.crossB, newD: p.lcd };
        this._advance(fm);
      });
    } else if (stageName === "ENTER_NUM") {
      this._checkStage(player, String(p.ans.n), () => {
        fm.numEntered = String(p.ans.n);
        if (fm.stages[fm.stageIdx + 1] === "ENTER_DEN") this._advance(fm);
        else player.correct();
      });
    } else if (stageName === "ENTER_DEN") {
      this._checkStage(player, String(p.ans.d), () => player.correct());
    }
  },

  _advance(fm) {
    fm.stageIdx += 1;
    MR.Sound.play("type");
  },

  _checkStage(player, target, onSuccess) {
    const buf = player.inputBuffer;
    if (buf.length !== target.length) return;
    if (MR.Game.sortedEquals(buf, target)) {
      onSuccess();
    } else {
      player.wrong();
    }
    player.inputBuffer = [];
  },

  // ---- drawing --------------------------------------------------------

  _fracWidth(ctx, n, d, fontPx) {
    ctx.save();
    ctx.font = `800 ${fontPx}px ${MR.FONT_STACK}`;
    const w = Math.max(ctx.measureText(String(n)).width, ctx.measureText(String(d)).width);
    ctx.restore();
    return w + fontPx * 0.5;
  },

  // Numerator / bar / denominator, vertically centered on midY. Returns the
  // bar's width so callers can lay out an operator symbol beside it.
  _drawFraction(ctx, cx, midY, n, d, fontPx, color, alpha) {
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    const barW = this._fracWidth(ctx, n, d, fontPx);
    const gap = fontPx * 0.16;
    MR.RTL.draw(ctx, String(n), cx, midY - gap - fontPx * 0.42, { font: `800 ${fontPx}px ${MR.FONT_STACK}`, color });
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, fontPx * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - barW / 2, midY);
    ctx.lineTo(cx + barW / 2, midY);
    ctx.stroke();
    MR.RTL.draw(ctx, String(d), cx, midY + gap + fontPx * 0.42, { font: `800 ${fontPx}px ${MR.FONT_STACK}`, color });
    ctx.restore();
    return barW;
  },

  // Once a conversion completed, show the old fraction crossed out
  // (shrunk, faded, red strike-through -- same idiom as VerticalMath's
  // borrow history) with the new equivalent fraction taking its place.
  _drawFractionMaybeConverted(ctx, cx, midY, orig, conv, fontPx, color) {
    if (!conv) return this._drawFraction(ctx, cx, midY, orig.n, orig.d, fontPx, color);

    const oldFontPx = fontPx * 0.5;
    const oldCx = cx - fontPx * 0.86;
    const oldCy = midY - fontPx * 0.92;
    ctx.save();
    ctx.globalAlpha = 0.55;
    const oldW = this._drawFraction(ctx, oldCx, oldCy, orig.n, orig.d, oldFontPx, MR.Colors.LIGHT_GRAY);
    ctx.strokeStyle = MR.Colors.RED;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(oldCx - oldW / 2 - 4, oldCy - oldFontPx * 0.2);
    ctx.lineTo(oldCx + oldW / 2 + 4, oldCy + oldFontPx * 0.2);
    ctx.stroke();
    ctx.restore();

    return this._drawFraction(ctx, cx, midY, conv.newN, conv.newD, fontPx, MR.Colors.GOLD);
  },

  _drawMixedHint(ctx, cx, y, n, d, color) {
    if (n < d) return;
    const m = MR.Game.FractionUtils.toMixed({ n, d });
    const txt = m.n > 0 ? `= ${m.whole} ${m.n}/${m.d}` : `= ${m.whole}`;
    MR.RTL.draw(ctx, txt, cx, y, { font: `700 18px ${MR.FONT_STACK}`, color });
  },

  _drawSlots(ctx, cx, y, targetLen, filledCount, color, emptyColor) {
    const slotW = 40, slotH = 10, spacing = 12;
    const totalW = targetLen * slotW + (targetLen - 1) * spacing;
    const startX = cx - totalW / 2;
    for (let i = 0; i < targetLen; i++) {
      const c = i < filledCount ? color : emptyColor;
      MR.DrawUtils.fillRoundRect(ctx, startX + i * (slotW + spacing), y, slotW, slotH, 5, c);
    }
  },

  _drawHintButton(ctx, fm, cx, y, theme) {
    const r = 18;
    fm.hintRect = { x: cx - r, y: y - r, w: r * 2, h: r * 2 };
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fm.hintOn ? theme.highlight : theme.panel;
    ctx.fill();
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
    MR.RTL.draw(ctx, "?", cx, y + 1, { font: `800 20px ${MR.FONT_STACK}`, color: fm.hintOn ? MR.Colors.WHITE : theme.text });
  },

  // Curved connector with a small label at its midpoint -- the shared
  // building block for both the multiplication cross-lines and the
  // division swap hint.
  _drawConnector(ctx, x1, y1, x2, y2, bend, color, label) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + bend;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.stroke();
    ctx.restore();
    if (label) {
      MR.RTL.draw(ctx, label, mx, my, { font: `800 20px ${MR.FONT_STACK}`, color });
    }
  },

  draw(ctx, player, cx, cy) {
    const theme = MR.Store.getCurrTheme();
    const fm = player.fm, p = player.problem;
    const layout = player.layout;
    const bandH = Math.max(140, layout.problemBottom - layout.problemTop);
    const scale = Math.min(1, bandH / 300);
    const color = player.feedbackColor;
    const stageName = fm.stages[fm.stageIdx];
    const fontPx = 46 * scale;

    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * fm.appearT;

    const opSymbol = p.op === "*" ? "×" : p.op === "/" ? "÷" : p.op;
    const rowY = layout.problemTop + 60 * scale;

    const aW = this._fracWidth(ctx, p.a.n, p.a.d, fontPx);
    const bW = this._fracWidth(ctx, p.b.n, p.b.d, fontPx);
    const gap = 40 * scale;
    const totalW = aW + bW + gap * 2 + fontPx * 0.7;
    const aX = cx - totalW / 2 + aW / 2;
    const opX = aX + aW / 2 + gap;
    const bX = opX + fontPx * 0.35 + gap + bW / 2;

    this._drawFractionMaybeConverted(ctx, aX, rowY, p.a, fm.aConv, fontPx, color);
    MR.RTL.draw(ctx, opSymbol, opX, rowY, { font: `800 ${fontPx * 0.9}px ${MR.FONT_STACK}`, color: theme.highlight });
    this._drawFractionMaybeConverted(ctx, bX, rowY, p.b, fm.bConv, fontPx, color);
    if (!fm.aConv) this._drawMixedHint(ctx, aX, rowY + fontPx * 0.85 + 14 * scale, p.a.n, p.a.d, MR.Colors.LIGHT_GRAY);
    if (!fm.bConv) this._drawMixedHint(ctx, bX, rowY + fontPx * 0.85 + 14 * scale, p.b.n, p.b.d, MR.Colors.LIGHT_GRAY);

    // Optional, player-triggered method hint for x / division -- never
    // shown automatically. A tap toggles connecting lines instead of the
    // game just performing/explaining the method on its own.
    if (p.op === "*" || p.op === "/") {
      this._drawHintButton(ctx, fm, opX, rowY - fontPx * 0.95, theme);
      if (fm.hintOn) {
        const hc = theme.highlight;
        if (p.op === "*") {
          this._drawConnector(ctx, aX, rowY - fontPx * 0.42, bX, rowY - fontPx * 0.42, -26 * scale, hc, "×");
          this._drawConnector(ctx, aX, rowY + fontPx * 0.42, bX, rowY + fontPx * 0.42, 26 * scale, hc, "×");
        } else {
          this._drawConnector(ctx, bX, rowY - fontPx * 0.42, bX, rowY + fontPx * 0.42, 0, hc, "⇅");
          MR.RTL.draw(ctx, MR.I18N.t("הופכים ואז כופלים"), bX, rowY + fontPx * 1.15, {
            font: `700 ${16 * scale}px ${MR.FONT_STACK}`, color: hc
          });
        }
      }
    }

    const infoY = rowY + 92 * scale;
    const slotY = rowY + 132 * scale;

    if (stageName === "FIND_LCD") {
      MR.RTL.draw(ctx, MR.I18N.t("מכנה משותף?"), cx, infoY, { font: `700 ${24 * scale}px ${MR.FONT_STACK}`, color: theme.highlight });
      this._drawSlots(ctx, cx, slotY, String(p.lcd).length, player.inputBuffer.length, player.baseColor, theme.border);
    } else if (stageName === "CONVERT_A" || stageName === "CONVERT_B") {
      MR.RTL.draw(ctx, `${MR.I18N.t("מכנה משותף:")} ${p.lcd}`, cx, infoY - 26 * scale, {
        font: `700 ${18 * scale}px ${MR.FONT_STACK}`, color: MR.Colors.LIGHT_GRAY
      });
      const cross = stageName === "CONVERT_A" ? p.crossA : p.crossB;
      const src = stageName === "CONVERT_A" ? p.a : p.b;
      const mult = p.lcd / src.d;
      MR.RTL.draw(ctx, `${src.n} × ${mult} = ?`, cx, infoY + 12 * scale, { font: `700 ${22 * scale}px ${MR.FONT_STACK}`, color });
      this._drawSlots(ctx, cx, slotY, String(cross).length, player.inputBuffer.length, player.baseColor, theme.border);
    } else if (stageName === "ENTER_NUM") {
      MR.RTL.draw(ctx, "=", cx, infoY, { font: `800 ${28 * scale}px ${MR.FONT_STACK}`, color: theme.text });
      this._drawSlots(ctx, cx, slotY, String(p.ans.n).length, player.inputBuffer.length, player.baseColor, theme.border);
    } else if (stageName === "ENTER_DEN") {
      MR.RTL.draw(ctx, `= ${fm.numEntered} /`, cx, infoY, { font: `800 ${26 * scale}px ${MR.FONT_STACK}`, color: theme.text });
      this._drawSlots(ctx, cx, slotY, String(p.ans.d).length, player.inputBuffer.length, player.baseColor, theme.border);
    }

    ctx.restore();
  }
};
