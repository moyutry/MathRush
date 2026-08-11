// Top-level state machine. Ported from the Python GameApp, but split into
// one module per screen (js/screens/*.js) instead of one ~700-line run()
// loop -- keeps the vertical-math-heavy gameplay screen isolated from
// menu/settings/profile bookkeeping.
//
// Bug fix vs. the Python source: there, the in-game back button and the
// timer-expiry path both called a method named self.end_game(), but the
// method was actually defined as a_endgame() -- a real AttributeError on
// two of the most common ways a round ends. It "worked" in practice only
// because the ESC-key shortcut took a separate, cruder path that skipped
// saving stats/XP/streak entirely. Here there is exactly one endGame(),
// and every exit path (back button, timer running out, ESC) calls it.
MR.GameApp = {
  state: "INTRO",
  introTimer: 0,
  time: 0,
  gameMode: "",
  players: [],
  timeLeft: 0,
  endMsg: "",
  p2Name: "אורח",
  textInputMode: "",
  currentInputText: "",
  profileToEdit: "",
  profileToDelete: "",
  countdownTimer: 0,
  screens: {},

  init() {
    this.screens = {
      INTRO: MR.Screens.Intro,
      PROFILES: MR.Screens.Profiles,
      CONFIRM_DELETE: MR.Screens.ConfirmDelete,
      TEXT_INPUT: MR.Screens.TextInput,
      MENU: MR.Screens.Menu,
      SETTINGS: MR.Screens.Settings,
      VS_SETUP: MR.Screens.VsSetup,
      COUNTDOWN: MR.Screens.Countdown,
      SINGLE: MR.Screens.Gameplay,
      VERSUS: MR.Screens.Gameplay,
      OVER: MR.Screens.Over,
      STATS: MR.Screens.Stats,
      BATTLEPASS: MR.Screens.Battlepass
    };
    this.state = "INTRO";
    this.introTimer = 0;
  },

  goto(state) {
    this.state = state;
    const screen = this.screens[state];
    if (screen && screen.onEnter) screen.onEnter(this);
  },

  update(dt) {
    this.time += dt;
    const screen = this.screens[this.state];
    if (screen && screen.update) screen.update(this, dt);
  },

  render(ctx) {
    const theme = MR.Store.getCurrTheme();
    const bgFill = MR.DrawUtils.linearGradient(ctx, 0, 0, MR.LOGICAL_W, MR.LOGICAL_H, theme.bgGrad || [theme.bg, theme.bg], true);
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, MR.LOGICAL_W, MR.LOGICAL_H);

    // Two slow-drifting soft color blobs behind everything -- a cheap
    // "aurora" ambient-glow effect that's the biggest single contributor to
    // the futuristic feel, since it's visible behind every panel on every
    // screen without any call site needing to know about it.
    if (theme.glowAccent) {
      const t = this.time;
      const [c1, c2] = theme.glowAccent;
      MR.DrawUtils.glowBlob(ctx, MR.LOGICAL_W * 0.16 + Math.sin(t * 0.15) * 50, MR.LOGICAL_H * 0.25 + Math.cos(t * 0.11) * 36, 300, c1);
      MR.DrawUtils.glowBlob(ctx, MR.LOGICAL_W * 0.84 + Math.cos(t * 0.13) * 50, MR.LOGICAL_H * 0.78 + Math.sin(t * 0.17) * 36, 300, c2);
    }

    // subtle vignette for depth -- part of the "futuristic" visual pass.
    const vignette = ctx.createRadialGradient(
      MR.LOGICAL_W / 2, MR.LOGICAL_H / 2, MR.LOGICAL_H * 0.15,
      MR.LOGICAL_W / 2, MR.LOGICAL_H / 2, MR.LOGICAL_W * 0.7
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.14)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, MR.LOGICAL_W, MR.LOGICAL_H);

    const screen = this.screens[this.state];
    if (screen && screen.render) screen.render(this, ctx);
  },

  onPointerDown(pos) {
    const screen = this.screens[this.state];
    if (screen && screen.onPointerDown) screen.onPointerDown(this, pos);
  },

  onPointerMove(pos) {
    const screen = this.screens[this.state];
    if (screen && screen.onPointerMove) screen.onPointerMove(this, pos);
  },

  onPointerUp(pos) {
    const screen = this.screens[this.state];
    if (screen && screen.onPointerUp) screen.onPointerUp(this, pos);
  },

  onKeyDown(e) {
    const screen = this.screens[this.state];
    if (screen && screen.onKeyDown) screen.onKeyDown(this, e);

    if (e.key === "Escape") {
      if (["SETTINGS", "PROFILES", "VS_SETUP", "BATTLEPASS", "STATS"].includes(this.state)) {
        MR.Store.save();
        this.goto("MENU");
      } else if (["SINGLE", "VERSUS", "COUNTDOWN"].includes(this.state)) {
        this.endGame();
      }
    }
  },

  startGame(mode) {
    this.gameMode = mode;

    if (mode === "VERSUS") {
      const guestNames = ["אורח", "Guest", MR.I18N.t("אורח")];
      if (guestNames.includes(this.p2Name)) {
        const p1Settings = MR.Store.saveData.profiles[MR.Store.currentUser].settings;
        MR.Store.saveData.profiles[this.p2Name] = MR.Defaults.getDefaultProfile();
        MR.Store.saveData.profiles[this.p2Name].settings = JSON.parse(JSON.stringify(p1Settings));
      }
    }

    const tSet = MR.Store.getCurrProfile().settings.time;
    this.timeLeft = tSet > 0 ? tSet : Infinity;

    const theme = MR.Store.getCurrTheme();
    if (mode === "SINGLE") {
      this.players = [
        new MR.Game.PlayerState({ x: 0, y: 0, w: MR.LOGICAL_W, h: MR.LOGICAL_H }, theme.player1, MR.Store.currentUser)
      ];
    } else {
      const half = MR.LOGICAL_W / 2;
      this.players = [
        new MR.Game.PlayerState({ x: 0, y: 0, w: half, h: MR.LOGICAL_H }, theme.player1, MR.Store.currentUser),
        new MR.Game.PlayerState({ x: half, y: 0, w: half, h: MR.LOGICAL_H }, theme.player2, this.p2Name)
      ];
    }

    // Countdown borrows Gameplay's renderPlayersAndBar (for the back
    // button + timer bar) before ever transitioning into the SINGLE/VERSUS
    // state itself, so Gameplay's own onEnter (which builds the back
    // button) must run up front here rather than waiting for its turn.
    MR.Screens.Gameplay.onEnter(this);
    this.goto("COUNTDOWN");
  },

  endGame() {
    this.timeLeft = 0;

    this.players.forEach((p) => {
      const prof = MR.Store.saveData.profiles[p.profileName];
      if (prof) {
        prof.stats.games_played += 1;
        MR.Store.processStreak(prof);
      }
    });

    if (this.players.length === 1) {
      const p1 = this.players[0];
      const prof = MR.Store.saveData.profiles[p1.profileName];
      if (prof && p1.score > prof.high_score_single) prof.high_score_single = p1.score;
      this.endMsg = MR.Store.addXp(p1.score * 15, p1.profileName);
    } else {
      this.players.forEach((p) => {
        const prof = MR.Store.saveData.profiles[p.profileName];
        if (prof && p.score > prof.high_score_single) prof.high_score_single = p.score;
      });
      const msg1 = MR.Store.addXp(this.players[0].score * 10, this.players[0].profileName);
      const msg2 = MR.Store.addXp(this.players[1].score * 10, this.players[1].profileName);
      this.endMsg = msg1 + (msg2 ? " | " + msg2 : "");
    }

    MR.Store.save();
    // Guest opponents are written into the live saveData.profiles object
    // (see startGame) so PlayerState/addXp can treat them like any other
    // profile for the match; strip them back out now so PROFILES/VS_SETUP
    // never list "Guest" as a real, persistent player.
    delete MR.Store.saveData.profiles["אורח"];
    delete MR.Store.saveData.profiles["Guest"];
    this.goto("OVER");
  }
};
