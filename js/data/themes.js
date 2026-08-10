// Global namespace root for the whole app.
window.MR = window.MR || {};

// Fixed logical resolution the whole game is drawn in (see core/canvas-scale.js).
MR.LOGICAL_W = 1600;
MR.LOGICAL_H = 740;

// Offline-safe system-font stack covering Hebrew + English well on
// Windows/Android/iOS without bundling any web font (zero network requests).
MR.FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Hebrew", Tahoma, Arial, sans-serif';

MR.Colors = {
  BLACK: "#0f0f0f",
  WHITE: "#f5f5f5",
  GRAY: "#3c3c3c",
  DARK_GRAY: "#1e1e1e",
  LIGHT_GRAY: "#787878",
  GREEN: "#2ecc71",
  RED: "#e74c3c",
  BLUE: "#3498db",
  GOLD: "#f1c40f",
  PURPLE: "#9b59b6",
  SHADOW: "rgba(10,10,10,0.55)"
};

// Same 3 themes as the source game, same Hebrew keys (used as save-data values),
// extended with gradient stops, a multi-hue titleGrad for headline text, two
// ambient glowAccent colors for the background glow blobs, and a
// chalk-texture flag -- all part of the "futuristic gradient" visual pass.
MR.Themes = {
  THEMES: {
    "צבעוני (ילדים)": {
      bg: "#e6f5ff", bgGrad: ["#eef9ff", "#c3e4ff"],
      panel: "#ffffff", panelGrad: ["#ffffff", "#e9f4ff"],
      text: "#28324a", highlight: "#ffa500",
      titleGrad: ["#ffe066", "#ff9d3c", "#ff5c8a"],
      glowAccent: ["#8ecbffb0", "#ffb3d9a0"],
      player1: "#3498db", player2: "#e74c3c",
      border: "#64c8ff", chalk: false
    },
    "קלאסי (כהה)": {
      bg: "#19191e", bgGrad: ["#242631", "#0e0f14"],
      panel: "#28282d", panelGrad: ["#33333c", "#1c1c21"],
      text: "#f5f5f5", highlight: "#f1c40f",
      titleGrad: ["#5ee7ff", "#8a7bff", "#ff6bcb"],
      glowAccent: ["#3ad6ff70", "#b06bff60"],
      player1: "#3498db", player2: "#e74c3c",
      border: "#57616f", chalk: false
    },
    "לוח גיר": {
      bg: "#224c2d", bgGrad: ["#2f6a3d", "#122d18"],
      panel: "#2c5e38", panelGrad: ["#387a48", "#1e4026"],
      text: "#ffffff", highlight: "#ffd700",
      titleGrad: ["#ffe66d", "#8effa1", "#5ce1ff"],
      glowAccent: ["#ffe66d55", "#5ce1ff50"],
      player1: "#ffffff", player2: "#ffc8c8",
      border: "#96c896", chalk: true
    }
  },

  get(name) {
    return this.THEMES[name] || this.THEMES["צבעוני (ילדים)"];
  },

  names() {
    return Object.keys(this.THEMES);
  }
};
