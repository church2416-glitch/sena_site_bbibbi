function makeId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const seedGuides = [
  {
    id: makeId(),
    title: "라운일 2공 길드전 족보 정리",
    comments: 32,
    game: "세븐나이츠 리버스",
    category: "길드전 족보",
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
    category: "길드전 족보",
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
    category: "길드전 족보",
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
    title: "쫄작 덱 구성 질문",
    comments: 22,
    game: "세븐나이츠 리버스",
    category: "질문",
    summary: "현재 보유 영웅 기준으로 쫄작 안정성이 안 나와서 조합 조언을 구합니다.",
    tags: ["질문", "쫄작"],
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

const boardInfo = {
  전체: {
    title: "전체 게시판",
    desc: "지금 올라온 공략과 사람들이 주목하는 게시글들",
  },
  "길드전 족보": {
    title: "길드전 족보",
    desc: "공격 조합, 방어덱, 스킬 순서를 빠르게 확인하는 게시글",
  },
  "PVE 공략": {
    title: "PVE 공략",
    desc: "성장 루트, 보스전, 쫄작처럼 반복 플레이에 필요한 공략",
  },
  정보: {
    title: "정보 게시판",
    desc: "패치, 데이터, 시스템 분석을 모아보는 공간",
  },
  질문: {
    title: "질문 게시판",
    desc: "막힌 구간과 선택지를 물어보고 답을 찾는 공간",
  },
  게임: {
    title: "게임 게시판",
    desc: "게임별 소식과 플레이 경험을 나누는 공간",
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
    desc: "게임하다 터진 순간과 짤로 남기고 싶은 장면",
  },
};

let activeCategory = "전체";
let guides = loadGuides();
let voted = new Set(JSON.parse(localStorage.getItem(votedKey) || "[]"));

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

function saveGuides() {
  localStorage.setItem(storageKey, JSON.stringify(guides));
}

function saveVotes() {
  localStorage.setItem(votedKey, JSON.stringify([...voted]));
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

  return guides.filter((guide) => {
    const haystack = [guide.title, guide.game, guide.summary, guide.category, guide.tags.join(" ")]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesCategory = activeCategory === "전체" || guide.category === activeCategory;
    return matchesQuery && matchesCategory;
  });
}

function renderGuides() {
  guideList.innerHTML = "";
  const visibleGuides = getFilteredGuides();
  const currentBoard = boardInfo[activeCategory] || boardInfo.전체;

  boardTitle.textContent = currentBoard.title;
  boardDesc.textContent = currentBoard.desc;
  boardCount.textContent = `${visibleGuides.length}개`;

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

    status.textContent = guide.category === "질문" ? "질문" : "급상승";
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

function toggleVote(id) {
  const guide = guides.find((item) => item.id === id);
  if (!guide) return;

  if (voted.has(id)) {
    voted.delete(id);
    guide.votes = Math.max(0, guide.votes - 1);
  } else {
    voted.add(id);
    guide.votes += 1;
  }

  saveGuides();
  saveVotes();
  renderGuides();
}

searchInput.addEventListener("input", renderGuides);

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.filter;
    categoryButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderGuides();
  });
});

window.addEventListener("focus", () => {
  guides = loadGuides();
  renderGuides();
});

renderGuides();
