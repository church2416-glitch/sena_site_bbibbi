const noticePageList = document.querySelector("#noticePageList");
const noticePageState = document.querySelector("#noticePageState");
const noticePageCount = document.querySelector("#noticePageCount");
const noticePageSource = document.querySelector("#noticePageSource");

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(Number(value) || 0);
}

const roleIconMap = {
  superadmin: { label: "최고관리자", src: "assets/common/최고관리자.png" },
  admin: { label: "관리자", src: "assets/common/관리자.png" },
  elite: { label: "정예", src: "assets/common/정예.png" },
  verified: { label: "정예", src: "assets/common/정예.png" },
  user: { label: "일반", src: "assets/common/일반.png" },
  blocked: { label: "기본", src: "assets/common/기본.png" },
  default: { label: "기본", src: "assets/common/기본.png" },
};

function appendNameWithRole(target, name, role) {
  const icon = roleIconMap[role] || roleIconMap.default;
  const image = document.createElement("img");
  image.className = "role-icon";
  image.src = icon.src;
  image.alt = icon.label;
  image.title = icon.label;
  image.loading = "lazy";
  target.textContent = "";
  target.append(image, document.createTextNode(name || "관리자"));
}

function parseNoticeDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const loungeStamp = raw.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (loungeStamp) {
    const [, year, month, day, hour, minute, second] = loungeStamp;
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`);
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T") + "Z";
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseNoticeDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date).replace(/\.\s?/g, ".").replace(/\.$/, "");
}

function renderEmptyNotice() {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 4;
  cell.className = "notice-empty-cell";
  cell.textContent = "등록된 공지사항이 없습니다.";
  row.append(cell);
  noticePageList.append(row);
  noticePageState.textContent = "0개의 공지사항";
  noticePageCount.textContent = "PAGE 1 OF 1";
}

function renderNotices(items) {
  noticePageList.innerHTML = "";
  if (!items.length) {
    renderEmptyNotice();
    return;
  }

  items.forEach((item, index) => {
    const row = document.createElement("tr");
    const number = document.createElement("td");
    const titleCell = document.createElement("td");
    const author = document.createElement("td");
    const meta = document.createElement("td");
    const badge = document.createElement("span");
    const link = document.createElement("a");

    badge.className = "notice-table-badge";
    badge.textContent = index === 0 ? "TOP" : String(index + 1);
    number.append(badge);

    link.href = `post.html?id=${encodeURIComponent(item.id)}`;
    link.textContent = item.title || "제목 없음";
    titleCell.append(link);
    appendNameWithRole(author, item.author || item.authorUsername || "관리자", item.authorRole);
    meta.textContent = `${formatDate(item.createdAt || item.date)} · 조회 ${formatNumber(item.views)}`;
    row.append(number, titleCell, author, meta);
    noticePageList.append(row);
  });

  noticePageState.textContent = `${items.length}개의 공지사항`;
  noticePageCount.textContent = `PAGE 1 OF ${Math.max(1, Math.ceil(items.length / 10))}`;
}

async function loadNotices() {
  try {
    const response = await fetch("/api/site-notices", { credentials: "same-origin" });
    if (!response.ok) throw new Error("notice request failed");
    const items = await response.json();
    if (!Array.isArray(items)) throw new Error("notice response invalid");
    renderNotices(items);
  } catch {
    noticePageList.innerHTML = "";
    renderEmptyNotice();
    noticePageState.textContent = "공지사항을 불러오지 못했습니다.";
  }

  if (noticePageSource) {
    noticePageSource.href = "upload.html";
    noticePageSource.hidden = true;
    try {
      const meResponse = await fetch("/api/me", { credentials: "same-origin" });
      const me = meResponse.ok ? await meResponse.json() : null;
      noticePageSource.hidden = !(me?.canManageContent || me?.canAccessAdminDb || me?.isSuperAdmin);
    } catch {
      noticePageSource.hidden = true;
    }
  }
}

loadNotices();
