const noticePageList = document.querySelector("#noticePageList");
const noticePageState = document.querySelector("#noticePageState");
const noticePageCount = document.querySelector("#noticePageCount");
const noticePageSource = document.querySelector("#noticePageSource");
const noticeFallback = [
  { title: "중요 공지사항을 준비하고 있습니다.", date: new Date().toISOString(), views: 0, link: "#" },
];

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(Number(value) || 0);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return date.toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" });
}

function renderNotices(items) {
  noticePageList.innerHTML = "";
  const rows = items.length ? items : noticeFallback;
  rows.forEach((item, index) => {
    const row = document.createElement("tr");
    const number = document.createElement("td");
    const titleCell = document.createElement("td");
    const date = document.createElement("td");
    const views = document.createElement("td");
    const badge = document.createElement("span");
    const link = document.createElement("a");

    badge.className = "notice-table-badge";
    badge.textContent = "TOP";
    number.append(badge);

    link.href = item.link || "#";
    link.textContent = item.title || "제목 없음";
    if (link.href && !link.href.endsWith("#")) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    titleCell.append(link);
    date.textContent = formatDate(item.date);
    views.textContent = formatNumber(item.views);
    row.append(number, titleCell, date, views);
    noticePageList.append(row);
  });
  noticePageState.textContent = `${rows.length}개의 공지사항`;
  noticePageCount.textContent = `PAGE 1 OF ${Math.max(1, Math.ceil(rows.length / 10))}`;
}

async function loadNotices() {
  try {
    const response = await fetch("/api/notices");
    if (!response.ok) throw new Error("notice request failed");
    const items = await response.json();
    if (!Array.isArray(items)) throw new Error("notice response invalid");
    renderNotices(items);
  } catch {
    noticePageState.textContent = "공지사항을 불러오지 못해 임시 목록을 표시합니다.";
    renderNotices(noticeFallback);
  }
  if (noticePageSource) {
    noticePageSource.href = "https://game.naver.com/lounge/sena_rebirth/board/11";
  }
}

loadNotices();
