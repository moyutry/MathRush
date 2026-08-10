// Default profile / save shape. Ported from get_default_profile() in the
// Python source, with display_mode and show_numpad dropped (desktop-only
// settings that don't apply on a touch phone PWA -- on-screen numeric/name
// entry is simply always active now).
MR.Defaults = {
  getDefaultProfile() {
    return {
      xp: 0,
      level: 1,
      high_score_single: 0,
      unlocked_ops: ["+", "-", "*", "/"],
      unlocked_themes: MR.Themes.names(),
      title: "לומד צעיר",
      last_login: "",
      streak: 0,
      freezes: 0,
      stats: {
        games_played: 0,
        total_time: 0,
        ops: {
          "+": { c: 0, w: 0 },
          "-": { c: 0, w: 0 },
          "*": { c: 0, w: 0 },
          "/": { c: 0, w: 0 }
        }
      },
      settings: {
        time: 60,
        max_num: 20,
        active_ops: ["+"],
        mult_f1: 10, mult_f2: 10,
        div_f1: 10, div_f2: 10,
        theme: "צבעוני (ילדים)",
        vertical_math: false,
        language: "he",
        visual_mode: false
      }
    };
  },

  defaultSave() {
    return { profiles: { "שחקן 1": this.getDefaultProfile() }, last_used: "שחקן 1" };
  }
};
