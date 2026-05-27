const themePresets = [
  { id: "amber", name: "호박", colors: ["#efe8aa", "#dfcf62", "#bda82f"] },
  { id: "lime", name: "라임", colors: ["#b8df70", "#9ad12a", "#68cc2a"] },
  { id: "mint", name: "민트", colors: ["#bdf2ea", "#77ccbd", "#2bbfa8"] },
  { id: "grass", name: "잔디", colors: ["#55e87f", "#15c86d", "#0a914b"] },
  { id: "emerald", name: "에메랄드", colors: ["#5bd39b", "#11aa8a", "#087f4a"] },
  { id: "sky", name: "하늘", colors: ["#c1d7e8", "#a5c1d7", "#83a8c1"] },
  { id: "sea", name: "바다", colors: ["#8bd5ef", "#43afd5", "#1c91bd"] },
  { id: "lilac", name: "라일락", colors: ["#eee6ff", "#dcccf5", "#b49be0"] },
  { id: "violet", name: "바이올렛", colors: ["#8872a8", "#6e5599", "#563582"] },
  { id: "charcoal", name: "흑회색", colors: ["#909090", "#4a4a4a", "#5c7bd3"] },
];

const themeStorageKey = "bbibbi-site-settings";
const defaultSettings = {
  theme: "violet",
  wideLayout: true,
  compactList: false,
  glow: true,
};

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const number = Number.parseInt(value.length === 3 ? value.replace(/(.)/g, "$1$1") : value, 16);
  return `${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}`;
}

function loadThemeSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(themeStorageKey) || "{}") };
  } catch {
    return { ...defaultSettings };
  }
}

function saveThemeSettings(settings) {
  localStorage.setItem(themeStorageKey, JSON.stringify(settings));
}

function applyThemeSettings(settings) {
  const preset = themePresets.find((item) => item.id === settings.theme) || themePresets[8];
  const root = document.documentElement;

  root.style.setProperty("--purple", preset.colors[2]);
  root.style.setProperty("--purple-2", preset.colors[1]);
  root.style.setProperty("--theme-soft", preset.colors[0]);
  root.style.setProperty("--theme-mid", preset.colors[1]);
  root.style.setProperty("--theme-strong", preset.colors[2]);
  root.style.setProperty("--theme-soft-rgb", hexToRgb(preset.colors[0]));
  root.style.setProperty("--theme-mid-rgb", hexToRgb(preset.colors[1]));
  root.style.setProperty("--theme-strong-rgb", hexToRgb(preset.colors[2]));
  root.style.setProperty("--line", `rgba(${hexToRgb(preset.colors[1])}, 0.18)`);
  root.style.setProperty("--line-strong", `rgba(${hexToRgb(preset.colors[1])}, 0.42)`);
  root.style.setProperty("--accent-weak", `rgba(${hexToRgb(preset.colors[1])}, 0.12)`);
  root.style.setProperty("--accent-mid", `rgba(${hexToRgb(preset.colors[1])}, 0.24)`);
  root.style.setProperty("--accent-strong", `rgba(${hexToRgb(preset.colors[2])}, 0.52)`);
  root.style.setProperty("--accent-glow", `rgba(${hexToRgb(preset.colors[1])}, 0.32)`);

  document.body.classList.toggle("wide-layout", Boolean(settings.wideLayout));
  document.body.classList.toggle("compact-list", Boolean(settings.compactList));
  document.body.classList.toggle("no-glow", !settings.glow);
}

function initThemePanel() {
  let settings = loadThemeSettings();
  applyThemeSettings(settings);

  const button = document.querySelector("#themeButton");
  const panel = document.querySelector("#settingsPanel");
  const closeButton = document.querySelector("#settingsClose");
  const themeList = document.querySelector("#themeList");
  const wideLayoutToggle = document.querySelector("#wideLayoutToggle");
  const compactListToggle = document.querySelector("#compactListToggle");
  const glowToggle = document.querySelector("#glowToggle");

  if (!button || !panel || !themeList) return;

  function syncControls() {
    themeList.querySelectorAll("[data-theme-id]").forEach((item) => {
      item.classList.toggle("active", item.dataset.themeId === settings.theme);
    });
    wideLayoutToggle.checked = Boolean(settings.wideLayout);
    compactListToggle.checked = Boolean(settings.compactList);
    glowToggle.checked = Boolean(settings.glow);
  }

  function update(nextSettings) {
    settings = { ...settings, ...nextSettings };
    applyThemeSettings(settings);
    saveThemeSettings(settings);
    syncControls();
  }

  themePresets.forEach((preset) => {
    const item = document.createElement("button");
    const swatch = document.createElement("span");
    const name = document.createElement("strong");

    item.type = "button";
    item.dataset.themeId = preset.id;
    item.className = "theme-option";
    swatch.className = "theme-swatch";
    swatch.style.setProperty("--swatch-a", preset.colors[0]);
    swatch.style.setProperty("--swatch-b", preset.colors[1]);
    swatch.style.setProperty("--swatch-c", preset.colors[2]);
    name.textContent = preset.name;

    item.append(swatch, name);
    item.addEventListener("click", () => update({ theme: preset.id }));
    themeList.append(item);
  });

  button.addEventListener("click", () => {
    const nextHidden = !panel.hidden;
    panel.hidden = nextHidden;
    button.setAttribute("aria-expanded", String(!nextHidden));
  });

  closeButton?.addEventListener("click", () => {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("click", (event) => {
    if (panel.hidden || panel.contains(event.target) || button.contains(event.target)) return;
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
  });

  wideLayoutToggle?.addEventListener("change", () => update({ wideLayout: wideLayoutToggle.checked }));
  compactListToggle?.addEventListener("change", () => update({ compactList: compactListToggle.checked }));
  glowToggle?.addEventListener("change", () => update({ glow: glowToggle.checked }));

  syncControls();
}

applyThemeSettings(loadThemeSettings());
document.addEventListener("DOMContentLoaded", initThemePanel);
