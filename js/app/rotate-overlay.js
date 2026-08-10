// The visual "please rotate" overlay is pure CSS (@media orientation:portrait
// in css/style.css). This module only handles the Screen Orientation Lock
// API attempt for installed/standalone PWAs on Android (iOS Safari has no
// such API -- the CSS overlay is the real fallback there).
MR.RotateOverlay = {
  init() {
    const tryLock = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
      if (!standalone) return;
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(() => {});
      }
    };
    tryLock();
    window.addEventListener("pointerdown", tryLock, { once: true });
  }
};
