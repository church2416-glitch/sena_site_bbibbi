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
const categoryButtons = [...document.querySelectorAll("[data-filter]")];
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
const kakaoLoginButton = document.querySelector("#kakaoLoginButton");
const loginCloseButton = document.querySelector("#loginCloseButton");
const profileCloseButton = document.querySelector("#profileCloseButton");
const signupButton = document.querySelector("#signupButton");
const signupCloseButton = document.querySelector("#signupCloseButton");
const signupToLoginButton = document.querySelector("#signupToLoginButton");
const profileButton = document.querySelector("#profileButton");
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
const importantNoticeImage = document.querySelector("#importantNoticeImage");
const importantNoticeBody = document.querySelector("#importantNoticeBody");
const importantNoticeCloseButton = document.querySelector("#importantNoticeCloseButton");
const importantNoticeConfirmButton = document.querySelector("#importantNoticeConfirmButton");
const importantNoticeHideTodayButton = document.querySelector("#importantNoticeHideTodayButton");
const importantNoticeActionLink = document.querySelector("#importantNoticeActionLink");

const boardInfo = {
  전체: {
    title: "전체 게시판",
    desc: "지금 올라온 공략과 사람들이 주목하는 게시글들",
  },
  베스트: {
    title: "베스트",
    desc: "추천과 조회 흐름이 좋은 게시글",
  },
  "자유 게시판": {
    title: "자유 게시판",
    desc: "자유롭게 글을 올리는 게시판",
  },
  "PVE 공략": {
    title: "PVE 공략",
    desc: "일반적인 PVE 공략 공간",
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
  "데미지 고급": {
    title: "데미지 고급",
    desc: "딜 계산, 장비 효율, 세팅 심화 공략",
  },
  "아이템 고급": {
    title: "아이템 고급",
    desc: "장비, 장신구, 세공, 재화 운용 심화 공략",
  },
};

const initialBoard = new URLSearchParams(location.search).get("board");
let activeCategory = boardInfo[initialBoard] ? initialBoard : "전체";
let guides = loadGuides();
let voted = new Set(JSON.parse(localStorage.getItem(votedKey) || "[]"));
let currentUser = { loggedIn: false, role: "guest" };
let notificationStream = null;
let notificationSoundEnabled = localStorage.getItem("bbibbi-notification-sound") !== "off";
let notificationVolume = Number(localStorage.getItem("bbibbi-notification-volume"));
if (!Number.isFinite(notificationVolume)) notificationVolume = 0.2;
notificationVolume = Math.max(0, Math.min(1, notificationVolume));
let notificationAudioContext = null;
const notificationBroadcastChannel = "BroadcastChannel" in window ? new BroadcastChannel("bbibbi-notifications") : null;
const notificationAudio = new Audio("assets/sound/notification-pling.mp3");
notificationAudio.preload = "auto";
notificationAudio.volume = notificationVolume;
let notificationUnreadCountReady = false;
let lastNotificationUnreadCount = 0;

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
    loginStateText.innerHTML = user?.loggedIn
      ? `${roleLabel}<br />${displayName}`
      : "로그인하고<br />댓글과 공략글을";
  }
  if (providerLoginOpenButton) providerLoginOpenButton.hidden = Boolean(user?.loggedIn);
  if (mobileLoginButton) mobileLoginButton.hidden = Boolean(user?.loggedIn);
  if (adminDashboardLink) adminDashboardLink.hidden = !isAdmin;
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: formData.get("username"),
      password: formData.get("password"),
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

function renderAccountPostList(container, items, emptyText, metaBuilder, hrefBuilder = (item) => `post.html?id=${encodeURIComponent(item.id)}`) {
  if (!container) return;
  container.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "account-empty";
    empty.textContent = emptyText;
    container.append(empty);
    return;
  }

  items.forEach((post) => {
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
    link.href = `post.html?id=${encodeURIComponent(notification.postId || notification.targetId)}`;
    title.textContent = notification.message || "새 알림이 있습니다.";
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
    await loadAccountDashboard();
  }
}

async function clearNotifications() {
  const response = await fetch("/api/me/notifications", {
    method: "DELETE",
  });
  if (response.ok) {
    syncNotificationUnreadCount(0);
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

  setAccountText(accountName, currentUser.displayName || currentUser.username);
  setAccountText(accountMeta, currentUser.email || getProviderLabel(currentUser.provider));
  if (accountAvatar) accountAvatar.textContent = (currentUser.displayName || currentUser.username || "?").slice(0, 1).toUpperCase();
  renderAccountPostList(accountPostList, [], "불러오는 중...", () => "");
  renderAccountPostList(accountLikedList, [], "불러오는 중...", () => "");

  try {
    const response = await fetch("/api/me/activity");
    if (!response.ok) throw new Error("activity failed");
    const activity = await response.json();
    const user = activity.user || currentUser;
    const stats = activity.stats || {};
    const recentPosts = Array.isArray(activity.recentPosts) ? activity.recentPosts : [];
    const likedPosts = Array.isArray(activity.likedPosts) ? activity.likedPosts : guides.filter(isVotedGuide).slice(0, 8);
    const comments = Array.isArray(activity.comments) ? activity.comments : [];
    const notifications = Array.isArray(activity.notifications) ? activity.notifications : [];
    const displayName = user.displayName || user.username || currentUser.displayName || currentUser.username || "-";

    setAccountText(accountName, displayName);
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

    if (accountCommentList) {
      renderAccountPostList(
        accountCommentList,
        comments,
        "아직 작성한 댓글이 없습니다.",
        (comment) => `${comment.postTitle || "게시글"} · ${formatFeedDate(comment.createdAt)}`,
        (comment) => `post.html?id=${encodeURIComponent(comment.postId)}`,
      );
    }
  } catch {
    renderAccountPostList(accountPostList, [], "내 정보를 불러오지 못했습니다.", () => "");
    renderAccountPostList(accountLikedList, [], "내 정보를 불러오지 못했습니다.", () => "");
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
  await fetch("/api/logout", { method: "POST" });
  renderAuthState({ loggedIn: false, role: "guest" });
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
    return `${match[1]}.${match[2]}.${match[3]} ${match[4]}:${match[5]}`;
  }

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}.${month}.${day} ${hour}:${minute}`;
  }

  return raw;
}

function getFilteredGuides() {
  const query = searchInput.value.trim().toLowerCase();

  const filteredGuides = guides.filter((guide) => {
    const haystack = [guide.title, guide.game, guide.summary, guide.category, guide.tags.join(" ")]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesCategory = activeCategory === "전체" || activeCategory === "베스트" || guide.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  if (activeCategory === "베스트") {
    return filteredGuides.sort((a, b) => (b.votes || 0) - (a.votes || 0) || (b.views || 0) - (a.views || 0));
  }

  return filteredGuides;
}

function renderGuides() {
  guideList.innerHTML = "";
  const visibleGuides = getFilteredGuides();
  const currentBoard = boardInfo[activeCategory] || boardInfo.전체;

  boardTitle.textContent = currentBoard.title;
  boardDesc.textContent = currentBoard.desc;
  boardCount.textContent = `${visibleGuides.length}개`;
  sideBoardLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.boardLink === activeCategory);
  });
  categoryButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === activeCategory);
  });
  renderBoardPulse(visibleGuides);

  if (!visibleGuides.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "조건에 맞는 공략이 없습니다.";
    guideList.append(empty);
    renderSideLists();
    return;
  }

  visibleGuides.forEach((guide) => {
    const row = document.createElement("article");
    const status = document.createElement("span");
    const main = document.createElement("a");
    const title = document.createElement("h3");
    const comment = document.createElement("span");
    const summary = document.createElement("p");
    const meta = document.createElement("div");
    const stats = document.createElement("div");
    const voteButton = document.createElement("button");
    const time = document.createElement("span");
    const views = document.createElement("span");

    row.className = "guide-row";
    status.className = "status";
    main.className = "guide-main";
    main.href = `post.html?id=${encodeURIComponent(guide.id)}`;
    meta.className = "meta";
    stats.className = "guide-stats";
    voteButton.className = "vote-button";
    voteButton.type = "button";
    voteButton.textContent = voted.has(guide.id) ? "추천됨" : "추천";
    voteButton.classList.toggle("active", voted.has(guide.id));
    voteButton.addEventListener("click", () => toggleVote(guide.id));

    status.textContent = guide.category === "파괴신" ? "파괴신" : "급상승";
    title.textContent = guide.title;
    comment.textContent = ` (${guide.comments || 0})`;
    summary.textContent = guide.summary;
    time.textContent = guide.createdAt;
    views.textContent = `조회 ${formatNumber(guide.views || guide.votes)}`;

    title.append(comment);
    [guide.game, ...guide.tags].forEach((item) => {
      const node = document.createElement("span");
      node.textContent = item;
      meta.append(node);
    });

    main.append(title, summary, meta);
    stats.append(voteButton, time, views);
    row.append(status, main, stats);
    guideList.append(row);
  });

  renderSideLists();
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
    title.textContent = `# ${guide.category}`;
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
    title.href = `post.html?id=${encodeURIComponent(guide.id)}`;
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
  return `bbibbi-important-notice:${stamp}:${new Date().toISOString().slice(0, 10)}`;
}

function closeImportantNotice() {
  if (!importantNoticeModal) return;
  importantNoticeModal.hidden = true;
  document.body.classList.remove("important-notice-open");
}

function showImportantNotice(notice) {
  if (!importantNoticeModal || !notice?.enabled) return;
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
  if (importantNoticeImage) {
    importantNoticeImage.hidden = !notice.imageUrl;
    importantNoticeImage.src = notice.imageUrl || "";
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

searchInput.addEventListener("input", renderGuides);

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.filter;
    history.pushState(null, "", `?board=${encodeURIComponent(activeCategory)}`);
    renderGuides();
  });
});

sideBoardLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    activeCategory = link.dataset.boardLink;
    history.pushState(null, "", `?board=${encodeURIComponent(activeCategory)}`);
    renderGuides();
    document.querySelector("#guides")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

window.addEventListener("popstate", () => {
  const board = new URLSearchParams(location.search).get("board");
  activeCategory = boardInfo[board] ? board : "전체";
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
notificationReadButton?.addEventListener("click", markNotificationsRead);
notificationClearButton?.addEventListener("click", clearNotifications);
notificationSoundButton?.addEventListener("click", toggleNotificationSound);
notificationSoundTestButton?.addEventListener("click", testNotificationSound);
notificationVolumeInput?.addEventListener("input", () => changeNotificationVolume(notificationVolumeInput.value));
notificationVolumeInput?.addEventListener("change", () => changeNotificationVolume(notificationVolumeInput.value, true));
logoutButton?.addEventListener("click", logout);
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
  loadGuidesFromServer().then(renderGuides);
});

fetchCurrentUser().then(renderAuthState);
loadGuidesFromServer().then(renderGuides);
loadImportantNotice();
