// Persistence layer: localStorage replaces the Python source's JSON-file
// save. Mirrors load_save()/save_game()/process_streak()/add_xp() from
// main.py, including the defensive back-fill of any keys missing from an
// older save shape.
MR.Store = {
  KEY: "mathrush_save_v1",
  saveData: null,
  currentUser: null,

  todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  },

  // Returns integer day difference (b - a), or NaN if either date is invalid.
  daysBetween(isoA, isoB) {
    const a = new Date(isoA + "T00:00:00");
    const b = new Date(isoB + "T00:00:00");
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return NaN;
    return Math.round((b - a) / 86400000);
  },

  load() {
    let data = null;
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      data = null;
    }

    if (!data || !data.profiles) {
      data = MR.Defaults.defaultSave();
    } else {
      for (const name of Object.keys(data.profiles)) {
        const p = data.profiles[name];
        const def = MR.Defaults.getDefaultProfile();
        if (!p.stats) p.stats = def.stats;
        if (!p.stats.ops) p.stats.ops = def.stats.ops;
        if (!p.stats.ops["/"]) p.stats.ops["/"] = { c: 0, w: 0 };
        if (!p.unlocked_themes) p.unlocked_themes = MR.Themes.names();
        if (p.streak === undefined) p.streak = 0;
        if (p.freezes === undefined) p.freezes = 0;
        if (p.last_login === undefined) p.last_login = "";
        if (!p.title) p.title = def.title;
        if (p.xp === undefined) p.xp = 0;
        if (p.level === undefined) p.level = 1;
        if (p.high_score_single === undefined) p.high_score_single = 0;
        const s = (p.settings = p.settings || {});
        if (!s.theme) s.theme = def.settings.theme;
        if (s.vertical_math === undefined) s.vertical_math = false;
        if (s.visual_mode === undefined) s.visual_mode = false;
        if (!s.language) s.language = "he";
        if (s.div_f1 === undefined) s.div_f1 = 10;
        if (s.div_f2 === undefined) s.div_f2 = 10;
        if (s.mult_f1 === undefined) s.mult_f1 = 10;
        if (s.mult_f2 === undefined) s.mult_f2 = 10;
        if (s.max_num === undefined) s.max_num = 20;
        if (s.time === undefined) s.time = 60;
        if (!s.active_ops || !s.active_ops.length) s.active_ops = ["+"];
      }
    }

    this.saveData = data;
    this.currentUser = data.last_used;
    if (!data.profiles[this.currentUser]) {
      this.currentUser = Object.keys(data.profiles)[0];
    }
    return data;
  },

  save() {
    const copy = JSON.parse(JSON.stringify(this.saveData));
    delete copy.profiles["אורח"];
    delete copy.profiles["Guest"];
    try {
      localStorage.setItem(this.KEY, JSON.stringify(copy));
    } catch (e) {
      // storage full/unavailable -- best-effort save, matches original's
      // lack of error handling around the file write.
    }
  },

  getCurrProfile() {
    return this.saveData.profiles[this.currentUser];
  },

  getCurrTheme() {
    return MR.Themes.get(this.getCurrProfile().settings.theme);
  },

  setCurrentUser(name) {
    this.currentUser = name;
    this.saveData.last_used = name;
  },

  processStreak(prof) {
    const today = this.todayISO();
    const last = prof.last_login || "";
    if (prof.streak === undefined) prof.streak = 0;
    if (prof.freezes === undefined) prof.freezes = 0;

    if (last) {
      const diff = this.daysBetween(last, today);
      if (isNaN(diff)) {
        prof.streak = 1;
        prof.freezes = 0;
      } else if (diff === 1) {
        prof.streak += 1;
        if (prof.streak % 7 === 0) prof.freezes = Math.min(2, prof.freezes + 1);
      } else if (diff > 1) {
        const missed = diff - 1;
        if (prof.freezes >= missed) {
          prof.freezes -= missed;
          prof.streak += 1;
          if (prof.streak % 7 === 0) prof.freezes = Math.min(2, prof.freezes + 1);
        } else {
          prof.streak = 1;
          prof.freezes = 0;
        }
      }
      // diff <= 0 (same-day / clock skew): no change, matches source.
    } else {
      prof.streak = 1;
      prof.freezes = 0;
    }
    prof.last_login = today;
  },

  addXp(amount, userName) {
    if (!userName || userName === MR.I18N.t("אורח")) userName = this.currentUser;
    if (!this.saveData.profiles[userName]) return "";
    const prof = this.saveData.profiles[userName];
    prof.xp += amount;
    const xpNeeded = prof.level * 1000;
    let msg = "";

    if (prof.xp >= xpNeeded && prof.level < 10) {
      prof.xp -= xpNeeded;
      prof.level += 1;
      const newLvl = prof.level;
      MR.Sound.play("levelup");
      msg = userName + MR.I18N.t(" עלית לרמה ") + String(newLvl) + "!";
      const unlock = MR.Battlepass.TIERS[newLvl];
      if (unlock) {
        msg += " (" + MR.I18N.t("נפתח: ") + MR.I18N.t(unlock.msg) + ")";
        if (unlock.type === "title") prof.title = unlock.val;
      }
    }
    this.save();
    return msg;
  }
};
