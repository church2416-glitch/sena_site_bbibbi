(() => {
  if (window.__bbibbiNotificationClientStarted) return;
  window.__bbibbiNotificationClientStarted = true;

  const soundKey = "bbibbi-notification-sound";
  const volumeKey = "bbibbi-notification-volume";
  const audio = new Audio("assets/sound/notification-pling.mp3");
  const channel = "BroadcastChannel" in window ? new BroadcastChannel("bbibbi-notifications") : null;
  let stream = null;
  let audioContext = null;
  let lastPlayedNotificationId = "";
  let unreadCountReady = false;
  let lastUnreadCount = 0;

  audio.preload = "auto";

  function soundEnabled() {
    return localStorage.getItem(soundKey) !== "off";
  }

  function soundVolume() {
    const value = Number(localStorage.getItem(volumeKey));
    if (!Number.isFinite(value)) return 0.2;
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
    hideSoundPrompt();
  }

  function showSoundPrompt() {
    if (document.querySelector("#bbibbiSoundPrompt")) return;
    const button = document.createElement("button");
    button.id = "bbibbiSoundPrompt";
    button.type = "button";
    button.textContent = "알림음 켜기";
    button.style.cssText = [
      "position:fixed",
      "right:18px",
      "bottom:18px",
      "z-index:9999",
      "min-height:42px",
      "padding:0 16px",
      "border:1px solid rgba(111,224,205,.6)",
      "border-radius:8px",
      "color:#06100f",
      "background:#6fe0cd",
      "font-weight:900",
      "box-shadow:0 16px 40px rgba(0,0,0,.35)",
    ].join(";");
    button.addEventListener("click", () => {
      unlockSound().then(playNotificationSound);
    });
    document.body.append(button);
  }

  function hideSoundPrompt() {
    document.querySelector("#bbibbiSoundPrompt")?.remove();
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

  function playNotificationSound(notificationId = "") {
    if (notificationId && lastPlayedNotificationId === notificationId) return;
    if (notificationId) lastPlayedNotificationId = notificationId;

    const volume = soundVolume();
    if (!soundEnabled() || volume <= 0) return;

    const clone = audio.cloneNode(true);
    clone.volume = volume;
    clone.play().catch(() => {
      playFallbackTone(volume);
      if (getAudioContext()?.state !== "running") showSoundPrompt();
    });
  }

  function handleNotification(notification, notifyOtherTabs = true) {
    if (!notification) return;
    const notificationId = String(notification.id || `${notification.type}-${notification.createdAt || Date.now()}`);
    playNotificationSound(notificationId);
    if (notifyOtherTabs) channel?.postMessage({ type: "notification", notification });
  }

  async function startNotificationStream() {
    if (!window.EventSource || stream) return;

    const me = await fetch("/api/me").then((response) => response.json()).catch(() => null);
    if (!me?.loggedIn) return;

    stream = new EventSource("/api/me/notifications/stream");
    stream.addEventListener("ready", (event) => {
      const data = JSON.parse(event.data || "{}");
      lastUnreadCount = Number(data.unreadCount) || 0;
      unreadCountReady = true;
    });
    stream.addEventListener("notification", (event) => {
      const data = JSON.parse(event.data || "{}");
      lastUnreadCount = Number(data.unreadCount) || lastUnreadCount;
      unreadCountReady = true;
      handleNotification(data.notification);
    });
    stream.onerror = () => {
      stream?.close();
      stream = null;
      window.setTimeout(startNotificationStream, 5000);
    };
  }

  async function pollNotifications() {
    const data = await fetch("/api/me/notifications").then((response) => {
      if (!response.ok) throw new Error("notifications failed");
      return response.json();
    }).catch(() => null);
    if (!data) return;

    const unreadCount = Number(data.unreadCount) || 0;
    if (!unreadCountReady) {
      lastUnreadCount = unreadCount;
      unreadCountReady = true;
      return;
    }

    if (unreadCount > lastUnreadCount) {
      const notifications = Array.isArray(data.notifications) ? data.notifications : [];
      handleNotification(notifications[0] || { id: `poll-${Date.now()}` });
    }
    lastUnreadCount = unreadCount;
  }

  document.addEventListener("pointerdown", unlockSound, { once: true });
  document.addEventListener("click", unlockSound, { once: true });
  document.addEventListener("touchstart", unlockSound, { once: true });
  document.addEventListener("keydown", unlockSound, { once: true });
  channel?.addEventListener("message", (event) => {
    if (event.data?.type === "notification") handleNotification(event.data.notification, false);
  });
  startNotificationStream();
  window.setInterval(pollNotifications, 8000);
})();
