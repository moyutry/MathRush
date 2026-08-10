// App bootstrap.
(function () {
  function boot() {
    MR.Store.load();
    MR.Sound.init();
    MR.CanvasScale.init();
    MR.Input.init();
    MR.RotateOverlay.init();
    MR.GameApp.init();
    MR.Loop.start();

    // The "tap to start" overlay doubles as the required user gesture for
    // audio playback and orientation-lock to be allowed by the browser.
    const unlockOverlay = document.getElementById("unlock-overlay");
    const dismiss = () => {
      if (unlockOverlay) unlockOverlay.classList.add("hidden");
      window.removeEventListener("pointerdown", dismiss);
    };
    window.addEventListener("pointerdown", dismiss, { once: true });

    window.addEventListener("beforeunload", () => MR.Store.save());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") MR.Store.save();
    });

    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
