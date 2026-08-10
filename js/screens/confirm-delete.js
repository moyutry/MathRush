// Delete-profile confirmation modal.
MR.Screens = MR.Screens || {};

MR.Screens.ConfirmDelete = {
  onEnter(app) {
    const cx = MR.LOGICAL_W / 2, cy = MR.LOGICAL_H / 2;
    this.btnYes = new MR.UI.Button(cx - 340, cy + 50, 320, 96, "כן, מחק", { hover: MR.Colors.RED });
    this.btnNo = new MR.UI.Button(cx + 20, cy + 50, 320, 96, "ביטול", { hover: MR.Colors.LIGHT_GRAY });
  },

  onPointerMove(app, pos) { this.btnYes.checkHover(pos); this.btnNo.checkHover(pos); },
  onPointerDown(app, pos) { this.btnYes.onPointerDown(pos); this.btnNo.onPointerDown(pos); },

  onPointerUp(app, pos) {
    if (this.btnYes.onPointerUp(pos)) {
      delete MR.Store.saveData.profiles[app.profileToDelete];
      if (MR.Store.currentUser === app.profileToDelete) {
        MR.Store.setCurrentUser(Object.keys(MR.Store.saveData.profiles)[0]);
      }
      MR.Store.save();
      app.goto("PROFILES");
      return;
    }
    if (this.btnNo.onPointerUp(pos)) app.goto("PROFILES");
  },

  render(app, ctx) {
    const cx = MR.LOGICAL_W / 2, cy = MR.LOGICAL_H / 2;
    const msg = MR.I18N.t("האם למחוק את '") + app.profileToDelete + MR.I18N.t("'?");
    MR.RTL.draw(ctx, msg, cx, cy - 60, { font: `700 40px ${MR.FONT_STACK}`, color: MR.Colors.RED });
    this.btnYes.draw(ctx);
    this.btnNo.draw(ctx);
  }
};
