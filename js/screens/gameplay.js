// Live SINGLE/VERSUS gameplay. Shared by the Python source's "SINGLE" and
// "VERSUS" states (both map to this one module in GameApp.screens) plus
// reused by the Countdown screen (players visible, problem hidden).
MR.Screens = MR.Screens || {};

MR.Screens.Gameplay = {
  onEnter(app) {
    // Bottom-left, next to the timer bar: a top corner would sit right on
    // top of the score readout (single) or player 1's score (versus), and
    // is also a harder thumb-reach than the bottom edge on a wide phone.
    this.btnBack = new MR.UI.Button(20, MR.LOGICAL_H - 60, 160, 56, "חזור", { hover: MR.Colors.RED, fontSize: 24 });
  },

  onPointerMove(app, pos) {
    this.btnBack.checkHover(pos);
    app.players.forEach((p) => p.checkHover(pos));
  },

  onPointerDown(app, pos) {
    this.btnBack.onPointerDown(pos);
    app.players.forEach((p) => p.onPointerDown(pos));
  },

  onPointerUp(app, pos) {
    if (this.btnBack.onPointerUp(pos)) { app.endGame(); return; }
    app.players.forEach((p) => p.onPointerUp(pos));
  },

  onKeyDown(app, e) {
    if (e.key >= "0" && e.key <= "9") {
      app.players.forEach((p) => { if (p.inputBuffer.length < 4) p.handleKey(e.key); });
    }
  },

  update(app, dt) {
    const tSet = MR.Store.getCurrProfile().settings.time;
    app.players.forEach((p) => {
      const prof = MR.Store.saveData.profiles[p.profileName];
      if (prof) prof.stats.total_time += dt;
    });
    if (tSet > 0) {
      app.timeLeft -= dt;
      if (app.timeLeft <= 0) { app.endGame(); return; }
    }
    app.players.forEach((p) => p.update(dt));
  },

  render(app, ctx) {
    this.renderPlayersAndBar(app, ctx, false);
  },

  // hideProblem=true is used by the Countdown screen to show the player
  // panels/numpads before the round actually starts.
  renderPlayersAndBar(app, ctx, hideProblem) {
    const theme = MR.Store.getCurrTheme();
    app.players.forEach((p) => p.draw(ctx, hideProblem));

    if (app.gameMode === "VERSUS") {
      ctx.save();
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(MR.LOGICAL_W / 2, 0);
      ctx.lineTo(MR.LOGICAL_W / 2, MR.LOGICAL_H);
      ctx.stroke();
      ctx.restore();
    }

    const tSet = MR.Store.getCurrProfile().settings.time;
    const barW = MR.LOGICAL_W * 0.55, barH = 32;
    const barX = MR.LOGICAL_W / 2 - barW / 2, barY = MR.LOGICAL_H - 48;
    MR.DrawUtils.panel(ctx, barX, barY, barW, barH, 16, theme);

    if (tSet > 0) {
      const timeVal = hideProblem ? tSet : Math.max(0, app.timeLeft);
      const timeColor = timeVal < 10 ? MR.Colors.RED : MR.Colors.GREEN;
      const w = Math.max(0, Math.round((barW - 4) * (timeVal / tSet)));
      if (w > 0) {
        const grad = MR.DrawUtils.autoGradient(ctx, barX + 2, barY + 2, w, barH - 4, timeColor);
        MR.DrawUtils.fillRoundRect(ctx, barX + 2, barY + 2, w, barH - 4, 13, grad);
      }
      if (!hideProblem) {
        MR.RTL.draw(ctx, String(Math.ceil(app.timeLeft)), MR.LOGICAL_W / 2, barY + barH / 2 + 1, {
          font: `700 22px ${MR.FONT_STACK}`, color: theme.text
        });
      }
    } else {
      const grad = MR.DrawUtils.autoGradient(ctx, barX + 2, barY + 2, barW - 4, barH - 4, MR.Colors.GREEN);
      MR.DrawUtils.fillRoundRect(ctx, barX + 2, barY + 2, barW - 4, barH - 4, 13, grad);
      MR.RTL.draw(ctx, MR.I18N.t("ללא זמן"), MR.LOGICAL_W / 2, barY + barH / 2 + 1, {
        font: `700 22px ${MR.FONT_STACK}`, color: MR.Colors.WHITE
      });
    }

    this.btnBack.draw(ctx);
  }
};
