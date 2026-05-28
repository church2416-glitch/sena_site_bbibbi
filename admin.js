const numberFormat = new Intl.NumberFormat("ko-KR");
const memoKey = "bbibbi-admin-memo";

const metricUsers = document.querySelector("#metricUsers");
const metricVerified = document.querySelector("#metricVerified");
const metricPosts = document.querySelector("#metricPosts");
const metricSheets = document.querySelector("#metricSheets");
const dailyChart = document.querySelector("#dailyChart");
const dailyTable = document.querySelector("#dailyTable");
const recentUsers = document.querySelector("#recentUsers");
const recentPosts = document.querySelector("#recentPosts");
const contentCount = document.querySelector("#contentCount");
const adminName = document.querySelector("#adminName");
const adminEmail = document.querySelector("#adminEmail");
const adminMemo = document.querySelector("#adminMemo");
const clearMemoButton = document.querySelector("#clearMemoButton");
const adminLogoutButton = document.querySelector("#adminLogoutButton");

function formatNumber(value) {
  return numberFormat.format(Number(value) || 0);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

function setText(target, value) {
  if (target) target.textContent = value;
}

function renderChart(rows) {
  if (!dailyChart) return;
  dailyChart.innerHTML = "";
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.users, row.posts]));

  rows.forEach((row) => {
    const item = document.createElement("div");
    const userBar = document.createElement("i");
    const postBar = document.createElement("b");
    const label = document.createElement("span");

    item.className = "admin-chart-day";
    userBar.style.height = `${Math.max(6, (Number(row.users) / maxValue) * 100)}%`;
    postBar.style.height = `${Math.max(6, (Number(row.posts) / maxValue) * 100)}%`;
    label.textContent = formatDate(row.day);

    item.append(userBar, postBar, label);
    dailyChart.append(item);
  });
}

function renderDailyTable(rows) {
  if (!dailyTable) return;
  dailyTable.innerHTML = "";
  rows
    .slice()
    .reverse()
    .forEach((row) => {
      const tr = document.createElement("tr");
      [formatDate(row.day), formatNumber(row.users), formatNumber(row.posts)].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      });
      dailyTable.append(tr);
    });
}

function renderUsers(users) {
  if (!recentUsers) return;
  recentUsers.innerHTML = "";
  if (!users.length) {
    recentUsers.append(emptyRow("아직 회원 데이터가 없습니다."));
    return;
  }

  users.forEach((user) => {
    const row = document.createElement("article");
    const avatar = document.createElement("span");
    const body = document.createElement("div");
    const name = document.createElement("strong");
    const meta = document.createElement("small");
    const role = document.createElement("em");

    avatar.className = "admin-row-avatar";
    avatar.textContent = (user.display_name || user.username || "?").slice(0, 1).toUpperCase();
    name.textContent = user.display_name || user.username;
    meta.textContent = [user.email || user.username, user.provider, formatDate(user.created_at)].filter(Boolean).join(" · ");
    role.textContent = user.role;

    body.append(name, meta);
    row.append(avatar, body, role);
    recentUsers.append(row);
  });
}

function renderPosts(posts) {
  if (!recentPosts) return;
  recentPosts.innerHTML = "";
  setText(contentCount, formatNumber(posts.length));

  if (!posts.length) {
    recentPosts.append(emptyRow("아직 DB에 저장된 게시글이 없습니다."));
    return;
  }

  posts.forEach((post) => {
    const row = document.createElement("article");
    const avatar = document.createElement("span");
    const body = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("small");
    const stats = document.createElement("em");

    avatar.className = "admin-row-avatar";
    avatar.textContent = "글";
    title.textContent = post.title || "제목 없음";
    meta.textContent = [post.author_name || post.author_username || "작성자 없음", post.category, formatDate(post.created_at)]
      .filter(Boolean)
      .join(" · ");
    stats.textContent = `조회 ${formatNumber(post.views)} / 추천 ${formatNumber(post.votes)}`;

    body.append(title, meta);
    row.append(avatar, body, stats);
    recentPosts.append(row);
  });
}

function emptyRow(message) {
  const row = document.createElement("p");
  row.className = "admin-empty-row";
  row.textContent = message;
  return row;
}

async function loadDashboard() {
  const [meResponse, dashboardResponse] = await Promise.all([fetch("/api/me"), fetch("/api/admin/dashboard")]);
  if (!meResponse.ok || !dashboardResponse.ok) {
    location.href = "/?login=required";
    return;
  }

  const me = await meResponse.json();
  const dashboard = await dashboardResponse.json();

  setText(adminName, me.displayName || me.username || "관리자");
  setText(adminEmail, me.username || "admin");
  setText(metricUsers, formatNumber(dashboard.counts.users));
  setText(metricVerified, formatNumber(dashboard.counts.verified));
  setText(metricPosts, formatNumber(dashboard.counts.posts));
  setText(metricSheets, formatNumber(dashboard.counts.guildSheets));

  renderChart(dashboard.daily || []);
  renderDailyTable(dashboard.daily || []);
  renderUsers(dashboard.recentUsers || []);
  renderPosts(dashboard.recentPosts || []);
}

adminMemo.value = localStorage.getItem(memoKey) || "";
adminMemo.addEventListener("input", () => {
  localStorage.setItem(memoKey, adminMemo.value);
});

clearMemoButton?.addEventListener("click", () => {
  adminMemo.value = "";
  localStorage.removeItem(memoKey);
});

adminLogoutButton?.addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  location.href = "/";
});

loadDashboard().catch(() => {
  location.href = "/?login=required";
});
