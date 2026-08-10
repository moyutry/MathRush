// One PlayerState per player (SINGLE = one full-width instance, VERSUS =
// two side-by-side halves). Ported from the Python PlayerState: problem
// generation, quick-answer digit-order-agnostic matching, scoring/combo,
// feedback shake/flash, particles, and the on-screen numpad. Vertical-math
// input/drawing is delegated to MR.Game.VerticalMath.
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

MR.Game.PlayerState = class PlayerState {
  constructor(rect, baseColor, profileName) {
    this.rect = rect;
    this.baseColor = baseColor;
    this.profileName = profileName;
    this.particles = [];
    this.seenProblems = new Set();

    const prof = MR.Store.saveData.profiles[profileName] || MR.Defaults.getDefaultProfile();
    this.settingVMath = !!prof.settings.vertical_math;
    this.settingVisual = !!prof.settings.visual_mode;
    this.vModeOn = this.settingVMath;
    this.toggleRect = null;

    this.computeLayout();
    this.buildNumpad();
    this.reset();
  }

  updateRect(rect) {
    this.rect = rect;
    this.computeLayout();
    this.buildNumpad();
  }

  // Single source of truth for the panel's vertical bands, so the problem
  // number and the on-screen numpad are guaranteed never to overlap --
  // previously each was positioned by its own independent formula, and on
  // the split VERSUS-mode half-width panel the numpad silently grew tall
  // enough to be drawn directly on top of (and completely hide) the
  // problem text.
  computeLayout() {
    const margin = 16;
    const innerTop = this.rect.y + margin;
    const innerH = this.rect.h - margin * 2;
    const headerH = 100; // name + score + combo
    const numpadBottomMargin = 24;
    const problemGap = 10;
    const minProblemH = 140;
    const rows = 2, cols = 5, gap = 14;

    const maxUnitByWidth = (this.rect.w - 80 - (cols - 1) * gap) / cols;
    let unit = Math.min(126, maxUnitByWidth);
    const available = innerH - headerH - numpadBottomMargin - problemGap;

    let totalNumpadH = rows * unit + (rows - 1) * gap;
    while (totalNumpadH + minProblemH > available && unit > 54) {
      unit -= 2;
      totalNumpadH = rows * unit + (rows - 1) * gap;
    }
    unit = Math.max(54, unit);
    totalNumpadH = rows * unit + (rows - 1) * gap;

    const numpadTop = innerTop + innerH - numpadBottomMargin - totalNumpadH;
    const problemTop = innerTop + headerH;
    const problemBottom = numpadTop - problemGap;

    this.layout = {
      unit, gap, numpadTop, totalNumpadH,
      problemTop, problemBottom,
      problemCenterY: (problemTop + problemBottom) / 2,
      cx: this.rect.x + this.rect.w / 2
    };
  }

  buildNumpad() {
    const { unit, gap, numpadTop, cx } = this.layout;
    const rows = MR.UI.Numpad.digitsOnlyRows();
    this.numpad = new MR.UI.Numpad(cx, numpadTop, rows, { unit, gap, height: unit, fontSize: Math.round(unit * 0.34) });
  }

  checkHover(pos) {
    this.numpad.checkHover(pos);
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.inputBuffer = [];
    this.lastInputTime = 0;
    this.problem = this.generateProblem();
    this.feedbackColor = MR.Store.getCurrTheme().text;
    this.feedbackTimer = 0;
    this.shakeAmount = 0;
    MR.Game.VerticalMath.resetState(this);
  }

  spawnParticles() {
    const cx = this.rect.x + this.rect.w / 2;
    const cy = this.rect.y + this.rect.h / 2;
    for (let i = 0; i < 24; i++) this.particles.push(new MR.Particle(cx, cy, this.baseColor));
  }

  generateProblem() {
    const prof = MR.Store.saveData.profiles[this.profileName] || MR.Defaults.getDefaultProfile();
    const s = prof.settings;
    const ops = s.active_ops && s.active_ops.length ? s.active_ops : ["+"];
    const op = ops[randInt(0, ops.length - 1)];
    const maxN = s.max_num || 20;

    for (let attempt = 0; attempt < 100; attempt++) {
      let a, b, ans, displayOp;

      if (op === "+") {
        ans = randInt(2, maxN);
        a = randInt(1, ans - 1);
        b = ans - a;
        displayOp = "+";
      } else if (op === "-") {
        a = randInt(2, maxN);
        b = randInt(1, a - 1);
        ans = a - b;
        displayOp = "-";
      } else if (op === "*") {
        const f1 = s.mult_f1 || 10, f2 = s.mult_f2 || 10;
        const pairs = [];
        for (let x = 2; x <= f1; x++) for (let y = 2; y <= f2; y++) if (x * y <= 9999) pairs.push([x, y]);
        if (!pairs.length) { a = 1; b = 1; } else { [a, b] = pairs[randInt(0, pairs.length - 1)]; }
        if (a < b) { const tmp = a; a = b; b = tmp; }
        ans = a * b;
        displayOp = "×";
      } else {
        const f1 = s.div_f1 || 10, f2 = s.div_f2 || 10;
        const pairs = [];
        for (let x = 2; x <= f1; x++) for (let y = 2; y <= f2; y++) if (x * y <= 9999) pairs.push([x * y, x]);
        if (!pairs.length) { a = 4; b = 2; } else { [a, b] = pairs[randInt(0, pairs.length - 1)]; }
        ans = Math.floor(a / b);
        displayOp = "÷";
      }

      const key = `${a}${op}${b}`;
      if (!this.seenProblems.has(key)) {
        this.seenProblems.add(key);
        return { q: `${a} ${displayOp} ${b}`, ans: String(ans), a, b, op };
      }
    }
    this.seenProblems.clear();
    return this.generateProblem();
  }

  onPointerDown(pos) {
    this.numpad.onPointerDown(pos);

    const needsVert = MR.Game.VerticalMath.needsVertical(this.problem);
    if (this.settingVMath && this.toggleRect && MR.DrawUtils.hit(pos, this.toggleRect) && needsVert) {
      this.vModeOn = !this.vModeOn;
      this.inputBuffer = [];
      MR.Game.VerticalMath.resetState(this);
      MR.Sound.play("click");
      return true;
    }

    if (this.vModeOn && this.problem.op === "-") {
      if (MR.Game.VerticalMath.handleBorrowClick(this, pos)) return true;
    }
    return false;
  }

  onPointerUp(pos) {
    const key = this.numpad.onPointerUp(pos);
    if (key) {
      this.handleKey(key);
      return true;
    }
    return false;
  }

  handleKey(keyStr) {
    const now = performance.now() / 1000;
    if (now - this.lastInputTime > 1.5) this.inputBuffer = [];
    this.inputBuffer.push(keyStr);
    this.lastInputTime = now;

    const needsVertical = MR.Game.VerticalMath.needsVertical(this.problem);
    if (this.vModeOn && needsVertical) {
      MR.Game.VerticalMath.processInput(this);
      return;
    }

    const target = this.problem.ans;
    if (target.length === 1) {
      if (this.inputBuffer[0] === target) this.correct(); else this.wrong();
      this.inputBuffer = [];
    } else if (this.inputBuffer.length === target.length) {
      if (MR.Game.sortedEquals(this.inputBuffer, target)) this.correct(); else this.wrong();
      this.inputBuffer = [];
    }
  }

  correct() {
    MR.Sound.play("correct");
    this.spawnParticles();
    this.score += 1;
    this.combo += 1;
    this.feedbackColor = MR.Colors.GREEN;
    this.feedbackTimer = 0.3;
    const prof = MR.Store.saveData.profiles[this.profileName];
    if (prof) prof.stats.ops[this.problem.op].c += 1;
    this.problem = this.generateProblem();
    MR.Game.VerticalMath.resetState(this);
  }

  wrong() {
    MR.Sound.play("wrong");
    this.combo = 0;
    this.feedbackColor = MR.Colors.RED;
    this.feedbackTimer = 0.3;
    this.shakeAmount = 15;
    const prof = MR.Store.saveData.profiles[this.profileName];
    if (prof) prof.stats.ops[this.problem.op].w += 1;
  }

  update(dt) {
    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= dt;
      if (this.shakeAmount > 0) this.shakeAmount = Math.max(0, this.shakeAmount - dt * 50);
    } else {
      this.feedbackColor = MR.Store.getCurrTheme().text;
      this.shakeAmount = 0;
    }
    MR.Game.VerticalMath.updateAnim(this.vm, dt);
    this.particles = this.particles.filter((p) => { p.update(); return p.life > 0; });
  }

  draw(ctx, hideProblem) {
    const theme = MR.Store.getCurrTheme();
    const margin = 16;
    const pRect = {
      x: this.rect.x + margin, y: this.rect.y + margin,
      w: this.rect.w - margin * 2, h: this.rect.h - margin * 2
    };
    MR.DrawUtils.panel(ctx, pRect.x, pRect.y, pRect.w, pRect.h, 26, theme, {
      fill: theme.bg, border: this.baseColor, borderWidth: 5
    });

    const needsVert = MR.Game.VerticalMath.needsVertical(this.problem);
    if (this.settingVMath && needsVert) {
      const toggleW = 64, toggleH = 32;
      const tx = pRect.x + pRect.w - toggleW - 26;
      const ty = pRect.y + 24;
      this.toggleRect = { x: tx, y: ty, w: toggleW, h: toggleH };
      MR.DrawUtils.fillRoundRect(ctx, tx, ty, toggleW, toggleH, 16, this.vModeOn ? MR.Colors.GREEN : MR.Colors.GRAY);
      const knobX = this.vModeOn ? tx + toggleW - 16 : tx + 16;
      ctx.beginPath();
      ctx.fillStyle = MR.Colors.WHITE;
      ctx.arc(knobX, ty + toggleH / 2, 13, 0, Math.PI * 2);
      ctx.fill();
      MR.RTL.draw(ctx, MR.I18N.t("פתירה במאונך:"), tx - 14, ty + toggleH / 2, {
        font: `700 20px ${MR.FONT_STACK}`, color: theme.text, align: "right"
      });
    } else {
      this.toggleRect = null;
    }

    const displayName = this.profileName === "אורח" ? MR.I18N.t("אורח") : this.profileName;
    MR.RTL.draw(ctx, displayName, pRect.x + pRect.w / 2, pRect.y + 32, {
      font: `700 30px ${MR.FONT_STACK}`, color: this.baseColor
    });

    MR.RTL.draw(ctx, String(this.score), pRect.x + 54, pRect.y + 32, {
      font: `800 44px ${MR.FONT_STACK}`, color: theme.text, align: "center"
    });
    const comboColor = this.combo > 2 ? MR.Colors.GREEN : MR.Colors.LIGHT_GRAY;
    MR.RTL.draw(ctx, MR.I18N.t("רצף x") + this.combo, pRect.x + 70, pRect.y + 84, {
      font: `700 24px ${MR.FONT_STACK}`, color: comboColor, align: "center"
    });

    if (!hideProblem) {
      const shakeX = this.shakeAmount > 0 ? (Math.random() * 2 - 1) * this.shakeAmount : 0;
      const cx = this.layout.cx + shakeX;
      const cy = this.layout.problemCenterY;

      if (this.vModeOn && needsVert) {
        MR.Game.VerticalMath.draw(ctx, this, cx, cy);
      } else {
        const fontPx = Math.min(80, Math.max(48, (this.layout.problemBottom - this.layout.problemTop) * 0.5));
        MR.RTL.draw(ctx, this.problem.q, cx, cy - fontPx * 0.28, {
          font: `800 ${Math.round(fontPx)}px ${MR.FONT_STACK}`, color: this.feedbackColor
        });

        if (this.settingVisual) MR.Game.VisualCounters.draw(ctx, this, cx, cy);

        const ansLen = this.problem.ans.length;
        const slotW = 54, slotH = 12, spacing = 16;
        const totalW = ansLen * slotW + (ansLen - 1) * spacing;
        const startX = cx - totalW / 2;
        const slotY = this.layout.problemBottom - slotH - 12;
        for (let i = 0; i < ansLen; i++) {
          const color = i < this.inputBuffer.length ? this.baseColor : theme.border;
          MR.DrawUtils.fillRoundRect(ctx, startX + i * (slotW + spacing), slotY, slotW, slotH, 5, color);
        }
      }
    }

    this.particles.forEach((p) => p.draw(ctx));

    if (!hideProblem) this.numpad.draw(ctx);
  }
};
