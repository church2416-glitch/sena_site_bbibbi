function makeId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const seedGuides = [
  {
    id: makeId(),
    title: "라운일 2공 자유 게시판 정리",
    comments: 32,
    game: "세븐나이츠 리버스",
    category: "자유 게시판",
    summary: "라운일 방어덱 기준 공격 조합, 스킬 순서, 장비 세팅을 한 번에 확인합니다.",
    tags: ["길드전", "라운일"],
    attachment: "",
    votes: 1234,
    views: 12000,
    createdAt: "방금 전",
  },
  {
    id: makeId(),
    title: "초오린 상대할 때 세팅 보류해야 하는 경우",
    comments: 15,
    game: "세븐나이츠 리버스",
    category: "자유 게시판",
    summary: "같은 상대덱이라도 우리 진형과 펫 선택에 따라 보류해야 하는 패턴을 정리했습니다.",
    tags: ["길드전", "초오린"],
    attachment: "",
    votes: 8943,
    views: 8943,
    createdAt: "3분 전",
  },
  {
    id: makeId(),
    title: "밀프레 덱 장신구 세공 추천",
    comments: 8,
    game: "세븐나이츠 리버스",
    category: "자유 게시판",
    summary: "권능, 불사, 부활 반지 조합별로 안정적인 세공 방향을 비교했습니다.",
    tags: ["장비", "세공"],
    attachment: "",
    votes: 5671,
    views: 5671,
    createdAt: "7분 전",
  },
  {
    id: makeId(),
    title: "초반 루비 아끼는 PVE 성장 순서",
    comments: 47,
    game: "세븐나이츠 리버스",
    category: "PVE 공략",
    summary: "초반에 낭비하기 쉬운 재화와 먼저 밀어야 하는 성장 루트를 정리했습니다.",
    tags: ["PVE", "초반"],
    attachment: "",
    votes: 2300,
    views: 2300,
    createdAt: "10분 전",
  },
  {
    id: makeId(),
    title: "쫄작 덱 구성 파괴신",
    comments: 22,
    game: "세븐나이츠 리버스",
    category: "파괴신",
    summary: "현재 보유 영웅 기준으로 쫄작 안정성이 안 나와서 조합 조언을 구합니다.",
    tags: ["파괴신", "쫄작"],
    attachment: "",
    votes: 4321,
    views: 4321,
    createdAt: "12분 전",
  },
  {
    id: makeId(),
    title: "라운일 덱 테스트 후기",
    comments: 19,
    game: "세븐나이츠 리버스",
    category: "잡담",
    summary: "어제부터 굴려봤는데 생각보다 반격 변수가 커서 메모 남깁니다.",
    tags: ["잡담", "후기"],
    attachment: "",
    votes: 840,
    views: 1420,
    createdAt: "18분 전",
  },
  {
    id: makeId(),
    title: "방어덱 이름이 헷갈리는 순간",
    comments: 41,
    game: "세븐나이츠 리버스",
    category: "유머",
    summary: "라온일인지 라운일인지 헷갈려서 만든 짧은 밈 모음입니다.",
    tags: ["유머", "길드전"],
    attachment: "",
    votes: 2110,
    views: 3900,
    createdAt: "24분 전",
  },
  {
    id: makeId(),
    title: "보스전 장비 우선순위 메모",
    comments: 6,
    game: "세븐나이츠 리버스",
    category: "PVE 공략",
    summary: "딜러와 서포터 장비를 어떤 순서로 맞추면 좋은지 간단히 정리했습니다.",
    tags: ["PVE", "장비"],
    attachment: "",
    votes: 1630,
    views: 2010,
    createdAt: "31분 전",
  },
  {
    id: makeId(),
    title: "방어덱 생존력 계산 방식",
    comments: 12,
    game: "세븐나이츠 리버스",
    category: "기술",
    summary: "진형, 펫, 세공이 생존력에 주는 영향을 테스트 기준으로 적었습니다.",
    tags: ["기술", "계산"],
    attachment: "",
    votes: 980,
    views: 1770,
    createdAt: "38분 전",
  },
];

const storageKey = "bbibbi-board-items-v2";
const votedKey = "bbibbi-board-voted-v2";
const noticeStorageKey = "bbibbi-seven-notices";
const devNoteStorageKey = "bbibbi-seven-dev-notes";
const feedLinks = {
  notices: "https://game.naver.com/lounge/sena_rebirth/board/11",
  devNotes: "https://game.naver.com/lounge/sena_rebirth/board/3",
};
let boardTagColors = new Map();
const guideList = document.querySelector("#guideList");
const rankingList = document.querySelector("#rankingList");
const hotList = document.querySelector("#hotList");
const noticeList = document.querySelector("#noticeList");
const noticeSourceLink = document.querySelector("#noticeSourceLink");
const noticeStatus = document.querySelector("#noticeStatus");
const devNoteList = document.querySelector("#devNoteList");
const devNoteSourceLink = document.querySelector("#devNoteSourceLink");
const devNoteStatus = document.querySelector("#devNoteStatus");
const boardTitle = document.querySelector("#boardTitle");
const boardDesc = document.querySelector("#boardDesc");
const boardCount = document.querySelector("#boardCount");
const searchInput = document.querySelector("#searchInput");
const categoryStrip = document.querySelector(".category-strip");
const boardPager = document.createElement("nav");
boardPager.className = "board-pager";
boardPager.setAttribute("aria-label", "게시글 페이지");
guideList?.after(boardPager);
let categoryButtons = [...document.querySelectorAll("[data-filter]")];
const mainArea = document.querySelector(".main-area");
const hero = document.querySelector(".hero");
const heroImage = document.querySelector(".hero img");
const heroKicker = document.querySelector(".hero-copy p");
const heroTitle = document.querySelector(".hero-copy h1");
const heroSubtitle = document.querySelector(".hero-copy span");
const heroAction = document.querySelector(".hero-copy a");
const heroPrevButton = document.querySelector("#heroPrevButton");
const heroNextButton = document.querySelector("#heroNextButton");
const heroSlideDots = document.querySelector("#heroSlideDots");
const loginModal = document.querySelector("#loginModal");
const signupModal = document.querySelector("#signupModal");
const profileModal = document.querySelector("#profileModal");
const loginForm = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");
const profileForm = document.querySelector("#profileForm");
const providerLoginOpenButton = document.querySelector("#providerLoginOpenButton");
const mobileLoginButton = document.querySelector("#mobileLoginButton");
const guestLoginFallbackButton = document.querySelector("#guestLoginFallbackButton");
const adminDashboardLink = document.querySelector("#adminDashboardLink");
const guildWarSideLink = document.querySelector("#guildWarSideLink");
const kakaoLoginButton = document.querySelector("#kakaoLoginButton");
const loginCloseButton = document.querySelector("#loginCloseButton");
const profileCloseButton = document.querySelector("#profileCloseButton");
const signupButton = document.querySelector("#signupButton");
const signupCloseButton = document.querySelector("#signupCloseButton");
const signupToLoginButton = document.querySelector("#signupToLoginButton");
const profileButton = document.querySelector("#profileButton");
const notificationTopButton = document.querySelector("#notificationTopButton");
const notificationPanel = document.querySelector("#notificationPanel");
const notificationPanelList = document.querySelector("#notificationPanelList");
const notificationPanelReadButton = document.querySelector("#notificationPanelReadButton");
const notificationPanelProfileButton = document.querySelector("#notificationPanelProfileButton");
const notificationBadge = document.querySelector("#notificationBadge");
const logoutButton = document.querySelector("#logoutButton");
const loginStateText = document.querySelector("#loginStateText");
const roleText = document.querySelector("#roleText");
const loginError = document.querySelector("#loginError");
const signupError = document.querySelector("#signupError");
const profileError = document.querySelector("#profileError");
const providerMessage = document.querySelector("#providerMessage");
const accountAvatar = document.querySelector("#accountAvatar");
const accountName = document.querySelector("#accountName");
const accountMeta = document.querySelector("#accountMeta");
const accountStatPosts = document.querySelector("#accountStatPosts");
const accountStatViews = document.querySelector("#accountStatViews");
const accountStatVotes = document.querySelector("#accountStatVotes");
const accountStatComments = document.querySelector("#accountStatComments");
const accountUsername = document.querySelector("#accountUsername");
const accountEmail = document.querySelector("#accountEmail");
const accountProvider = document.querySelector("#accountProvider");
const accountRole = document.querySelector("#accountRole");
const accountCreatedAt = document.querySelector("#accountCreatedAt");
const accountPostList = document.querySelector("#accountPostList");
const accountLikedList = document.querySelector("#accountLikedList");
const accountBookmarkList = document.querySelector("#accountBookmarkList");
const accountCommentList = document.querySelector("#accountCommentList");
const notificationList = document.querySelector("#notificationList");
const notificationReadButton = document.querySelector("#notificationReadButton");
const notificationClearButton = document.querySelector("#notificationClearButton");
const notificationSoundButton = document.querySelector("#notificationSoundButton");
const notificationSoundTestButton = document.querySelector("#notificationSoundTestButton");
const notificationVolumeInput = document.querySelector("#notificationVolumeInput");
const notificationVolumeValue = document.querySelector("#notificationVolumeValue");
const accountPostPermission = document.querySelector("#accountPostPermission");
const accountAdminPermission = document.querySelector("#accountAdminPermission");
const sideBoardLinks = [...document.querySelectorAll("[data-board-link]")];
const boardPulseScore = document.querySelector("#boardPulseScore");
const boardVoteTotal = document.querySelector("#boardVoteTotal");
const boardViewTotal = document.querySelector("#boardViewTotal");
const boardPulseText = document.querySelector("#boardPulseText");
const boardSparkline = document.querySelector("#boardSparkline");
const importantNoticeModal = document.querySelector("#importantNoticeModal");
const importantNoticeEyebrowText = document.querySelector("#importantNoticeEyebrowText");
const importantNoticeTitleText = document.querySelector("#importantNoticeTitleText");
const importantNoticeImages = document.querySelector("#importantNoticeImages");
const importantNoticeBody = document.querySelector("#importantNoticeBody");
const importantNoticeCloseButton = document.querySelector("#importantNoticeCloseButton");
const importantNoticeConfirmButton = document.querySelector("#importantNoticeConfirmButton");
const importantNoticeHideTodayButton = document.querySelector("#importantNoticeHideTodayButton");
const importantNoticeActionLink = document.querySelector("#importantNoticeActionLink");

const popularBoardCategory = "__popular";
const adminManageCategories = [
  "공지사항",
  "PVP 게시판",
  "PVP 공략",
  "PVE 공략",
  "파괴신",
  "공성전",
  "기술",
  "잡담",
  "유머",
  "임시 채널1",
];
let guideAdminMenu = null;
let guideAdminMenuGuide = null;

const boardInfo = {
  [popularBoardCategory]: {
    title: "인기글",
    desc: "추천을 받은 게시글을 모아보는 공간",
  },
  공지사항: {
    title: "공지사항",
    desc: "운영 공지와 중요한 안내를 확인하는 게시판",
  },
  전체: {
    title: "전체 게시판",
    desc: "지금 올라온 공략과 사람들이 주목하는 게시글들",
  },
  "PVP 게시판": {
    title: "PVP 게시판",
    desc: "결투장, 조합, 운영 팁을 나누는 게시판",
  },
  "PVE 공략": {
    title: "PVE 공략",
    desc: "일반적인 PVE 공략 공간",
  },
  돌발레이드: {
    title: "돌발레이드",
    desc: "아스트레아, 칼리스트라, 레오니드 공략을 모아보는 공간",
  },
  "PVP 공략": {
    title: "PVP 공략",
    desc: "총력전, 결투장 관련 토론장",
  },
  파괴신: {
    title: "파괴신 게시판",
    desc: "파괴신 관련 모든 토론장",
  },
  공성전: {
    title: "공성전 게시판",
    desc: "공성전별 소식과 플레이 경험을 나누는 공간",
  },
  기술: {
    title: "기술 게시판",
    desc: "빌드 계산, 최적화, 자동화와 관련된 깊은 이야기",
  },
  잡담: {
    title: "잡담 게시판",
    desc: "가볍게 떠드는 플레이 후기와 커뮤니티 이야기",
  },
  유머: {
    title: "유머 게시판",
    desc: "공성전하다 터진 순간과 짤로 남기고 싶은 장면",
  },
  "임시 채널1": {
    title: "임시 채널1",
    desc: "임시로 운영하는 커뮤니티 채널",
  },
  "임시 채널2": {
    title: "임시 채널2",
    desc: "임시로 운영하는 커뮤니티 채널",
  },
};

function getBoardFromPath() {
  const pathname = decodeURIComponent(location.pathname).replace(/\/+$/, "") || "/";
  const pathMap = {
    "/board": "\uC804\uCCB4",
    "/board/pvp": "PVP \uAC8C\uC2DC\uD310",
    "/board/pve": "PVE \uACF5\uB7B5",
    "/board/tech": "\uAE30\uC220",
  };
  return pathMap[pathname] || null;
}

const initialBoard = getBoardFromPath() || new URLSearchParams(location.search).get("board");
const boardAliases = {
  베스트: "전체",
  "자유 게시판": "PVP 게시판",
  "데미지 고급": "임시 채널1",
  "아이템 고급": "임시 채널2",
  "돌발 레이드": "돌발레이드",
};
const overviewExcludedCategories = new Set(["공지사항"]);
const boardCategoryGroups = {
  "PVP 게시판": "pvp",
  "PVP 공략": "pvp",
  "PVE 공략": "pve",
  파괴신: "pve",
  공성전: "pve",
  돌발레이드: "pve",
  기술: "pve",
};

const boardTabSets = {
  overview: [
    { filter: "전체", label: "전체 게시판" },
    { filter: popularBoardCategory, label: "인기글" },
  ],
  pvp: [
    { filter: "PVP 게시판", label: "PVP 게시판" },
    { filter: "PVP 공략", label: "PVP 공략" },
  ],
  pve: [
    { filter: "PVE 공략", label: "PVE 공략" },
    { filter: "파괴신", label: "파괴신" },
    { filter: "공성전", label: "공성전" },
    { filter: "돌발레이드", label: "돌발레이드" },
  ],
};

const heroModes = {
  overview: {
    image: "/assets/common/singularity-hero.webp",
    kicker: "bbitsena",
    title: "삣삐",
    subtitle: "삣삐에요",
    action: "길드전 가이드 보기",
    href: "/guild/war",
  },
  pvp: {
    image: "/assets/common/guide-hero.webp",
    kicker: "BBITSENA · PVP BOARD",
    title: "PVP 게시판",
    subtitle: "결투장 조합과 메타 이야기를 확인하세요",
    action: "공략 작성하기",
    href: "/board/write",
  },
  pve: {
    image: "/assets/common/guide-hero.webp",
    kicker: "BBITSENA · PVE STRATEGY",
    title: "PVE 공략",
    subtitle: "파괴신, 공성전, 돌발레이드 공략을 모아 확인하세요",
    action: "공략 작성하기",
    href: "/board/write",
  },
};
let mainHeroSettings = {
  imageUrls: [],
  intervalSeconds: 5,
};
let heroSlideIndex = 0;
let heroSlideTimer = null;

function getMainHeroSlides() {
  return mainHeroSettings.imageUrls?.length ? mainHeroSettings.imageUrls : [heroModes.overview.image];
}

function stopHeroSlider() {
  if (heroSlideTimer) {
    clearInterval(heroSlideTimer);
    heroSlideTimer = null;
  }
}

function animateHeroImage(direction = "next") {
  if (!heroImage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  heroImage.classList.remove("slide-in-next", "slide-in-prev");
  void heroImage.offsetWidth;
  heroImage.classList.add(direction === "prev" ? "slide-in-prev" : "slide-in-next");
}

function setHeroSlide(index, { restart = true, direction = "next" } = {}) {
  const slides = getMainHeroSlides();
  if (!slides.length) return;
  heroSlideIndex = (index + slides.length) % slides.length;
  if (heroImage) {
    heroImage.src = slides[heroSlideIndex];
    animateHeroImage(direction);
  }
  if (heroSlideDots) {
    [...heroSlideDots.children].forEach((button, dotIndex) => {
      button.classList.toggle("active", dotIndex === heroSlideIndex);
    });
  }
  if (restart) startHeroSlider();
}

function renderHeroSliderControls() {
  const slides = getMainHeroSlides();
  const enabled = slides.length > 1 && getBoardGroup(activeCategory) !== "pvp" && getBoardGroup(activeCategory) !== "pve";
  if (heroPrevButton) heroPrevButton.hidden = !enabled;
  if (heroNextButton) heroNextButton.hidden = !enabled;
  if (!heroSlideDots) return;
  heroSlideDots.hidden = !enabled;
  heroSlideDots.innerHTML = "";
  if (!enabled) return;
  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hero-slide-dot";
    dot.setAttribute("aria-label", `${index + 1}번 배너 보기`);
    dot.addEventListener("click", () => setHeroSlide(index, { direction: index < heroSlideIndex ? "prev" : "next" }));
    heroSlideDots.append(dot);
  });
}

function startHeroSlider() {
  stopHeroSlider();
  const slides = getMainHeroSlides();
  const activeGroup = getBoardGroup(activeCategory) || "overview";
  if (activeGroup !== "overview" || slides.length < 2) return;
  heroSlideTimer = setInterval(() => {
    setHeroSlide(heroSlideIndex + 1, { restart: false, direction: "next" });
  }, Math.max(3, Number(mainHeroSettings.intervalSeconds) || 5) * 1000);
}

async function loadMainHeroSettings() {
  try {
    const response = await fetch("/api/main-hero");
    if (!response.ok) return;
    const data = await response.json();
    mainHeroSettings = {
      imageUrls: Array.isArray(data.hero?.imageUrls) ? data.hero.imageUrls : [],
      intervalSeconds: Number(data.hero?.intervalSeconds) || 5,
    };
    if ((getBoardGroup(activeCategory) || "overview") === "overview") {
      renderHeroSliderControls();
      setHeroSlide(0);
    }
  } catch {
    // Keep the bundled default hero image.
  }
}

function normalizeBoard(value) {
  return boardAliases[value] || value;
}

function getBoardGroup(category) {
  if (category === popularBoardCategory) return "overview";
  if (category === "전체") return "overview";
  return boardCategoryGroups[category] || "";
}

function getBoardUrl(category) {
  const normalized = normalizeBoard(category);
  const pathMap = {
    "\uC804\uCCB4": "/board",
    "PVP \uAC8C\uC2DC\uD310": "/board/pvp",
    "PVE \uACF5\uB7B5": "/board/pve",
    "\uAE30\uC220": "/board/tech",
  };
  if (pathMap[normalized]) return pathMap[normalized];
  return `/board?board=${encodeURIComponent(normalized)}`;
}

function setActiveCategory(category, { replace = false, scroll = false } = {}) {
  activeCategory = normalizeBoard(category);
  boardPage = 1;
  const nextUrl = getBoardUrl(activeCategory);
  if (replace) {
    history.replaceState(null, "", nextUrl);
  } else {
    history.pushState(null, "", nextUrl);
  }
  renderGuides();
  if (scroll) {
    document.querySelector("#guides")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderCategoryTabs() {
  if (!categoryStrip) return;
  const activeGroup = getBoardGroup(activeCategory) || "overview";
  const tabs = boardTabSets[activeGroup] || boardTabSets.overview;

  categoryStrip.innerHTML = "";
  categoryButtons = tabs.map((tab) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.filter = tab.filter;
    button.dataset.filterGroup = activeGroup;
    button.textContent = tab.label;
    applyTagColor(button, tab.filter);
    button.classList.toggle("active", normalizeBoard(tab.filter) === activeCategory);
    button.addEventListener("click", () => setActiveCategory(tab.filter));
    categoryStrip.append(button);
    return button;
  });
}

function renderHeroMode() {
  const activeGroup = getBoardGroup(activeCategory) || "overview";
  const mode = heroModes[activeGroup] || heroModes.overview;
  const isBoardMode = activeGroup !== "overview";

  document.body.classList.toggle("board-page-open", isBoardMode);
  mainArea?.classList.toggle("board-page-mode", isBoardMode);
  hero?.classList.toggle("board-hero", isBoardMode);

  renderHeroSliderControls();
  if (isBoardMode) {
    stopHeroSlider();
    if (heroImage) heroImage.src = mode.image;
  } else {
    setHeroSlide(heroSlideIndex, { restart: true });
  }
  if (heroKicker) heroKicker.textContent = mode.kicker;
  if (heroTitle) heroTitle.textContent = mode.title;
  if (heroSubtitle) heroSubtitle.textContent = mode.subtitle;
  if (heroAction) {
    heroAction.textContent = mode.action;
    heroAction.href = mode.href;
  }
}

let activeCategory = boardInfo[normalizeBoard(initialBoard)] && normalizeBoard(initialBoard) !== "공지사항"
  ? normalizeBoard(initialBoard)
  : "전체";
let guides = loadGuides();
let voted = new Set(JSON.parse(localStorage.getItem(votedKey) || "[]"));
let boardPage = 1;
const boardPageSize = 10;
let currentUser = { loggedIn: false, role: "guest" };
let notificationStream = null;
let notificationSoundEnabled = localStorage.getItem("bbibbi-notification-sound") !== "off";
let notificationVolume = Number(localStorage.getItem("bbibbi-notification-volume"));
if (!Number.isFinite(notificationVolume)) notificationVolume = 0.2;
notificationVolume = Math.max(0, Math.min(1, notificationVolume));
let notificationAudioContext = null;
const notificationBroadcastChannel = "BroadcastChannel" in window ? new BroadcastChannel("bbibbi-notifications") : null;
const notificationAudio = new Audio("/assets/sound/notification-pling.mp3");
notificationAudio.preload = "auto";
notificationAudio.volume = notificationVolume;
let notificationUnreadCountReady = false;
let lastNotificationUnreadCount = 0;
let importantNoticeLoaded = false;

const seedNotices = [
  {
    title: "공지 데이터 연결 대기 중",
    date: "준비 중",
    link: "#",
  },
  {
    title: "서버 실행 후 최신 공지가 이곳에 표시됩니다",
    date: "npm start",
    link: "#",
  },
];

const seedDevNotes = [
  {
    title: "개발자노트 데이터 연결 대기 중",
    date: "준비 중",
    link: "#",
  },
  {
    title: "서버 실행 후 최신 개발자노트가 이곳에 표시됩니다",
    date: "npm start",
    link: "#",
  },
];

function loadGuides() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const titles = new Set(parsed.map((guide) => guide.title));
      const missingSeeds = seedGuides.filter((guide) => !titles.has(guide.title));
      const merged = [...parsed, ...missingSeeds];
      if (missingSeeds.length) {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      }
      return merged;
    } catch {
      localStorage.setItem(storageKey, JSON.stringify(seedGuides));
      return seedGuides;
    }
  }
  localStorage.setItem(storageKey, JSON.stringify(seedGuides));
  return seedGuides;
}

async function loadGuidesFromServer() {
  try {
    const response = await fetch("/api/posts");
    if (!response.ok) throw new Error("posts failed");
    const posts = await response.json();
    guides = Array.isArray(posts) ? posts : [];
    voted = new Set(guides.filter((guide) => guide.voted).map((guide) => guide.id));
    saveVotes();
  } catch {
    guides = loadGuides();
  }
}

async function loadBoardTagColors() {
  try {
    const response = await fetch("/api/board-tags");
    if (!response.ok) return;
    const data = await response.json();
    boardTagColors = new Map(
      (data.settings?.tags || [])
        .filter((tag) => tag?.name && /^#[0-9a-fA-F]{6}$/.test(tag?.color || ""))
        .map((tag) => [normalizeBoard(tag.name), tag.color]),
    );
  } catch {
    boardTagColors = new Map();
  }
}

function applyTagColor(element, tagName) {
  const color = boardTagColors.get(normalizeBoard(tagName));
  if (!element || !color) return;
  element.style.borderColor = color;
  element.style.color = color;
  element.style.backgroundColor = `${color}22`;
}

function saveGuides() {
  localStorage.setItem(storageKey, JSON.stringify(guides));
}

function saveVotes() {
  localStorage.setItem(votedKey, JSON.stringify([...voted]));
}

async function fetchCurrentUser() {
  try {
    const response = await fetch("/api/me");
    if (!response.ok) throw new Error("me failed");
    return response.json();
  } catch {
    return { loggedIn: false, role: "guest" };
  }
}

function renderAuthState(user) {
  currentUser = user || { loggedIn: false, role: "guest" };
  const isAdmin = Boolean(user?.canAccessAdminDb || user?.isSuperAdmin);
  const roleLabel = getAccountRoleLabel(user);
  const displayName = user?.displayName || user?.username || "user";
  document.body.classList.toggle("is-guest-locked", !user?.loggedIn);
  if (loginStateText) {
    loginStateText.replaceChildren();
    if (user?.loggedIn) {
      loginStateText.append(document.createTextNode(roleLabel), document.createElement("br"), document.createTextNode(displayName));
    } else {
      loginStateText.append(document.createTextNode("로그인하고"), document.createElement("br"), document.createTextNode("댓글과 공략글을"));
    }
  }
  if (providerLoginOpenButton) providerLoginOpenButton.hidden = Boolean(user?.loggedIn);
  if (mobileLoginButton) mobileLoginButton.hidden = Boolean(user?.loggedIn);
  if (adminDashboardLink) adminDashboardLink.hidden = !isAdmin;
  if (guildWarSideLink) guildWarSideLink.hidden = !Boolean(
    user?.isVerified || user?.canManageGuild || user?.isAdmin || user?.isSuperAdmin || user?.canAccessAdminDb,
  );
  if (kakaoLoginButton) kakaoLoginButton.hidden = Boolean(user?.loggedIn);
  if (profileButton) profileButton.hidden = !user?.loggedIn;
  if (!user?.loggedIn) setNotificationBadge(0);
  if (logoutButton) logoutButton.hidden = !user?.loggedIn;
  if (roleText) {
    roleText.textContent = user?.loggedIn ? roleLabel : "회원가입";
  }
  document.body.classList.toggle("is-admin", isAdmin);
  document.body.classList.toggle("is-verified", Boolean(user?.isVerified));
  if (user?.loggedIn) {
    loadNotificationBadge();
    connectNotificationStream();
    loadImportantNotice();
  } else {
    closeNotificationStream();
  }

  if (!user?.loggedIn && new URLSearchParams(location.search).get("login") === "required") {
    openLoginModal();
  }
  if (!user?.loggedIn && window.matchMedia("(max-width: 860px)").matches) {
    window.setTimeout(openLoginModal, 80);
  }
}

function canQuickManagePosts() {
  return Boolean(
    currentUser?.canManageContent
      || currentUser?.isSuperAdmin
      || currentUser?.role === "superadmin"
      || currentUser?.role === "admin",
  );
}

function openLoginModal() {
  if (!loginModal) return;
  document.body.classList.remove("login-dismissed");
  loginModal.hidden = false;
  loginModal.removeAttribute("hidden");
  document.body.classList.add("auth-modal-open");
  loginError.hidden = true;
  if (providerMessage) providerMessage.hidden = true;
  window.setTimeout(() => loginForm?.username?.focus(), 30);
}

function closeLoginModal() {
  if (!loginModal) return;
  document.body.classList.add("login-dismissed");
  loginModal.hidden = true;
  document.body.classList.remove("auth-modal-open");
  loginForm?.reset();
}

function openSignupModal() {
  if (!signupModal) return;
  closeLoginModal();
  signupModal.hidden = false;
  signupModal.removeAttribute("hidden");
  document.body.classList.add("auth-modal-open");
  if (signupError) signupError.hidden = true;
  window.setTimeout(() => signupForm?.username?.focus(), 30);
}

function closeSignupModal() {
  if (!signupModal) return;
  signupModal.hidden = true;
  document.body.classList.remove("auth-modal-open");
  signupForm?.reset();
}

function openProfileModal() {
  if (!profileModal) return;
  profileModal.hidden = false;
  profileModal.removeAttribute("hidden");
  document.body.classList.add("auth-modal-open");
  if (profileError) profileError.hidden = true;
  if (profileForm?.displayName) {
    profileForm.displayName.value = currentUser?.displayName || currentUser?.username || "";
  }
  loadAccountDashboard();
  loadAccountBookmarks();
}

function closeProfileModal() {
  if (!profileModal) return;
  profileModal.hidden = true;
  document.body.classList.remove("auth-modal-open");
  if (profileError) profileError.hidden = true;
}

function showProviderSoon(provider) {
  if (!providerMessage) return;
  providerMessage.textContent = `${provider} 로그인은 다음 단계에서 연결할 예정입니다.`;
  providerMessage.hidden = false;
}

async function submitLogin(event) {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const response = await fetch("/api/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: formData.get("username"),
      password: formData.get("password"),
      remember: Boolean(formData.get("remember")),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "로그인 실패" }));
    loginError.textContent = error.error || "로그인 실패";
    loginError.hidden = false;
    return;
  }

  renderAuthState(await response.json());
  closeLoginModal();
}

async function submitSignup(event) {
  event.preventDefault();
  const formData = new FormData(signupForm);
  const response = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: formData.get("username"),
      displayName: formData.get("displayName"),
      email: formData.get("email"),
      password: formData.get("password"),
      passwordConfirm: formData.get("passwordConfirm"),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "회원가입 실패" }));
    signupError.textContent = error.error || "회원가입 실패";
    signupError.hidden = false;
    return;
  }

  renderAuthState(await response.json());
  closeSignupModal();
}

function setAccountText(node, value) {
  if (node) node.textContent = value || "-";
}

function getAccountRoleLabel(user) {
  if (user?.isSuperAdmin || user?.role === "superadmin") return "최고관리자";
  if (user?.isAdmin || user?.role === "admin") return "관리자";
  if (user?.isVerified || user?.role === "elite" || user?.role === "verified") return "정예 회원";
  if (user?.role === "blocked") return "열람 제한";
  return "일반 회원";
}

const roleIconMap = {
  superadmin: { label: "최고관리자", src: "/assets/common/최고관리자.webp" },
  admin: { label: "관리자", src: "/assets/common/관리자.webp" },
  elite: { label: "정예", src: "/assets/common/정예.webp" },
  verified: { label: "정예", src: "/assets/common/정예.webp" },
  user: { label: "일반", src: "/assets/common/일반.webp" },
  blocked: { label: "기본", src: "/assets/common/기본.webp" },
  guest: { label: "기본", src: "/assets/common/기본.webp" },
  default: { label: "기본", src: "/assets/common/기본.webp" },
};

function createRoleIcon(role) {
  const icon = roleIconMap[role] || roleIconMap.default;
  const img = document.createElement("img");
  img.className = "role-icon";
  img.src = icon.src;
  img.alt = icon.label;
  img.title = icon.label;
  img.loading = "lazy";
  return img;
}

function appendNameWithRole(target, name, role) {
  target.textContent = "";
  target.classList.add("role-name");
  target.append(createRoleIcon(role), document.createTextNode(name || "익명"));
}

function getProviderLabel(provider) {
  const labels = {
    kakao: "카카오",
    google: "구글",
    naver: "네이버",
    local: "일반 계정",
  };
  return labels[provider] || provider || "일반 계정";
}

function isVotedGuide(guide) {
  return voted.has(guide.id) || voted.has(String(guide.id)) || voted.has(Number(guide.id));
}

function renderAccountPostList(container, items, emptyText, metaBuilder, hrefBuilder = (item) => `/board/post?id=${encodeURIComponent(item.id)}`) {
  if (!container) return;
  container.innerHTML = "";

  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    const empty = document.createElement("p");
    empty.className = "account-empty";
    empty.textContent = emptyText;
    container.append(empty);
    return;
  }

  safeItems.forEach((post) => {
    const link = document.createElement("a");
    const title = document.createElement("strong");
    const meta = document.createElement("small");

    link.className = "account-history-item";
    link.href = hrefBuilder(post);
    title.textContent = post.title || "제목 없음";
    meta.textContent = metaBuilder(post);
    link.append(title, meta);
    container.append(link);
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function setNotificationBadge(count) {
  if (!notificationBadge) return;
  const number = Number(count) || 0;
  notificationBadge.hidden = number <= 0;
  notificationBadge.textContent = number > 99 ? "99+" : String(number);
}

function syncNotificationUnreadCount(count) {
  lastNotificationUnreadCount = Number(count) || 0;
  notificationUnreadCountReady = true;
  setNotificationBadge(lastNotificationUnreadCount);
}

function syncNotificationSoundButton() {
  if (!notificationSoundButton) return;
  notificationSoundButton.textContent = notificationSoundEnabled ? "ON" : "OFF";
  notificationSoundButton.classList.toggle("active", notificationSoundEnabled);
}

function syncNotificationVolumeControl() {
  notificationAudio.volume = notificationVolume;
  if (notificationVolumeInput) notificationVolumeInput.value = String(Math.round(notificationVolume * 100));
  if (notificationVolumeValue) notificationVolumeValue.textContent = `${Math.round(notificationVolume * 100)}%`;
}

function changeNotificationVolume(value, preview = false) {
  const nextVolume = Number(value) / 100;
  notificationVolume = Number.isFinite(nextVolume) ? Math.max(0, Math.min(1, nextVolume)) : 0.2;
  localStorage.setItem("bbibbi-notification-volume", String(notificationVolume));
  syncNotificationVolumeControl();
  if (preview && notificationSoundEnabled && notificationVolume > 0) {
    unlockNotificationSound().then(playNotificationSound);
  }
}

function getNotificationAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!notificationAudioContext) notificationAudioContext = new AudioContextClass();
  return notificationAudioContext;
}

async function unlockNotificationSound() {
  const context = getNotificationAudioContext();
  if (context?.state === "suspended") await context.resume().catch(() => {});
  if (notificationAudio.dataset.unlocked) return;
  const originalVolume = notificationAudio.volume;
  notificationAudio.volume = 0;
  await notificationAudio.play().then(() => {
    notificationAudio.pause();
    notificationAudio.currentTime = 0;
    notificationAudio.dataset.unlocked = "true";
  }).catch(() => {});
  notificationAudio.volume = originalVolume;
}

function playNotificationSound() {
  if (!notificationSoundEnabled || notificationVolume <= 0) return;
  const audio = notificationAudio.cloneNode(true);
  audio.volume = notificationAudio.volume;
  audio.play().catch(() => playFallbackNotificationTone());
}

function playFallbackNotificationTone() {
  const context = getNotificationAudioContext();
  if (!context || context.state !== "running") return;

  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, start);
  oscillator.frequency.exponentialRampToValueAtTime(1320, start + 0.08);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.12 * notificationVolume), start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.24);
}

function toggleNotificationSound() {
  notificationSoundEnabled = !notificationSoundEnabled;
  localStorage.setItem("bbibbi-notification-sound", notificationSoundEnabled ? "on" : "off");
  syncNotificationSoundButton();
  unlockNotificationSound().then(() => {
    if (notificationSoundEnabled) playNotificationSound();
  });
}

function testNotificationSound() {
  unlockNotificationSound().then(playNotificationSound);
}

function escapeInlineHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderNotificationMessage(message) {
  const safeMessage = escapeInlineHtml(message || "새 알림이 있습니다.");
  return safeMessage.replace(/@([가-힣A-Za-z0-9_-]{1,30})/g, '<span class="notification-mention-chip">@$1</span>');
}

function applyNotificationStyle(node, notification) {
  node.classList.toggle("is-mention", notification?.type === "mention" || /@/.test(notification?.message || ""));
}

function renderNotificationList(notifications = []) {
  if (!notificationList) return;
  notificationList.innerHTML = "";

  if (!notifications.length) {
    const empty = document.createElement("p");
    empty.className = "account-empty";
    empty.textContent = "알림이 없습니다.";
    notificationList.append(empty);
    return;
  }

  notifications.forEach((notification) => {
    const item = document.createElement("div");
    const link = document.createElement("a");
    const title = document.createElement("strong");
    const meta = document.createElement("small");
    const deleteButton = document.createElement("button");

    item.className = "notification-row";
    link.className = "account-history-item notification-item";
    link.classList.toggle("unread", !notification.readAt);
    applyNotificationStyle(link, notification);
    link.href = `/board/post?id=${encodeURIComponent(notification.postId || notification.targetId)}`;
    title.innerHTML = renderNotificationMessage(notification.message);
    meta.textContent = [notification.postTitle, formatFeedDate(notification.createdAt)].filter(Boolean).join(" · ");
    deleteButton.className = "notification-delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "삭제";
    deleteButton.setAttribute("aria-label", "알림 삭제");
    deleteButton.addEventListener("click", () => deleteNotification(notification.id));
    link.append(title, meta);
    item.append(link, deleteButton);
    notificationList.append(item);
  });
}

function renderNotificationPanelList(notifications = []) {
  if (!notificationPanelList) return;
  notificationPanelList.innerHTML = "";

  if (!notifications.length) {
    const empty = document.createElement("p");
    empty.className = "account-empty";
    empty.textContent = "알림이 없습니다.";
    notificationPanelList.append(empty);
    return;
  }

  notifications.slice(0, 8).forEach((notification) => {
    const link = document.createElement("a");
    const title = document.createElement("strong");
    const meta = document.createElement("small");
    link.className = "notification-panel-item";
    link.classList.toggle("unread", !notification.readAt);
    applyNotificationStyle(link, notification);
    link.href = `/board/post?id=${encodeURIComponent(notification.postId || notification.targetId)}`;
    title.innerHTML = renderNotificationMessage(notification.message);
    meta.textContent = [notification.postTitle, formatFeedDate(notification.createdAt)].filter(Boolean).join(" · ");
    link.append(title, meta);
    notificationPanelList.append(link);
  });
}

async function loadNotificationPanel() {
  if (!currentUser?.loggedIn) {
    renderNotificationPanelList([]);
    return;
  }
  const response = await fetch("/api/me/notifications").catch(() => null);
  if (!response?.ok) {
    renderNotificationPanelList([]);
    return;
  }
  const data = await response.json().catch(() => ({}));
  syncNotificationUnreadCount(data.unreadCount);
  renderNotificationPanelList(Array.isArray(data.notifications) ? data.notifications : []);
}

async function toggleNotificationPanel(forceOpen) {
  if (!notificationPanel) return;
  if (!currentUser?.loggedIn) {
    openLoginModal();
    return;
  }
  const willOpen = typeof forceOpen === "boolean" ? forceOpen : notificationPanel.hidden;
  notificationPanel.hidden = !willOpen;
  notificationTopButton?.setAttribute("aria-expanded", String(willOpen));
  if (willOpen) await loadNotificationPanel();
}

async function loadNotificationBadge() {
  try {
    const response = await fetch("/api/me/notifications");
    if (!response.ok) throw new Error("notifications failed");
    const data = await response.json();
    syncNotificationUnreadCount(data.unreadCount);
  } catch {
    setNotificationBadge(0);
  }
}

function closeNotificationStream() {
  if (!notificationStream) return;
  notificationStream.close();
  notificationStream = null;
}

function connectNotificationStream() {
  if (!window.EventSource || notificationStream || !currentUser?.loggedIn) return;
  notificationStream = new EventSource("/api/me/notifications/stream");
  notificationStream.addEventListener("ready", (event) => {
    const data = JSON.parse(event.data || "{}");
    syncNotificationUnreadCount(data.unreadCount);
  });
  notificationStream.addEventListener("notification", (event) => {
    const data = JSON.parse(event.data || "{}");
    syncNotificationUnreadCount(data.unreadCount);
    if (data.notification) {
      playNotificationSound();
      notificationBroadcastChannel?.postMessage({ type: "notification", notification: data.notification });
    }
    if (!notificationPanel?.hidden) {
      loadNotificationPanel();
    }
    if (!profileModal?.hidden && data.notification) {
      loadAccountDashboard();
    }
  });
  notificationStream.onerror = () => {
    closeNotificationStream();
    window.setTimeout(connectNotificationStream, 5000);
  };
}

async function markNotificationsRead() {
  await fetch("/api/me/notifications/read", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  syncNotificationUnreadCount(0);
  await loadNotificationPanel();
  await loadAccountDashboard();
}

async function deleteNotification(id) {
  if (!id) return;
  const response = await fetch(`/api/me/notifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (response.ok) {
    const data = await response.json().catch(() => ({}));
    setNotificationBadge(data.unreadCount || 0);
    await loadNotificationPanel();
    await loadAccountDashboard();
  }
}

async function clearNotifications() {
  const response = await fetch("/api/me/notifications", {
    method: "DELETE",
  });
  if (response.ok) {
    syncNotificationUnreadCount(0);
    await loadNotificationPanel();
    await loadAccountDashboard();
  }
}

async function pollNotificationsForSound() {
  if (!currentUser?.loggedIn) return;
  const response = await fetch("/api/me/notifications").catch(() => null);
  if (!response?.ok) return;
  const data = await response.json().catch(() => null);
  if (!data) return;

  const unreadCount = Number(data.unreadCount) || 0;
  if (!notificationUnreadCountReady) {
    syncNotificationUnreadCount(unreadCount);
    return;
  }

  if (unreadCount > lastNotificationUnreadCount) {
    const notifications = Array.isArray(data.notifications) ? data.notifications : [];
    playNotificationSound();
    notificationBroadcastChannel?.postMessage({ type: "notification", notification: notifications[0] || { id: `poll-${Date.now()}` } });
  }
  syncNotificationUnreadCount(unreadCount);
}

async function loadAccountDashboard() {
  if (!profileModal || profileModal.hidden || !currentUser?.loggedIn) return;

  if (accountName) appendNameWithRole(accountName, currentUser.displayName || currentUser.username, currentUser.role);
  setAccountText(accountMeta, currentUser.email || getProviderLabel(currentUser.provider));
  if (accountAvatar) accountAvatar.textContent = (currentUser.displayName || currentUser.username || "?").slice(0, 1).toUpperCase();
  renderAccountPostList(accountPostList, [], "불러오는 중...", () => "");
  renderAccountPostList(accountLikedList, [], "불러오는 중...", () => "");

  try {
    const response = await fetchWithTimeout("/api/me/activity");
    if (!response.ok) throw new Error("activity failed");
    const activity = await response.json();
    const user = activity.user || currentUser;
    const stats = activity.stats || {};
    const recentPosts = Array.isArray(activity.recentPosts) ? activity.recentPosts : [];
    const likedPosts = Array.isArray(activity.likedPosts) ? activity.likedPosts : guides.filter(isVotedGuide).slice(0, 8);
    const bookmarkedPosts = Array.isArray(activity.bookmarkedPosts) ? activity.bookmarkedPosts : [];
    const comments = Array.isArray(activity.comments) ? activity.comments : [];
    const notifications = Array.isArray(activity.notifications) ? activity.notifications : [];
    const displayName = user.displayName || user.username || currentUser.displayName || currentUser.username || "-";

    if (accountName) appendNameWithRole(accountName, displayName, user.role);
    setAccountText(accountMeta, [user.email, getProviderLabel(user.provider)].filter(Boolean).join(" · "));
    if (accountAvatar) accountAvatar.textContent = displayName.slice(0, 1).toUpperCase();
    setAccountText(accountStatPosts, formatNumber(Number(stats.postCount) || 0));
    setAccountText(accountStatViews, formatNumber(Number(stats.viewCount) || 0));
    setAccountText(accountStatVotes, formatNumber(Number(stats.voteCount) || 0));
    setAccountText(accountStatComments, formatNumber(Number(stats.commentCount) || 0));
    setAccountText(accountUsername, user.username || currentUser.username);
    setAccountText(accountEmail, user.email || "등록된 이메일 없음");
    setAccountText(accountProvider, getProviderLabel(user.provider));
    setAccountText(accountRole, getAccountRoleLabel(user));
    setAccountText(accountCreatedAt, formatFeedDate(user.createdAt));
    setAccountText(accountPostPermission, user.canWritePosts ? "ON" : "차단");
    setAccountText(accountAdminPermission, user.canAccessAdminDb ? "ON" : user.canManageGuild ? "족보" : "OFF");
    setNotificationBadge(activity.unreadNotificationCount);
    renderNotificationList(notifications);

    renderAccountPostList(
      accountPostList,
      recentPosts,
      "아직 작성한 글이 없습니다.",
      (post) => `${formatFeedDate(post.createdAt)} · 조회 ${formatNumber(Number(post.views) || 0)} · 추천 ${formatNumber(Number(post.votes) || 0)}`,
    );
    renderAccountPostList(
      accountLikedList,
      likedPosts,
      "좋아요 누른 글이 없습니다.",
      (post) => `${formatFeedDate(post.votedAt || post.createdAt)} · 추천 ${formatNumber(Number(post.votes) || 0)}`,
    );
    renderAccountPostList(
      accountBookmarkList,
      bookmarkedPosts,
      "아직 북마크한 글이 없습니다.",
      (post) => `${formatFeedDate(post.bookmarkedAt || post.createdAt)} · 조회 ${formatNumber(Number(post.views) || 0)} · 추천 ${formatNumber(Number(post.votes) || 0)}`,
    );

    if (accountCommentList) {
      renderAccountPostList(
        accountCommentList,
        comments,
        "아직 작성한 댓글이 없습니다.",
        (comment) => `${comment.postTitle || "게시글"} · ${formatFeedDate(comment.createdAt)}`,
        (comment) => `/board/post?id=${encodeURIComponent(comment.postId)}`,
      );
    }
  } catch {
    renderAccountPostList(accountPostList, [], "내 정보를 불러오지 못했습니다.", () => "");
    renderAccountPostList(accountLikedList, [], "내 정보를 불러오지 못했습니다.", () => "");
  }
}

async function loadAccountBookmarks() {
  if (!profileModal || profileModal.hidden || !currentUser?.loggedIn || !accountBookmarkList) return;
  renderAccountPostList(accountBookmarkList, [], "불러오는 중...", () => "");

  try {
    const response = await fetchWithTimeout("/api/me/bookmarks");
    if (!response.ok) throw new Error("bookmarks failed");
    const data = await response.json();
    const bookmarkedPosts = Array.isArray(data.bookmarkedPosts) ? data.bookmarkedPosts : [];
    renderAccountPostList(
      accountBookmarkList,
      bookmarkedPosts,
      "아직 북마크한 글이 없습니다.",
      (post) => `${formatFeedDate(post.bookmarkedAt || post.createdAt)} · 조회 ${formatNumber(Number(post.views) || 0)} · 추천 ${formatNumber(Number(post.votes) || 0)}`,
    );
  } catch {
    renderAccountPostList(accountBookmarkList, [], "북마크를 불러오지 못했습니다.", () => "");
  }
}

async function submitProfile(event) {
  event.preventDefault();
  const formData = new FormData(profileForm);
  const response = await fetch("/api/me/display-name", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: formData.get("displayName"),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "닉네임 저장 실패" }));
    profileError.textContent = error.error || "닉네임 저장 실패";
    profileError.hidden = false;
    return;
  }

  renderAuthState(await response.json());
  if (profileError) {
    profileError.textContent = "닉네임이 저장되었습니다.";
    profileError.hidden = false;
  }
  loadAccountDashboard();
}

async function logout() {
  await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
  renderAuthState({ loggedIn: false, role: "guest" });
  location.href = "/?loggedout=1";
}

function loadStoredFeed(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(saved) && saved.length ? saved : fallback;
  } catch {
    return fallback;
  }
}

function saveStoredFeed(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function normalizeTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function formatNumber(value) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}만`;
  }
  return value.toLocaleString("ko-KR");
}

function formatFeedDate(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}`;
  }

  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw) ? raw.replace(" ", "T") + "Z" : raw;
  const date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date).map((part) => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
  }

  return raw;
}

function getFilteredGuides() {
  const query = searchInput.value.trim().toLowerCase();

  const filteredGuides = guides.filter((guide) => {
    const haystack = [guide.title, guide.game, guide.summary, guide.body, guide.category, guide.author, guide.authorUsername, guide.tags.join(" ")]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const guideCategory = normalizeBoard(guide.category);
    const matchesCategory = activeCategory === popularBoardCategory
      ? !overviewExcludedCategories.has(guideCategory) && Number(guide.votes || 0) > 0
      : activeCategory === "전체"
        ? !overviewExcludedCategories.has(guideCategory)
        : guideCategory === activeCategory;
    return matchesQuery && matchesCategory;
  });

  if (activeCategory === popularBoardCategory) {
    return filteredGuides.sort((left, right) => {
      const voteDiff = Number(right.votes || 0) - Number(left.votes || 0);
      if (voteDiff) return voteDiff;
      const viewDiff = Number(right.views || 0) - Number(left.views || 0);
      if (viewDiff) return viewDiff;
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
  }

  return filteredGuides.sort((left, right) => {
    const orderDiff = Number(right.sortOrder || 0) - Number(left.sortOrder || 0);
    if (orderDiff) return orderDiff;
    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  });
}

function ensureGuideAdminMenu() {
  if (guideAdminMenu) return guideAdminMenu;
  const menu = document.createElement("div");
  const title = document.createElement("strong");
  const select = document.createElement("select");
  const moveButton = document.createElement("button");
  const editButton = document.createElement("button");
  const topButton = document.createElement("button");
  const resetButton = document.createElement("button");
  const hideButton = document.createElement("button");
  const deleteButton = document.createElement("button");

  menu.className = "guide-admin-menu";
  menu.hidden = true;
  title.textContent = "게시글 관리";
  select.dataset.adminMenuCategory = "true";
  adminManageCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.append(option);
  });

  moveButton.type = "button";
  moveButton.textContent = "선택 게시판으로 이동";
  moveButton.dataset.adminAction = "move";
  editButton.type = "button";
  editButton.textContent = "수정 화면 열기";
  editButton.dataset.adminAction = "edit";
  topButton.type = "button";
  topButton.textContent = "목록 맨 위로";
  topButton.dataset.adminAction = "top";
  resetButton.type = "button";
  resetButton.textContent = "순서 고정 해제";
  resetButton.dataset.adminAction = "reset";
  hideButton.type = "button";
  hideButton.textContent = "숨기기";
  hideButton.dataset.adminAction = "hide";
  deleteButton.type = "button";
  deleteButton.textContent = "삭제";
  deleteButton.dataset.adminAction = "delete";
  deleteButton.className = "danger";

  menu.append(title, select, moveButton, editButton, topButton, resetButton, hideButton, deleteButton);
  menu.addEventListener("click", handleGuideAdminMenuClick);
  document.body.append(menu);
  guideAdminMenu = menu;
  return menu;
}

function openGuideAdminMenu(guide, event) {
  if (!canQuickManagePosts()) return;
  event.preventDefault();
  event.stopPropagation();
  guideAdminMenuGuide = guide;
  const menu = ensureGuideAdminMenu();
  const select = menu.querySelector("[data-admin-menu-category]");
  if (select) select.value = adminManageCategories.includes(normalizeBoard(guide.category)) ? normalizeBoard(guide.category) : adminManageCategories[0];
  menu.hidden = false;
  const padding = 12;
  const rect = menu.getBoundingClientRect();
  const left = Math.min(event.clientX, window.innerWidth - rect.width - padding);
  const top = Math.min(event.clientY, window.innerHeight - rect.height - padding);
  menu.style.left = `${Math.max(padding, left)}px`;
  menu.style.top = `${Math.max(padding, top)}px`;
}

function closeGuideAdminMenu() {
  if (guideAdminMenu) guideAdminMenu.hidden = true;
  guideAdminMenuGuide = null;
}

async function quickManagePost(id, payload) {
  const response = await fetch(`/api/admin/posts/${encodeURIComponent(id)}/quick`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "게시글을 변경하지 못했습니다.");
  }
  return response.json();
}

async function handleGuideAdminMenuClick(event) {
  const button = event.target.closest("[data-admin-action]");
  if (!button || !guideAdminMenuGuide) return;
  const guide = guideAdminMenuGuide;
  const action = button.dataset.adminAction;
  try {
    if (action === "edit") {
      location.href = `/board/post?id=${encodeURIComponent(guide.id)}`;
      return;
    }
    if (action === "move") {
      const category = guideAdminMenu.querySelector("[data-admin-menu-category]")?.value || "";
      const updated = await quickManagePost(guide.id, { category, status: "published" });
      guides = guides.map((item) => (item.id === guide.id ? { ...item, ...updated } : item));
    } else if (action === "top") {
      const updated = await quickManagePost(guide.id, { orderAction: "top" });
      guides = guides.map((item) => (item.id === guide.id ? { ...item, ...updated } : item));
    } else if (action === "reset") {
      const updated = await quickManagePost(guide.id, { orderAction: "reset" });
      guides = guides.map((item) => (item.id === guide.id ? { ...item, ...updated } : item));
    } else if (action === "hide") {
      if (!confirm("이 게시글을 목록에서 숨길까요?")) return;
      await quickManagePost(guide.id, { status: "hidden" });
      guides = guides.filter((item) => item.id !== guide.id);
    } else if (action === "delete") {
      if (!confirm("이 게시글을 삭제 처리할까요?")) return;
      await quickManagePost(guide.id, { status: "deleted" });
      guides = guides.filter((item) => item.id !== guide.id);
    }
    closeGuideAdminMenu();
    renderGuides();
  } catch (error) {
    alert(error.message || "게시글 관리에 실패했습니다.");
  }
}

function renderGuides() {
  guideList.innerHTML = "";
  const visibleGuides = getFilteredGuides();
  const currentBoard = boardInfo[activeCategory] || boardInfo.전체;
  const activeGroup = getBoardGroup(activeCategory) || "overview";
  const totalPages = Math.max(1, Math.ceil(visibleGuides.length / boardPageSize));
  boardPage = Math.min(Math.max(1, boardPage), totalPages);
  const pageStart = (boardPage - 1) * boardPageSize;
  const pageGuides = visibleGuides.slice(pageStart, pageStart + boardPageSize);

  renderHeroMode();
  renderCategoryTabs();
  boardTitle.textContent = currentBoard.title;
  boardDesc.textContent = currentBoard.desc;
  boardCount.textContent = `${visibleGuides.length}개`;
  sideBoardLinks.forEach((link) => {
    const linkBoard = normalizeBoard(link.dataset.boardLink);
    const linkGroup = link.dataset.boardGroup || getBoardGroup(linkBoard);
    const isActive = linkBoard === activeCategory || (linkGroup && linkGroup === getBoardGroup(activeCategory));
    link.classList.toggle("active", isActive);
  });
  categoryStrip?.classList.toggle("board-tabs", activeGroup !== "overview");
  renderBoardPulse(visibleGuides);
  renderBoardPager(visibleGuides.length, totalPages);

  if (!visibleGuides.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "조건에 맞는 공략이 없습니다.";
    guideList.append(empty);
    renderSideLists();
    return;
  }

  pageGuides.forEach((guide) => {
    const row = document.createElement("article");
    const status = document.createElement("span");
    const main = document.createElement("a");
    const title = document.createElement("h3");
    const comment = document.createElement("span");
    const summary = document.createElement("p");
    const meta = document.createElement("div");
    const author = document.createElement("span");
    const stats = document.createElement("div");
    const voteButton = document.createElement("button");
    const time = document.createElement("span");
    const views = document.createElement("span");

    row.className = "guide-row";
    row.dataset.postId = guide.id;
    row.addEventListener("contextmenu", (event) => openGuideAdminMenu(guide, event));
    status.className = "status";
    main.className = "guide-main";
    main.href = `/board/post?id=${encodeURIComponent(guide.id)}`;
    meta.className = "meta";
    stats.className = "guide-stats";
    voteButton.className = "vote-button";
    voteButton.type = "button";
    voteButton.textContent = voted.has(guide.id) ? "추천됨" : "추천";
    voteButton.classList.toggle("active", voted.has(guide.id));
    voteButton.addEventListener("click", () => toggleVote(guide.id));

    const displayCategory = normalizeBoard(guide.category);
    status.textContent = displayCategory === "파괴신" ? "파괴신" : displayCategory;
    applyTagColor(status, displayCategory);
    title.textContent = guide.title;
    comment.textContent = ` (${guide.comments || 0})`;
    summary.textContent = guide.summary;
    time.textContent = formatFeedDate(guide.createdAt);
    views.textContent = `조회 ${formatNumber(guide.views || guide.votes)}`;
    appendNameWithRole(author, guide.author || guide.authorUsername || "익명", guide.authorRole);

    title.append(comment);
    meta.append(author);
    if (guide.game) {
      const node = document.createElement("span");
      node.textContent = guide.game;
      meta.append(node);
    }
    if (Array.isArray(guide.tags) && guide.tags.length) {
      const tags = document.createElement("span");
      tags.className = "guide-tags";
      guide.tags.slice(0, 4).forEach((tag) => {
        const tagNode = document.createElement("b");
        tagNode.className = "tag-chip";
        tagNode.textContent = `#${tag}`;
        applyTagColor(tagNode, tag);
        tags.append(tagNode);
      });
      meta.append(tags);
    }

    main.append(title, summary, meta);
    stats.append(voteButton, time, views);
    row.append(status, main, stats);
    guideList.append(row);
  });

  renderSideLists();
}

function renderBoardPager(totalItems, totalPages) {
  if (!boardPager) return;
  boardPager.innerHTML = "";
  boardPager.hidden = totalItems <= boardPageSize;
  if (boardPager.hidden) return;

  const makeButton = (label, page, options = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = options.disabled || false;
    button.classList.toggle("active", options.active || false);
    button.addEventListener("click", () => {
      if (button.disabled || boardPage === page) return;
      boardPage = page;
      renderGuides();
      document.querySelector("#guides")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return button;
  };

  const status = document.createElement("span");
  status.textContent = `${boardPage} / ${totalPages}`;
  boardPager.append(
    makeButton("이전", Math.max(1, boardPage - 1), { disabled: boardPage === 1 }),
    status,
  );

  const pages = new Set([1, totalPages, boardPage - 1, boardPage, boardPage + 1].filter((page) => page >= 1 && page <= totalPages));
  [...pages].sort((a, b) => a - b).forEach((page) => {
    boardPager.append(makeButton(String(page), page, { active: page === boardPage }));
  });

  boardPager.append(makeButton("다음", Math.min(totalPages, boardPage + 1), { disabled: boardPage === totalPages }));
}

function renderBoardPulse(items) {
  const postCount = items.length;
  const voteTotal = items.reduce((sum, guide) => sum + (Number(guide.votes) || 0), 0);
  const viewTotal = items.reduce((sum, guide) => sum + (Number(guide.views) || 0), 0);

  if (boardPulseScore) {
    boardPulseScore.innerHTML = `${formatNumber(postCount)}<small>글</small>`;
  }
  if (boardVoteTotal) boardVoteTotal.textContent = formatNumber(voteTotal);
  if (boardViewTotal) boardViewTotal.textContent = formatNumber(viewTotal);
  if (boardPulseText) {
    boardPulseText.textContent = postCount
      ? `${activeCategory} 기준 추천 ${formatNumber(voteTotal)}개, 조회 ${formatNumber(viewTotal)}회`
      : `${activeCategory}에 아직 게시글이 없습니다.`;
  }

  if (!boardSparkline) return;
  boardSparkline.innerHTML = "";
  const bars = items.slice(0, 11);
  const fallback = [18, 34, 48, 30, 62, 42, 76, 36, 52, 44, 68];
  const maxScore = Math.max(1, ...bars.map((guide) => (Number(guide.views) || 0) + (Number(guide.votes) || 0) * 4));
  const heights = bars.length
    ? bars.map((guide) => Math.max(14, (((Number(guide.views) || 0) + (Number(guide.votes) || 0) * 4) / maxScore) * 100))
    : fallback;

  heights.forEach((height) => {
    const bar = document.createElement("i");
    bar.style.height = `${height}%`;
    boardSparkline.append(bar);
  });
}

function renderSideLists() {
  const ranked = [...guides].sort((a, b) => b.votes - a.votes).slice(0, 5);
  rankingList.innerHTML = "";
  hotList.innerHTML = "";

  ranked.forEach((guide, index) => {
    const item = document.createElement("li");
    const order = document.createElement("i");
    const title = document.createElement("span");
    const count = document.createElement("b");

    order.textContent = index + 1;
    title.textContent = `# ${normalizeBoard(guide.category)}`;
    count.textContent = `${formatNumber(guide.votes)} 게시글`;
    item.append(order, title, count);
    rankingList.append(item);
  });

  ranked.slice(0, 3).forEach((guide) => {
    const item = document.createElement("article");
    const thumb = document.createElement("div");
    const text = document.createElement("div");
    const title = document.createElement("a");
    const meta = document.createElement("small");

    item.className = "hot-item";
    thumb.className = "thumb";
    title.href = `/board/post?id=${encodeURIComponent(guide.id)}`;
    title.textContent = guide.title;
    meta.textContent = `조회 ${formatNumber(guide.views || guide.votes)}  추천 ${formatNumber(guide.votes)}`;
    text.append(title, meta);
    item.append(thumb, text);
    hotList.append(item);
  });

  renderFeedList({
    endpoint: "/api/notices",
    storageKey: noticeStorageKey,
    fallback: seedNotices,
    listElement: noticeList,
    sourceLink: noticeSourceLink,
    statusElement: noticeStatus,
    boardLink: feedLinks.notices,
  });
  renderFeedList({
    endpoint: "/api/dev-notes",
    storageKey: devNoteStorageKey,
    fallback: seedDevNotes,
    listElement: devNoteList,
    sourceLink: devNoteSourceLink,
    statusElement: devNoteStatus,
    boardLink: feedLinks.devNotes,
  });
}

function importantNoticeDismissKey(notice) {
  const stamp = String(notice.updatedAt || notice.title || "default").slice(0, 32);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  return `bbibbi-important-notice:${stamp}:${today}`;
}

function closeImportantNotice() {
  if (!importantNoticeModal) return;
  importantNoticeModal.hidden = true;
  document.body.classList.remove("important-notice-open");
}

function showImportantNotice(notice) {
  if (!importantNoticeModal || !notice?.enabled) return;
  importantNoticeLoaded = true;
  const dismissKey = importantNoticeDismissKey(notice);
  if (localStorage.getItem(dismissKey) === "hidden") return;

  if (importantNoticeEyebrowText) importantNoticeEyebrowText.textContent = notice.eyebrow || "삐삐 공지사항";
  if (importantNoticeTitleText) importantNoticeTitleText.textContent = notice.title || "중요 공지사항";
  if (importantNoticeBody) {
    importantNoticeBody.innerHTML = "";
    String(notice.content || "")
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .forEach((paragraph) => {
        const p = document.createElement("p");
        p.textContent = paragraph;
        importantNoticeBody.append(p);
      });
  }
  if (importantNoticeImages) {
    importantNoticeImages.innerHTML = "";
    const imageUrls = (Array.isArray(notice.imageUrls) && notice.imageUrls.length ? notice.imageUrls : [notice.imageUrl])
      .map((url) => String(url || "").trim())
      .filter(Boolean)
      .slice(0, 6);
    importantNoticeImages.hidden = !imageUrls.length;
    imageUrls.forEach((url) => {
      const image = document.createElement("img");
      image.src = url;
      image.alt = "";
      importantNoticeImages.append(image);
    });
  }
  if (importantNoticeActionLink) {
    importantNoticeActionLink.hidden = !(notice.actionLabel && notice.actionUrl);
    importantNoticeActionLink.textContent = notice.actionLabel || "자세히 보기";
    importantNoticeActionLink.href = notice.actionUrl || "#";
  }
  importantNoticeHideTodayButton?.addEventListener("click", () => {
    localStorage.setItem(dismissKey, "hidden");
    closeImportantNotice();
  }, { once: true });
  importantNoticeModal.hidden = false;
  document.body.classList.add("important-notice-open");
}

async function loadImportantNotice() {
  if (importantNoticeLoaded) return;
  try {
    const response = await fetch("/api/important-notice");
    if (!response.ok) return;
    const data = await response.json();
    showImportantNotice(data.notice);
  } catch {
    // 공지 팝업은 실패해도 메인 이용을 막지 않습니다.
  }
}

async function getFeedItems(endpoint, storageKey, fallback) {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("feed request failed");
    const items = await response.json();
    if (!Array.isArray(items) || !items.length) throw new Error("empty feed");
    saveStoredFeed(storageKey, items);
    return { items, source: "api" };
  } catch {
    const saved = loadStoredFeed(storageKey, fallback);
    return { items: saved, source: saved === fallback ? "fallback" : "cache" };
  }
}

async function renderFeedList({ endpoint, storageKey, fallback, listElement, sourceLink, statusElement, boardLink }) {
  if (!listElement) return;

  if (statusElement) {
    statusElement.textContent = "";
    statusElement.dataset.state = "loading";
    statusElement.setAttribute("aria-label", "대기중");
    statusElement.title = "대기중";
  }

  const result = await getFeedItems(endpoint, storageKey, fallback);
  const items = result.items.slice(0, 5);
  listElement.innerHTML = "";

  if (statusElement) {
    const statusText = {
      api: "연결됨",
      cache: "연결안됨",
      fallback: "연결안됨",
      loading: "대기중",
    };
    const label = statusText[result.source] || "연결안됨";
    statusElement.textContent = "";
    statusElement.dataset.state = result.source;
    statusElement.setAttribute("aria-label", label);
    statusElement.title = label;
  }

  items.forEach((item) => {
    const link = document.createElement("a");
    const thumb = document.createElement("span");
    const image = document.createElement("img");
    const text = document.createElement("span");
    const title = document.createElement("span");
    const date = document.createElement("small");

    link.href = item.link || item.url || "#";
    if (link.href && !link.href.endsWith("#")) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    thumb.className = "notice-thumb";
    text.className = "notice-text";
    title.textContent = item.title || "제목 없음";
    date.textContent = [item.writer, formatFeedDate(item.date), item.views ? `조회 ${formatNumber(item.views)}` : ""]
      .filter(Boolean)
      .join(" · ");

    if (item.thumbnail) {
      image.src = item.thumbnail;
      image.alt = "";
      thumb.append(image);
    }

    text.append(title, date);
    link.append(thumb, text);
    listElement.append(link);
  });

  if (sourceLink && boardLink) {
    sourceLink.href = boardLink;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener";
  }
}

async function toggleVote(id) {
  const guide = guides.find((item) => item.id === id);
  if (!guide) return;

  try {
    const response = await fetch(`/api/posts/${encodeURIComponent(id)}/vote`, { method: "POST" });
    if (!response.ok) throw new Error("vote failed");
    const result = await response.json();
    if (result.voted) voted.add(id);
    else voted.delete(id);
    if (result.post) {
      Object.assign(guide, result.post);
    }
  } catch {
    if (voted.has(id)) {
      voted.delete(id);
      guide.votes = Math.max(0, guide.votes - 1);
    } else {
      voted.add(id);
      guide.votes += 1;
    }
  }

  saveGuides();
  saveVotes();
  renderGuides();
}

searchInput.addEventListener("input", () => {
  boardPage = 1;
  renderGuides();
});

sideBoardLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveCategory(link.dataset.boardLink, { scroll: true });
  });
});

window.addEventListener("popstate", () => {
  const board = normalizeBoard(getBoardFromPath() || new URLSearchParams(location.search).get("board"));
  activeCategory = boardInfo[board] && board !== "공지사항" ? board : "전체";
  boardPage = 1;
  renderGuides();
});

providerLoginOpenButton?.addEventListener("click", openLoginModal);
mobileLoginButton?.addEventListener("click", openLoginModal);
guestLoginFallbackButton?.addEventListener("click", openLoginModal);
loginCloseButton?.addEventListener("click", closeLoginModal);
loginForm?.addEventListener("submit", submitLogin);
profileButton?.addEventListener("click", openProfileModal);
profileCloseButton?.addEventListener("click", closeProfileModal);
profileForm?.addEventListener("submit", submitProfile);
notificationTopButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleNotificationPanel();
});
notificationPanel?.addEventListener("click", (event) => event.stopPropagation());
notificationPanelReadButton?.addEventListener("click", markNotificationsRead);
notificationPanelProfileButton?.addEventListener("click", () => {
  toggleNotificationPanel(false);
  openProfileModal();
});
notificationReadButton?.addEventListener("click", markNotificationsRead);
notificationClearButton?.addEventListener("click", clearNotifications);
notificationSoundButton?.addEventListener("click", toggleNotificationSound);
notificationSoundTestButton?.addEventListener("click", testNotificationSound);
notificationVolumeInput?.addEventListener("input", () => changeNotificationVolume(notificationVolumeInput.value));
notificationVolumeInput?.addEventListener("change", () => changeNotificationVolume(notificationVolumeInput.value, true));
heroPrevButton?.addEventListener("click", () => setHeroSlide(heroSlideIndex - 1, { direction: "prev" }));
heroNextButton?.addEventListener("click", () => setHeroSlide(heroSlideIndex + 1, { direction: "next" }));
logoutButton?.addEventListener("click", logout);
document.addEventListener("click", () => {
  closeGuideAdminMenu();
  if (!notificationPanel?.hidden) toggleNotificationPanel(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeGuideAdminMenu();
});
signupButton?.addEventListener("click", () => {
  openSignupModal();
});
roleText?.addEventListener("click", (event) => {
  event.preventDefault();
  if (roleText.textContent === "회원가입") openSignupModal();
});
signupCloseButton?.addEventListener("click", closeSignupModal);
signupToLoginButton?.addEventListener("click", () => {
  closeSignupModal();
  openLoginModal();
});
signupForm?.addEventListener("submit", submitSignup);
syncNotificationSoundButton();
syncNotificationVolumeControl();
window.setInterval(pollNotificationsForSound, 8000);
document.addEventListener("pointerdown", unlockNotificationSound, { once: true });
document.addEventListener("keydown", unlockNotificationSound, { once: true });
document.querySelectorAll("[data-provider-soon]").forEach((button) => {
  button.addEventListener("click", () => showProviderSoon(button.dataset.providerSoon));
});
loginModal?.addEventListener("click", (event) => {
  if (event.target === loginModal) closeLoginModal();
});
signupModal?.addEventListener("click", (event) => {
  if (event.target === signupModal) closeSignupModal();
});
profileModal?.addEventListener("click", (event) => {
  if (event.target === profileModal) closeProfileModal();
});
importantNoticeCloseButton?.addEventListener("click", closeImportantNotice);
importantNoticeConfirmButton?.addEventListener("click", closeImportantNotice);
importantNoticeModal?.addEventListener("click", (event) => {
  if (event.target === importantNoticeModal) closeImportantNotice();
});

window.addEventListener("focus", () => {
  Promise.all([loadBoardTagColors(), loadGuidesFromServer()]).then(renderGuides);
});

fetchCurrentUser().then(renderAuthState);
Promise.all([loadBoardTagColors(), loadGuidesFromServer()]).then(renderGuides);
loadMainHeroSettings();
loadImportantNotice();
