// Personal stats dashboard + rule-based personalized feedback text. The
// feedback logic is pure data/text (no ML), ported 1:1 from
// generate_feedback_lines() in the Python source.
MR.Screens = MR.Screens || {};

MR.Screens.Stats = {
  onEnter(app) {
    this.btnBack = new MR.UI.Button(MR.LOGICAL_W / 2 - 230, 656, 460, 70, "חזור לתפריט", { hover: MR.Colors.RED });
  },

  onPointerMove(app, pos) { this.btnBack.checkHover(pos); },
  onPointerDown(app, pos) { this.btnBack.onPointerDown(pos); },
  onPointerUp(app, pos) { if (this.btnBack.onPointerUp(pos)) app.goto("MENU"); },

  generateFeedbackLines() {
    const prof = MR.Store.getCurrProfile();
    const stats = prof.stats;
    const t = (k) => MR.I18N.t(k);

    if (stats.games_played === 0) {
      return [t("ברוך הבא לאזור האישי!"), t("שחק משחק אחד לפחות כדי שהמערכת"), t("תוכל לנתח את הביצועים שלך.")];
    }

    const ops = stats.ops;
    const totalC = Object.values(ops).reduce((s, d) => s + d.c, 0);
    const totalW = Object.values(ops).reduce((s, d) => s + d.w, 0);
    const totalAns = totalC + totalW;
    if (totalAns === 0) return [t("עדיין לא ענית על תרגילים."), t("כנס למשחק ונתחיל ללמוד!")];

    const overallAcc = (totalC / totalAns) * 100;
    const avgT = totalC > 0 ? stats.total_time / totalC : 0;

    const opAcc = {};
    for (const op of Object.keys(ops)) {
      const d = ops[op];
      if (d.c + d.w >= 3) opAcc[op] = (d.c / (d.c + d.w)) * 100;
    }
    const opHeb = { "+": t("חיבור"), "-": t("חיסור"), "*": t("כפל"), "/": t("חילוק") };
    const lines = [];

    if (overallAcc >= 90) lines.push(t("איזה יופי! הביצועים שלך פשוט יוצאים מן הכלל."));
    else if (overallAcc >= 70) lines.push(t("עבודה טובה מאוד! אתה לגמרי בדרך הנכונה."));
    else lines.push(t("אני רואה שאתה מתאמץ, וזה הכי חשוב! מטעויות לומדים."));

    if (avgT > 0) {
      if (avgT < 3.5 && overallAcc < 70) {
        lines.push(t("טיפ חם: אתה עונה נורא מהר. נסה להאט קצת,"));
        lines.push(t("תיעזר בתצוגת המאונך, והדיוק שלך יזנק!"));
      } else if (avgT > 10.0 && overallAcc > 80) {
        lines.push(t("אתה מחשב מאוד מדויק ונכון! עם הזמן והתרגול,"));
        lines.push(t("המהירות שלך תשתפר באופן טבעי."));
      } else if (avgT < 4.0 && overallAcc > 85) {
        lines.push(t("מדהים: אתה מחשב גם מהר כמו ברק וגם במדויק!"));
      }
    }

    const opKeys = Object.keys(opAcc);
    if (opKeys.length) {
      const bestOp = opKeys.reduce((a, b) => (opAcc[a] >= opAcc[b] ? a : b));
      const worstOp = opKeys.reduce((a, b) => (opAcc[a] <= opAcc[b] ? a : b));
      if (opAcc[bestOp] >= 85) lines.push(t("נקודת החוזק שלך: פעולות ") + opHeb[bestOp] + t(". אתה שולט בזה!"));
      if (opAcc[worstOp] <= 65 && worstOp !== bestOp) {
        lines.push(t("נקודה לשיפור: ראינו שקצת קשה לך בתרגילי ") + opHeb[worstOp] + t("."));
        lines.push(t("המלצה: כנס להגדרות ובחר רק '") + opHeb[worstOp] + t("' לאימון ממוקד."));
      }
    }

    if (overallAcc >= 90 && avgT <= 5.0 && totalAns > 20) {
      lines.push(t("★ המלצת המערכת: אתה מוכן לאתגר הבא שלך!"));
      lines.push(t("   גש להגדרות והגדל את ה'תוצאה המקסימלית'."));
    }
    return lines;
  },

  render(app, ctx) {
    const theme = MR.Store.getCurrTheme();
    const cx = MR.LOGICAL_W / 2;
    const isEn = MR.I18N.isEn();

    MR.RTL.drawGradientHeadline(ctx, MR.I18N.t("אזור אישי וניתוח חכם"), cx, 44, {
      font: `800 38px ${MR.FONT_STACK}`, color: theme.highlight, gradient: theme.titleGrad
    });

    const prof = MR.Store.getCurrProfile();
    const stats = prof.stats;
    const ops = stats.ops;
    const totalC = Object.values(ops).reduce((s, d) => s + d.c, 0);
    const totalW = Object.values(ops).reduce((s, d) => s + d.w, 0);
    const totalAns = totalC + totalW;
    const acc = totalAns > 0 ? Math.round((totalC / totalAns) * 100) : 0;
    const avgT = totalC > 0 ? Math.round((stats.total_time / totalC) * 10) / 10 : 0;

    const genRect = { x: cx - 720, y: 84, w: 1440, h: 92 };
    MR.DrawUtils.panel(ctx, genRect.x, genRect.y, genRect.w, genRect.h, 16, theme);
    const t1 = isEn ? `Games Played: ${stats.games_played}` : `משחקים: ${stats.games_played}`;
    const t3 = isEn ? `Average Time: ${avgT} sec` : `ממוצע: ${avgT} שניות לתרגיל`;
    const t2 = isEn ? `Overall Accuracy: ${acc}%` : `דיוק כללי: ${acc}%`;
    const accCol = acc >= 80 ? MR.Colors.GREEN : acc >= 60 ? theme.highlight : MR.Colors.RED;

    // t1 sits at the "start" edge (right for Hebrew/RTL, left for English)
    // and t3 at the "end" edge -- the anchor x and the align keyword must
    // point the same direction or the text grows off the opposite edge.
    const startX = isEn ? genRect.x + 28 : genRect.x + genRect.w - 28;
    const endX = isEn ? genRect.x + genRect.w - 28 : genRect.x + 28;
    MR.RTL.draw(ctx, t1, startX, genRect.y + 26, { font: `700 22px ${MR.FONT_STACK}`, color: theme.text, align: isEn ? "left" : "right" });
    MR.RTL.draw(ctx, t3, endX, genRect.y + 26, { font: `700 22px ${MR.FONT_STACK}`, color: theme.text, align: isEn ? "right" : "left" });
    MR.RTL.draw(ctx, t2, cx, genRect.y + 62, { font: `800 30px ${MR.FONT_STACK}`, color: accCol });

    const opsRect = { x: cx - 720, y: 190, w: 1440, h: 114 };
    MR.DrawUtils.panel(ctx, opsRect.x, opsRect.y, opsRect.w, opsRect.h, 16, theme);
    MR.RTL.draw(ctx, MR.I18N.t("הדיוק שלך לפי סוגי פעולות:"), cx, opsRect.y + 24, { font: `700 20px ${MR.FONT_STACK}`, color: theme.text });
    const opNames = { "+": "חיבור", "-": "חיסור", "*": "כפל", "/": "חילוק" };
    ["+", "-", "*", "/"].forEach((op, i) => {
      const c = ops[op].c, w = ops[op].w, tot = c + w;
      const opAccPct = tot > 0 ? Math.round((c / tot) * 100) : 0;
      const col = tot === 0 ? MR.Colors.LIGHT_GRAY : opAccPct >= 80 ? MR.Colors.GREEN : opAccPct >= 60 ? theme.highlight : MR.Colors.RED;
      const txt = `${MR.I18N.t(opNames[op])}: ${opAccPct}%`;
      const row = Math.floor(i / 2), colIdx = i % 2;
      const x = opsRect.x + 360 + colIdx * 720;
      const y = opsRect.y + 62 + row * 42;
      MR.RTL.draw(ctx, txt, x, y, { font: `700 24px ${MR.FONT_STACK}`, color: col });
    });

    const lines = this.generateFeedbackLines();
    const aiTop = 320;
    const aiMaxH = 656 - aiTop - 14;
    const aiRect = { x: cx - 720, y: aiTop, w: 1440, h: aiMaxH };
    MR.DrawUtils.panel(ctx, aiRect.x, aiRect.y, aiRect.w, aiRect.h, 16, theme, { border: theme.highlight, borderWidth: 4 });
    MR.RTL.draw(ctx, MR.I18N.t("💡 ניתוח המערכת (המלצות אישיות):"), cx, aiRect.y + 28, {
      font: `700 24px ${MR.FONT_STACK}`, color: theme.highlight
    });

    const lineStep = Math.max(24, Math.min(34, (aiMaxH - 60) / Math.max(1, lines.length)));
    let sy = aiRect.y + 62;
    lines.forEach((line) => {
      let col = theme.text;
      if (line.includes("★")) col = MR.Colors.GOLD;
      if (line.includes(MR.I18N.t("מדהים")) || line.includes(MR.I18N.t("איזה יופי")) || line.includes(MR.I18N.t("נקודת החוזק"))) col = MR.Colors.GREEN;
      if (line.includes(MR.I18N.t("נקודה לשיפור")) || line.includes(MR.I18N.t("טיפ חם"))) col = MR.Colors.RED;
      MR.RTL.draw(ctx, line, cx, sy, { font: `700 ${Math.round(lineStep * 0.68)}px ${MR.FONT_STACK}`, color: col });
      sy += lineStep;
    });

    this.btnBack.draw(ctx);
  }
};
