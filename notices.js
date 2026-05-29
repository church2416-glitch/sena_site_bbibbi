const noticePageList = document.querySelector("#noticePageList");
const noticePageState = document.querySelector("#noticePageState");
const noticePageCount = document.querySelector("#noticePageCount");
const noticePageSource = document.querySelector("#noticePageSource");

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(Number(value) || 0);
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
    const date = document.createElement("td");
    const views = document.createElement("td");
    const badge = document.createElement("span");
    const link = document.createElement("a");

    badge.className = "notice-table-badge";
    badge.textContent = index === 0 ? "TOP" : String(index + 1);
    number.append(badge);

    link.href = `post.html?id=${encodeURIComponent(item.id)}`;
    link.textContent = item.title || "제목 없음";
    titleCell.append(link);
    date.textContent = formatDate(item.createdAt || item.date);
    views.textContent = formatNumber(item.views);
    row.append(number, titleCell, date, views);
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
