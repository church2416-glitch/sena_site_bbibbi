(() => {
  if (window.__bbibbiNotificationClientStarted) return;
  window.__bbibbiNotificationClientStarted = true;

  const soundKey = "bbibbi-notification-sound";
  const volumeKey = "bbibbi-notification-volume";
  const audio = new Audio("assets/sound/notification-pling.mp3");
  let stream = null;
  let audioContext = null;

  audio.preload = "auto";

  function soundEnabled() {
    return localStorage.getItem(soundKey) !== "off";
  }

  function soundVolume() {
    const value = Number(localStorage.getItem(volumeKey));
    if (!Number.isFinite(value)) return 0.72;
    return Math.max(0, Math.min(1, value));
  }

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    return audioContext;
  }

  async function unlockSound() {
    const context = getAudioContext();
    if (context?.state === "suspended") await context.resume().catch(() => {});
    if (audio.dataset.unlocked) return;
    const originalVolume = audio.volume;
    audio.volume = 0;
    await audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.dataset.unlocked = "true";
    }).catch(() => {});
    audio.volume = originalVolume;
  }

  function playFallbackTone(volume) {
    const context = getAudioContext();
    if (!context || context.state !== "running") return;

    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, start);
    oscillator.frequency.exponentialRampToValueAtTime(1320, start + 0.08);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.12 * volume), start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.24);
  }

  function playNotificationSound() {
    const volume = soundVolume();
    if (!soundEnabled() || volume <= 0) return;

    const clone = audio.cloneNode(true);
    clone.volume = volume;
    clone.play().catch(() => playFallbackTone(volume));
  }

  async function startNotificationStream() {
    if (!window.EventSource || stream) return;

    const me = await fetch("/api/me").then((response) => response.json()).catch(() => null);
    if (!me?.loggedIn) return;

    stream = new EventSource("/api/me/notifications/stream");
    stream.addEventListener("notification", (event) => {
      const data = JSON.parse(event.data || "{}");
      if (data.notification) playNotificationSound();
    });
    stream.onerror = () => {
      stream?.close();
      stream = null;
      window.setTimeout(startNotificationStream, 5000);
    };
  }

  document.addEventListener("pointerdown", unlockSound, { once: true });
  document.addEventListener("keydown", unlockSound, { once: true });
  startNotificationStream();
})();
