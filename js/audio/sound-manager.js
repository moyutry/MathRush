// Preloads and plays the game's sound effects.
//
// Bug fix vs. the Python source: it looked for "sounds/levelup.mp3", which
// never existed on disk (the real file is "sounds/level.mp3"), so the
// level-up sound silently never played. Fixed here by pointing the
// "levelup" key at the actual file.
MR.Sound = {
  sounds: {},
  unlocked: false,
  volume: 0.4,

  files: {
    correct: "sounds/correct.mp3",
    wrong: "sounds/wrong.mp3",
    click: "sounds/click.mp3",
    countdown: "sounds/countdown.mp3",
    type: "sounds/type.mp3",
    levelup: "sounds/level.mp3"
  },

  init() {
    Object.keys(this.files).forEach((name) => {
      const audio = new Audio(this.files[name]);
      audio.preload = "auto";
      audio.volume = this.volume;
      this.sounds[name] = audio;
    });

    // Mobile browsers block audio until a user gesture. Prime every clip
    // with a near-instant play/pause on the first tap so later play()
    // calls (e.g. mid-countdown) aren't the first-ever gesture.
    const unlock = () => {
      if (this.unlocked) return;
      this.unlocked = true;
      Object.keys(this.sounds).forEach((name) => {
        const a = this.sounds[name];
        const p = a.play();
        if (p && p.then) {
          p.then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
        }
      });
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
  },

  play(name) {
    const base = this.sounds[name];
    if (!base) return;
    try {
      const node = base.cloneNode(true);
      node.volume = this.volume;
      const p = node.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {
      // ignore playback failures (autoplay policy, missing file, etc.)
    }
  }
};
