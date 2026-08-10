window.MR = window.MR || {};

// Handles the browser's native "Install App" prompt (Chrome/Edge/Android).
// Registered as the very first script in index.html because
// beforeinstallprompt can fire before the rest of the app finishes
// loading -- missing it means no install button for the whole session.
// shouldShowButton() is false both before the browser offers it and after
// the app is already installed/running standalone, so screens can just
// check it every frame without tracking install state themselves.
MR.PWAInstall = {
  deferredPrompt: null,
  available: false,

  isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
      || window.navigator.standalone === true;
  },

  shouldShowButton() {
    return this.available && !this.isStandalone();
  },

  async promptInstall() {
    const prompt = this.deferredPrompt;
    if (!prompt) return;
    this.deferredPrompt = null;
    this.available = false;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (e) {
      // prompt already used/dismissed -- nothing to do
    }
  }
};

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  MR.PWAInstall.deferredPrompt = e;
  MR.PWAInstall.available = true;
});

window.addEventListener("appinstalled", () => {
  MR.PWAInstall.deferredPrompt = null;
  MR.PWAInstall.available = false;
});
