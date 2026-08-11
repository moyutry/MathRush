// The "show your work" step-by-step column-entry math engine: long
// addition/subtraction (with click-to-borrow) and long multiplication
// (single-digit and two-digit-multiplier with two partial products).
// Ported 1:1 from PlayerState's vertical-math methods in main.py, with one
// deliberate behavior improvement: the source requires one extra, spurious
// keypress to auto-finish a problem whenever the final column's target
// digit is elided (leading-zero suppression) -- this port detects that
// case immediately after the previous column completes and finishes right
// away instead of waiting on a throwaway keypress.
MR.Game = MR.Game || {};

MR.Game.sortedEquals = function (bufArr, targetStr) {
  const a = bufArr.slice().sort();
  const b = targetStr.split("").sort();
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

MR.Game.VerticalMath = {
  needsVertical(problem) {
    if (problem.opKind === "fraction") return false;
    return (problem.a >= 10 || problem.b >= 10) && problem.op !== "/";
  },

  resetState(player) {
    if (player.problem.opKind === "fraction") { player.vm = null; return; }
    const { a, b } = player.problem;
    const aStr = String(a), bStr = String(b);
    const maxLen = Math.max(aStr.length, bStr.length);
    const aPad = aStr.padStart(maxLen, "0");
    const topHistory = [];
    for (let i = 0; i < maxLen; i++) {
      topHistory.push([parseInt(aPad[maxLen - 1 - i], 10)]);
    }
    player.vm = {
      col: 0, stage: 0, carry: 0,
      maxLen,
      topHistory,
      carries: new Array(maxLen + 2).fill(0),
      part1: "", part2: "", sumAns: "", ansUnits: "",
      animCarryVal: 0, animBorrowVal: 0,
      borrowRects: new Array(maxLen).fill(null)
    };
  },

  updateAnim(vm, dt) {
    if (!vm) return;
    if (vm.animCarryVal > 0) vm.animCarryVal = Math.max(0, vm.animCarryVal - dt * 2);
    if (vm.animBorrowVal > 0) vm.animBorrowVal = Math.max(0, vm.animBorrowVal - dt * 3);
  },

  processInput(player) {
    const op = player.problem.op;
    if (op === "+" || op === "-") this._processAddSub(player);
    else if (op === "*") this._processMult(player);
  },

  // ---- addition / subtraction -------------------------------------------

  _computeAddSub(vm, problem, col) {
    const { a, b, op } = problem;
    const bPad = String(b).padStart(vm.maxLen, "0");
    const bDig = col < vm.maxLen ? parseInt(bPad[vm.maxLen - 1 - col], 10) : 0;

    if (op === "+") {
      const aDig = col < vm.maxLen ? vm.topHistory[col][vm.topHistory[col].length - 1] : 0;
      const t = aDig + bDig + (vm.carries[col] || 0);
      const moreCols = col < vm.maxLen - 1 || t >= 10;
      let target, nextCarry;
      if (moreCols) { target = String(t % 10); nextCarry = Math.floor(t / 10); }
      else {
        target = String(t);
        if (target === "0" && col > 0) target = "";
        nextCarry = 0;
      }
      return { target, moreCols, nextCarry };
    }

    // subtraction
    if (col >= vm.maxLen) return { done: true };
    const aVal = vm.topHistory[col][vm.topHistory[col].length - 1];
    const t = aVal - bDig;
    if (t < 0) return { needsBorrow: true };
    const moreCols = col < vm.maxLen - 1;
    let target = String(t);
    if (!moreCols && target === "0" && col > 0) target = "";
    return { target, moreCols };
  },

  _processAddSub(player) {
    const vm = player.vm, problem = player.problem, op = problem.op;
    const info = this._computeAddSub(vm, problem, vm.col);

    if (op === "-" && info.done) { player.correct(); return; }
    if (op === "-" && info.needsBorrow) return; // player must borrow first

    const { target, moreCols, nextCarry } = info;
    if (!target && !moreCols) { player.correct(); return; }

    if (player.inputBuffer.length !== target.length) return;
    if (MR.Game.sortedEquals(player.inputBuffer, target)) {
      vm.ansUnits = target + vm.ansUnits;
      if (op === "+") {
        vm.carries[vm.col + 1] = nextCarry;
        if (nextCarry > 0) vm.animCarryVal = 1.0;
      }
      vm.col += 1;
      MR.Sound.play("type");
      if (!moreCols) {
        player.correct();
      } else {
        const next = this._computeAddSub(vm, problem, vm.col);
        if (!next.done && !next.needsBorrow && !next.target && !next.moreCols) {
          player.correct();
        }
      }
    } else {
      player.wrong();
    }
    player.inputBuffer = [];
  },

  handleBorrowClick(player, pos) {
    const vm = player.vm;
    if (!(player.vModeOn && player.problem.op === "-")) return false;
    for (let c = 0; c < vm.borrowRects.length; c++) {
      const rect = vm.borrowRects[c];
      if (rect && MR.DrawUtils.hit(pos, rect)) {
        if (c > 0) {
          let canUndo = false;
          const hc = vm.topHistory[c], hc1 = vm.topHistory[c - 1];
          if (hc.length > 1 && hc1.length > 1) {
            if (hc[hc.length - 1] === hc[hc.length - 2] - 1) {
              if (hc1[hc1.length - 1] === hc1[hc1.length - 2] + 10) canUndo = true;
            }
          }
          if (canUndo) {
            hc.pop(); hc1.pop();
            MR.Sound.play("click");
          } else if (hc[hc.length - 1] > 0) {
            hc.push(hc[hc.length - 1] - 1);
            hc1.push(hc1[hc1.length - 1] + 10);
            vm.animBorrowVal = 1.0;
            MR.Sound.play("click");
          } else {
            player.shakeAmount = 10;
            MR.Sound.play("wrong");
          }
        }
        return true;
      }
    }
    return false;
  },

  // ---- multiplication -----------------------------------------------------

  _processMult(player) {
    const vm = player.vm, problem = player.problem;
    const { a, b } = problem;
    if (b < 10) this._processMultSingleDigit(player, a, b);
    else if (vm.stage === 0) this._processMultStage0(player, a, b);
    else if (vm.stage === 1) this._processMultStage1(player, a, b);
    else if (vm.stage === 2) this._processMultStage2(player);
  },

  _processMultSingleDigit(player, a, b) {
    const vm = player.vm, buf = player.inputBuffer;
    const moreCols = Math.floor(a / Math.pow(10, vm.col + 1)) > 0;
    const aDig = Math.floor(a / Math.pow(10, vm.col)) % 10;
    const t = aDig * b + vm.carry;
    const target = moreCols ? String(t % 10) : String(t);
    if (buf.length !== target.length) return;
    if (MR.Game.sortedEquals(buf, target)) {
      vm.ansUnits = target + vm.ansUnits;
      vm.carry = moreCols ? Math.floor(t / 10) : 0;
      if (vm.carry > 0) vm.animCarryVal = 1.0;
      vm.col += 1;
      MR.Sound.play("type");
      if (!moreCols) player.correct();
    } else {
      player.wrong();
    }
    player.inputBuffer = [];
  },

  _processMultStage0(player, a, b) {
    const vm = player.vm, buf = player.inputBuffer;
    const b0 = b % 10;
    const moreCols = Math.floor(a / Math.pow(10, vm.col + 1)) > 0;
    const aDig = Math.floor(a / Math.pow(10, vm.col)) % 10;
    const t = aDig * b0 + vm.carry;
    const target = moreCols ? String(t % 10) : String(t);
    if (buf.length !== target.length) return;
    if (MR.Game.sortedEquals(buf, target)) {
      vm.part1 = target + vm.part1;
      vm.carry = moreCols ? Math.floor(t / 10) : 0;
      if (vm.carry > 0) vm.animCarryVal = 1.0;
      vm.col += 1;
      MR.Sound.play("type");
      if (!moreCols) {
        vm.stage = 1; vm.col = 1; vm.carry = 0; vm.part2 = "0";
      }
    } else {
      player.wrong();
    }
    player.inputBuffer = [];
  },

  _processMultStage1(player, a, b) {
    const vm = player.vm, buf = player.inputBuffer;
    const b1 = Math.floor(b / 10);
    const actualCol = vm.col - 1;
    const moreCols = Math.floor(a / Math.pow(10, actualCol + 1)) > 0;
    const aDig = Math.floor(a / Math.pow(10, actualCol)) % 10;
    const t = aDig * b1 + vm.carry;
    const target = moreCols ? String(t % 10) : String(t);
    if (buf.length !== target.length) return;
    if (MR.Game.sortedEquals(buf, target)) {
      vm.part2 = target + vm.part2;
      vm.carry = moreCols ? Math.floor(t / 10) : 0;
      if (vm.carry > 0) vm.animCarryVal = 1.0;
      vm.col += 1;
      MR.Sound.play("type");
      if (!moreCols) {
        vm.stage = 2; vm.col = 0; vm.carry = 0; vm.sumAns = "";
      }
    } else {
      player.wrong();
    }
    player.inputBuffer = [];
  },

  _stage2Target(vm) {
    const p1 = vm.part1 ? parseInt(vm.part1, 10) : 0;
    const p2 = vm.part2 ? parseInt(vm.part2, 10) : 0;
    const moreCols = Math.floor(p1 / Math.pow(10, vm.col + 1)) > 0 || Math.floor(p2 / Math.pow(10, vm.col + 1)) > 0;
    const t = (Math.floor(p1 / Math.pow(10, vm.col)) % 10) + (Math.floor(p2 / Math.pow(10, vm.col)) % 10) + vm.carry;
    let target = moreCols ? String(t % 10) : String(t);
    if (target === "0" && !moreCols && vm.col > 0) target = "";
    return { target, moreCols, nextCarry: moreCols ? Math.floor(t / 10) : 0 };
  },

  _processMultStage2(player) {
    const vm = player.vm, buf = player.inputBuffer;
    const { target, moreCols, nextCarry } = this._stage2Target(vm);
    if (!target) { player.correct(); return; }
    if (buf.length !== target.length) return;
    if (MR.Game.sortedEquals(buf, target)) {
      vm.sumAns = target + vm.sumAns;
      vm.carry = nextCarry;
      if (vm.carry > 0) vm.animCarryVal = 1.0;
      vm.col += 1;
      MR.Sound.play("type");
      if (!moreCols) {
        player.correct();
      } else {
        const next = this._stage2Target(vm);
        if (!next.target) player.correct();
      }
    } else {
      player.wrong();
    }
    player.inputBuffer = [];
  },

  // ---- drawing --------------------------------------------------------------

  // The column layout below is scaled to whatever vertical band the panel
  // actually has available (player.layout, shared with the numpad sizing
  // in player-state.js) rather than fixed pixel constants -- the two-digit
  // multiplication case in particular (up to 7 stacked rows: operands,
  // two partial products, their sum) needs much more height than a simple
  // addition/subtraction column, and the split VERSUS half-width panel has
  // noticeably less room than a SINGLE-mode full-width one.
  draw(ctx, player, cx, cy) {
    const problem = player.problem;
    const layout = player.layout;
    const bandH = Math.max(110, layout.problemBottom - layout.problemTop);
    if (problem.op === "*" && problem.b >= 10) {
      const scale = Math.min(1, bandH / 480);
      this._drawTwoDigitMult(ctx, player, cx, scale, layout);
    } else {
      // Reference height = one borrow-headroom level (~47) + two number
      // rows + divider + answer row + cursor (~300) at scale 1.
      const scale = Math.min(1, bandH / 350);
      this._drawGeneric(ctx, player, cx, scale, layout);
    }
  },

  _drawDigitRow(ctx, str, rightX, charW, rowY, color, fontPx) {
    if (!str) return;
    const chars = str.split("").reverse();
    chars.forEach((ch, i) => {
      const colCenterX = rightX - i * charW - charW / 2;
      MR.RTL.draw(ctx, ch, colCenterX, rowY, { font: `700 ${fontPx}px ${MR.FONT_STACK}`, color });
    });
  },

  _divider(ctx, rightX, charW, span, y, theme) {
    ctx.save();
    ctx.strokeStyle = theme.text;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rightX - (span + 0.4) * charW, y);
    ctx.lineTo(rightX + 14, y);
    ctx.stroke();
    ctx.restore();
  },

  _cursor(ctx, rightX, charW, col, y, color) {
    const colCenterX = rightX - col * charW - charW / 2;
    MR.DrawUtils.fillRoundRect(ctx, colCenterX - (charW - 16) / 2, y, charW - 16, 8, 4, color);
  },

  _drawGeneric(ctx, player, cx, scale, layout) {
    const theme = MR.Store.getCurrTheme();
    const vm = player.vm;
    const { b, op } = player.problem;
    const maxLen = vm.maxLen;
    const bPad = String(b).padStart(maxLen, "0");

    const charW = 68 * scale, rowH = 86 * scale, histStep = 36 * scale;
    const rightX = cx + charW / 2 + 26 * scale;
    // Anchored from the top of the available band (like the two-digit-mult
    // layout) rather than centered: centering plus reserved borrow headroom
    // could push the divider/answer/cursor rows below past the numpad.
    // Reserves one comfortable borrow level of headroom above; a rare
    // multi-level borrow chain may climb higher than that, which is an
    // accepted tradeoff over guaranteeing the (much more common) case of
    // divider/answer/cursor never overlapping the numpad.
    const baseY = layout.problemTop + histStep * 1.3;

    vm.borrowRects = new Array(maxLen).fill(null);

    for (let c = 0; c < maxLen; c++) {
      const hist = vm.topHistory[c];
      const colCenterX = rightX - c * charW - charW / 2;
      for (let idx = 0; idx < hist.length; idx++) {
        const val = hist[idx];
        const isLatest = idx === hist.length - 1;
        let y = baseY - idx * histStep;
        let alpha = isLatest ? 1 : 0.4;
        const fontSize = (idx === 0 ? 58 : 38) * scale;
        const color = val >= 10 ? MR.Colors.GOLD : isLatest ? player.feedbackColor : theme.text;

        if (isLatest && idx > 0 && vm.animBorrowVal > 0) {
          const startY = baseY - (idx - 1) * histStep;
          y += (startY - y) * vm.animBorrowVal;
          alpha = 1 - vm.animBorrowVal;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        MR.RTL.draw(ctx, String(val), colCenterX, y, { font: `700 ${fontSize}px ${MR.FONT_STACK}`, color });
        ctx.restore();

        if (!isLatest) {
          ctx.save();
          ctx.strokeStyle = MR.Colors.RED;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(colCenterX - charW * 0.32, y + 10);
          ctx.lineTo(colCenterX + charW * 0.32, y - 10);
          ctx.stroke();
          ctx.restore();
        }
      }
      const stackTop = baseY - (hist.length - 1) * histStep - 36 * scale;
      vm.borrowRects[c] = { x: colCenterX - charW / 2, y: stackTop, w: charW, h: 72 * scale };
    }

    if (op === "+") {
      for (let c = 1; c <= maxLen + 1; c++) {
        if (vm.carries[c] > 0) {
          let y = baseY - 48 * scale;
          if (c === vm.col && vm.animCarryVal > 0) y += (baseY + rowH * 1.6 - y) * vm.animCarryVal;
          const colCenterX = rightX - c * charW - charW / 2;
          MR.RTL.draw(ctx, String(vm.carries[c]), colCenterX, y, { font: `700 ${30 * scale}px ${MR.FONT_STACK}`, color: MR.Colors.GOLD });
        }
      }
    } else if (op === "*" && vm.carry > 0) {
      let y = baseY - 48 * scale;
      if (vm.animCarryVal > 0) y += (baseY + rowH * 1.6 - y) * vm.animCarryVal;
      const colCenterX = rightX - vm.col * charW - charW / 2;
      MR.RTL.draw(ctx, String(vm.carry), colCenterX, y, { font: `700 ${30 * scale}px ${MR.FONT_STACK}`, color: MR.Colors.GOLD });
    }

    const bRowY = baseY + rowH;
    this._drawDigitRow(ctx, bPad, rightX, charW, bRowY, player.feedbackColor, 58 * scale);

    const opSymbol = op === "*" ? "×" : op;
    MR.RTL.draw(ctx, opSymbol, rightX - (maxLen + 0.7) * charW, bRowY, {
      font: `700 ${52 * scale}px ${MR.FONT_STACK}`, color: theme.highlight
    });

    const lineY = baseY + rowH * 2 + 14 * scale;
    this._divider(ctx, rightX, charW, maxLen, lineY, theme);

    this._drawDigitRow(ctx, vm.ansUnits, rightX, charW, lineY + 44 * scale, player.feedbackColor, 58 * scale);

    if (vm.col <= maxLen) this._cursor(ctx, rightX, charW, vm.col, lineY + 62 * scale, player.baseColor);
  },

  _drawTwoDigitMult(ctx, player, cx, scale, layout) {
    const theme = MR.Store.getCurrTheme();
    const vm = player.vm;
    const { a, b } = player.problem;
    const aStr = String(a), bStr = String(b);
    const maxLen = Math.max(aStr.length, bStr.length);

    const charW = 66 * scale, rowH = 82 * scale;
    const rightX = cx + charW / 2 + 24 * scale;
    // Anchored from the top of the available band and growing downward
    // (rather than centered on cy) since this is the tallest layout --
    // up to 7 stacked rows for a full two-digit x two-digit problem.
    const rowAY = layout.problemTop + rowH * 0.55;
    const rowBY = rowAY + rowH;
    const div1Y = rowBY + rowH * 0.85;
    const rowP1Y = div1Y + rowH * 0.75;
    const rowP2Y = rowP1Y + rowH;

    const feedback = player.feedbackColor;

    this._drawDigitRow(ctx, aStr, rightX, charW, rowAY, feedback, 56 * scale);
    this._drawDigitRow(ctx, bStr, rightX, charW, rowBY, feedback, 56 * scale);
    MR.RTL.draw(ctx, "×", rightX - (maxLen + 0.7) * charW, rowBY, {
      font: `700 ${50 * scale}px ${MR.FONT_STACK}`, color: theme.highlight
    });
    this._divider(ctx, rightX, charW, maxLen, div1Y, theme);

    this._drawDigitRow(ctx, vm.part1, rightX, charW, rowP1Y, feedback, 56 * scale);
    if (vm.stage === 0 && vm.col <= maxLen) this._cursor(ctx, rightX, charW, vm.col, rowP1Y + 38 * scale, player.baseColor);

    if (vm.stage >= 1) {
      this._drawDigitRow(ctx, vm.part2, rightX, charW, rowP2Y, feedback, 56 * scale);
      if (vm.stage === 1) this._cursor(ctx, rightX, charW, vm.col, rowP2Y + 38 * scale, player.baseColor);
    }

    if (vm.stage < 2 && vm.carry > 0) {
      const destY = vm.stage === 0 ? rowP1Y : rowP2Y;
      let y = rowAY - 46 * scale;
      if (vm.animCarryVal > 0) y += (destY - y) * vm.animCarryVal;
      const colCenterX = rightX - vm.col * charW - charW / 2;
      MR.RTL.draw(ctx, String(vm.carry), colCenterX, y, { font: `700 ${30 * scale}px ${MR.FONT_STACK}`, color: MR.Colors.GOLD });
    }

    if (vm.stage === 2) {
      const div2Y = rowP2Y + rowH * 0.85;
      const rowSumY = div2Y + rowH * 0.75;
      const span = Math.max(vm.part1.length, vm.part2.length, maxLen + 1);
      this._divider(ctx, rightX, charW, span, div2Y, theme);
      MR.RTL.draw(ctx, "+", rightX - (span + 0.3) * charW, (rowP1Y + rowP2Y) / 2, {
        font: `700 ${44 * scale}px ${MR.FONT_STACK}`, color: theme.highlight
      });
      this._drawDigitRow(ctx, vm.sumAns, rightX, charW, rowSumY + 44 * scale, feedback, 56 * scale);
      this._cursor(ctx, rightX, charW, vm.col, rowSumY + 62 * scale, player.baseColor);

      if (vm.carry > 0) {
        let y = div1Y - 8 * scale;
        if (vm.animCarryVal > 0) y += (rowSumY - y) * vm.animCarryVal;
        const colCenterX = rightX - vm.col * charW - charW / 2;
        MR.RTL.draw(ctx, String(vm.carry), colCenterX, y, { font: `700 ${30 * scale}px ${MR.FONT_STACK}`, color: MR.Colors.GOLD });
      }
    }
  }
};
