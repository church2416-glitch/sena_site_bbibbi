const numberFormat = new Intl.NumberFormat("ko-KR");
const memoKey = "bbibbi-admin-memo";

const pageTitle = document.querySelector("#adminPageTitle");
const navButtons = [...document.querySelectorAll("[data-admin-view]")];
const viewButtons = [...document.querySelectorAll("[data-admin-view-button]")];
const sections = [...document.querySelectorAll("[data-admin-section]")];

const metricUsers = document.querySelector("#metricUsers");
const metricVerified = document.querySelector("#metricVerified");
const metricPosts = document.querySelector("#metricPosts");
const metricSheets = document.querySelector("#metricSheets");
const dbUsers = document.querySelector("#dbUsers");
const dbPosts = document.querySelector("#dbPosts");
const dbMedia = document.querySelector("#dbMedia");
const dbCoupons = document.querySelector("#dbCoupons");
const dbCouponRequests = document.querySelector("#dbCouponRequests");
const dbNotifications = document.querySelector("#dbNotifications");
const dbAudit = document.querySelector("#dbAudit");
const dailyChart = document.querySelector("#dailyChart");
const dailyTable = document.querySelector("#dailyTable");
const databaseTable = document.querySelector("#databaseTable");
const adminAuditList = document.querySelector("#adminAuditList");
const recentUsers = document.querySelector("#recentUsers");
const recentPosts = document.querySelector("#recentPosts");
const contentCount = document.querySelector("#contentCount");
const adminName = document.querySelector("#adminName");
const adminEmail = document.querySelector("#adminEmail");
const adminMemo = document.querySelector("#adminMemo");
const clearMemoButton = document.querySelector("#clearMemoButton");
const adminLogoutButton = document.querySelector("#adminLogoutButton");
const refreshUsersButton = document.querySelector("#refreshUsersButton");
const refreshDatabaseButton = document.querySelector("#refreshDatabaseButton");
const guildSeasonForm = document.querySelector("#guildSeasonForm");
const guildSeasonNote = document.querySelector("#guildSeasonNote");
const guildSeasonRound = document.querySelector("#guildSeasonRound");
const guildSeasonTotalRound = document.querySelector("#guildSeasonTotalRound");
const guildSeasonAutoUpdate = document.querySelector("#guildSeasonAutoUpdate");
const guildSeasonAutoWeekdays = [...document.querySelectorAll("[name='autoUpdateWeekdays']")];
const guildSeasonSaveState = document.querySelector("#guildSeasonSaveState");
const importantNoticeForm = document.querySelector("#importantNoticeForm");
const importantNoticeEnabled = document.querySelector("#importantNoticeEnabled");
const importantNoticeEyebrow = document.querySelector("#importantNoticeEyebrow");
const importantNoticeTitle = document.querySelector("#importantNoticeTitle");
const importantNoticeImageFile = document.querySelector("#importantNoticeImageFile");
const importantNoticeImageName = document.querySelector("#importantNoticeImageName");
const importantNoticeImageUrl = document.querySelector("#importantNoticeImageUrl");
const importantNoticeActionLabel = document.querySelector("#importantNoticeActionLabel");
const importantNoticeActionUrl = document.querySelector("#importantNoticeActionUrl");
const importantNoticeContent = document.querySelector("#importantNoticeContent");
const importantNoticeSaveState = document.querySelector("#importantNoticeSaveState");
const mainHeroForm = document.querySelector("#mainHeroForm");
const mainHeroImageFile = document.querySelector("#mainHeroImageFile");
const mainHeroImageName = document.querySelector("#mainHeroImageName");
const mainHeroImageUrl = document.querySelector("#mainHeroImageUrl");
const mainHeroInterval = document.querySelector("#mainHeroInterval");
const mainHeroSaveState = document.querySelector("#mainHeroSaveState");
const siteAppearanceForm = document.querySelector("#siteAppearanceForm");
const siteAppearanceSaveState = document.querySelector("#siteAppearanceSaveState");
const mentionColorInput = document.querySelector("#mentionColorInput");
const mentionColorText = document.querySelector("#mentionColorText");
const mentionColorPreview = document.querySelector("#mentionColorPreview");
const adminCouponForm = document.querySelector("#adminCouponForm");
const adminCouponCodes = document.querySelector("#adminCouponCodes");
const adminCouponSaveState = document.querySelector("#adminCouponSaveState");

const viewTitles = {
  dashboard: "대시보드",
  users: "사용자 관리",
  contents: "콘텐츠 관리",
  database: "데이터베이스",
};
const roleDefaults = {
  blocked: {
    canReadPosts: false,
    canWritePosts: false,
    canComment: false,
    canVote: false,
    canUploadMedia: false,
    canEditOwnPosts: false,
    canManageOwnComments: false,
    canManageGuild: false,
    canAccessAdminDb: false,
    canManageUsers: false,
    canManageContent: false,
  },
  user: {
    canReadPosts: true,
    canWritePosts: true,
    canComment: true,
    canVote: true,
    canUploadMedia: true,
    canEditOwnPosts: true,
    canManageOwnComments: true,
    canManageGuild: false,
    canAccessAdminDb: false,
    canManageUsers: false,
    canManageContent: false,
  },
  elite: {
    canReadPosts: true,
    canWritePosts: true,
    canComment: true,
    canVote: true,
    canUploadMedia: true,
    canEditOwnPosts: true,
    canManageOwnComments: true,
    canManageGuild: true,
    canAccessAdminDb: false,
    canManageUsers: false,
    canManageContent: false,
  },
  admin: {
    canReadPosts: true,
    canWritePosts: true,
    canComment: true,
    canVote: true,
    canUploadMedia: true,
    canEditOwnPosts: true,
    canManageOwnComments: true,
    canManageGuild: true,
    canAccessAdminDb: false,
    canManageUsers: false,
    canManageContent: true,
  },
  superadmin: {
    canReadPosts: true,
    canWritePosts: true,
    canComment: true,
    canVote: true,
    canUploadMedia: true,
    canEditOwnPosts: true,
    canManageOwnComments: true,
    canManageGuild: true,
    canAccessAdminDb: true,
    canManageUsers: true,
    canManageContent: true,
  },
};
const permissionOptions = [
  ["canReadPosts", "게시글 열람"],
  ["canWritePosts", "게시글 작성"],
  ["canComment", "댓글 작성"],
  ["canVote", "추천"],
  ["canUploadMedia", "미디어 업로드"],
  ["canEditOwnPosts", "본인 글 수정/삭제"],
  ["canManageOwnComments", "본인 댓글 관리"],
  ["canManageGuild", "족보 작성/관리"],
  ["canManageContent", "콘텐츠 관리"],
  ["canManageUsers", "사용자 관리"],
  ["canAccessAdminDb", "관리자 DB 접근"],
];

function formatNumber(value) {
  return numberFormat.format(Number(value) || 0);
}

function formatDate(value) {
  const raw = String(value || "").trim();
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00+09:00` : /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw) ? raw.replace(" ", "T") + "Z" : raw;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value || "-";
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit" }).format(date);
}

function setText(target, value) {
  if (target) target.textContent = value;
}

function switchView(view) {
  const nextView = viewTitles[view] ? view : "dashboard";
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.adminView === nextView));
  sections.forEach((section) => section.classList.toggle("active", section.dataset.adminSection === nextView));
  setText(pageTitle, viewTitles[nextView]);
  history.replaceState(null, "", `#${nextView}`);
}

function emptyRow(message) {
  const row = document.createElement("p");
  row.className = "admin-empty-row";
  row.textContent = message;
  return row;
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

function renderDatabaseTable(counts) {
  if (!databaseTable) return;
  const tableCounts = {
    users: counts.users,
    posts: counts.posts,
    post_media: counts.post_media,
    post_votes: counts.post_votes,
    post_comments: counts.post_comments,
    comment_votes: counts.comment_votes,
    notifications: counts.notifications,
    guild_war_sheets: counts.guild_war_sheets,
    coupon_codes: counts.coupon_codes,
    coupon_requests: counts.coupon_requests,
    app_settings: counts.app_settings,
    audit_logs: counts.audit_logs,
  };

  setText(dbUsers, formatNumber(counts.users));
  setText(dbPosts, formatNumber(counts.posts));
  setText(dbMedia, formatNumber(counts.post_media));
  setText(dbCoupons, formatNumber(counts.coupon_codes));
  setText(dbCouponRequests, formatNumber(counts.coupon_requests));
  setText(dbNotifications, formatNumber(counts.notifications));
  setText(dbAudit, formatNumber(counts.audit_logs));

  databaseTable.innerHTML = "";
  Object.entries(tableCounts).forEach(([table, count]) => {
    const tr = document.createElement("tr");
    const name = document.createElement("td");
    const value = document.createElement("td");
    name.textContent = table;
    value.textContent = formatNumber(count);
    tr.append(name, value);
    databaseTable.append(tr);
  });
}

function renderAuditList(rows = []) {
  if (!adminAuditList) return;
  adminAuditList.innerHTML = "";
  if (!rows.length) {
    adminAuditList.append(emptyRow("아직 운영 로그가 없습니다."));
    return;
  }

  rows.forEach((row) => {
    const item = document.createElement("article");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    const details = document.createElement("small");
    let parsed = {};
    try {
      parsed = JSON.parse(row.details_json || "{}");
    } catch {
      parsed = {};
    }
    item.className = "admin-audit-row";
    title.textContent = parsed.message || row.action || "운영 로그";
    meta.textContent = [
      row.actor_name || row.actor_username || "system",
      row.target_type,
      row.target_id,
      formatCouponLikeDate(row.created_at),
    ].filter(Boolean).join(" · ");
    details.textContent = row.action || "";
    item.append(title, meta, details);
    adminAuditList.append(item);
  });
}

function formatCouponLikeDate(value) {
  const raw = String(value || "").trim();
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw) ? `${raw.replace(" ", "T")}Z` : raw;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return raw || "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderGuildSeasonSettings(settings) {
  if (!guildSeasonForm || !settings) return;
  guildSeasonNote.value = settings.seasonNote || "";
  guildSeasonRound.value = Number(settings.round) || 0;
  guildSeasonTotalRound.value = Number(settings.totalRound) || 18;
  guildSeasonAutoUpdate.checked = Boolean(settings.autoUpdateEnabled);
  const weekdays = new Set((settings.autoUpdateWeekdays || [1, 3, 6]).map(String));
  guildSeasonAutoWeekdays.forEach((input) => {
    input.checked = weekdays.has(input.value);
  });
  setText(guildSeasonSaveState, "불러옴");
}

async function loadGuildSeasonSettings() {
  if (!guildSeasonForm) return;
  const response = await fetch("/api/guild-war/season");
  if (!response.ok) return;
  const data = await response.json();
  renderGuildSeasonSettings(data.settings);
}

async function saveGuildSeasonSettings(event) {
  event.preventDefault();
  setText(guildSeasonSaveState, "저장 중");
  const response = await fetch("/api/admin/guild-war/season", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      seasonNote: guildSeasonNote.value.trim(),
      round: Number(guildSeasonRound.value),
      totalRound: Number(guildSeasonTotalRound.value),
      autoUpdateEnabled: guildSeasonAutoUpdate.checked,
      autoUpdateWeekdays: guildSeasonAutoWeekdays.filter((input) => input.checked).map((input) => Number(input.value)),
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    setText(guildSeasonSaveState, data.error || "실패");
    return;
  }
  renderGuildSeasonSettings(data.settings);
  setText(guildSeasonSaveState, "저장됨");
  const dbResponse = await fetch("/api/admin/db-status");
  if (dbResponse.ok) renderDatabaseTable((await dbResponse.json()).counts || {});
}

function renderImportantNoticeSettings(notice) {
  if (!importantNoticeForm || !notice) return;
  importantNoticeEnabled.checked = Boolean(notice.enabled);
  importantNoticeEyebrow.value = notice.eyebrow || "";
  importantNoticeTitle.value = notice.title || "";
  importantNoticeImageUrl.value = (notice.imageUrls?.length ? notice.imageUrls : [notice.imageUrl].filter(Boolean)).join("\n");
  importantNoticeActionLabel.value = notice.actionLabel || "";
  importantNoticeActionUrl.value = notice.actionUrl || "";
  importantNoticeContent.value = notice.content || "";
  setText(importantNoticeSaveState, "불러옴");
}

async function loadImportantNoticeSettings() {
  if (!importantNoticeForm) return;
  const response = await fetch("/api/important-notice");
  if (!response.ok) return;
  const data = await response.json();
  renderImportantNoticeSettings(data.notice);
}

async function uploadImportantNoticeImage() {
  const files = [...(importantNoticeImageFile?.files || [])].slice(0, 6);
  const existingUrls = importantNoticeImageUrl.value
    .split(/\n+/)
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 6);
  if (!files.length) return existingUrls;
  setText(importantNoticeSaveState, "이미지 업로드 중");
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch("/api/admin/important-notice/image", {
    method: "POST",
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "이미지 업로드 실패");
  }
  const nextUrls = [...existingUrls, ...(data.imageUrls || [])].slice(0, 6);
  importantNoticeImageUrl.value = nextUrls.join("\n");
  importantNoticeImageFile.value = "";
  if (importantNoticeImageName) importantNoticeImageName.textContent = `${data.imageUrls?.length || files.length}장 업로드 완료`;
  return nextUrls;
}

async function saveImportantNoticeSettings(event) {
  event.preventDefault();
  let imageUrls;
  try {
    imageUrls = await uploadImportantNoticeImage();
  } catch (err) {
    setText(importantNoticeSaveState, err.message || "업로드 실패");
    return;
  }
  setText(importantNoticeSaveState, "저장 중");
  const response = await fetch("/api/admin/important-notice", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      enabled: importantNoticeEnabled.checked,
      eyebrow: importantNoticeEyebrow.value.trim(),
      title: importantNoticeTitle.value.trim(),
      imageUrl: imageUrls[0] || "",
      imageUrls,
      actionLabel: importantNoticeActionLabel.value.trim(),
      actionUrl: importantNoticeActionUrl.value.trim(),
      content: importantNoticeContent.value.trim(),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    setText(importantNoticeSaveState, data.error || "실패");
    return;
  }
  renderImportantNoticeSettings(data.notice);
  setText(importantNoticeSaveState, "저장됨");
}

function renderMainHeroSettings(hero) {
  if (!mainHeroForm || !hero) return;
  mainHeroImageUrl.value = (hero.imageUrls || []).join("\n");
  mainHeroInterval.value = Math.max(3, Math.min(20, Number(hero.intervalSeconds) || 5));
  setText(mainHeroSaveState, "불러옴");
}

async function loadMainHeroSettings() {
  if (!mainHeroForm) return;
  const response = await fetch("/api/main-hero");
  if (!response.ok) return;
  const data = await response.json();
  renderMainHeroSettings(data.hero);
}

async function uploadMainHeroImage() {
  const files = [...(mainHeroImageFile?.files || [])].slice(0, 10);
  const existingUrls = mainHeroImageUrl.value
    .split(/\n+/)
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 10);
  if (!files.length) return existingUrls;
  setText(mainHeroSaveState, "이미지 업로드 중");
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch("/api/admin/main-hero/image", {
    method: "POST",
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "이미지 업로드 실패");
  }
  const nextUrls = [...existingUrls, ...(data.imageUrls || [])].slice(0, 10);
  mainHeroImageUrl.value = nextUrls.join("\n");
  mainHeroImageFile.value = "";
  if (mainHeroImageName) mainHeroImageName.textContent = `${data.imageUrls?.length || files.length}장 업로드 완료`;
  return nextUrls;
}

async function saveMainHeroSettings(event) {
  event.preventDefault();
  let imageUrls;
  try {
    imageUrls = await uploadMainHeroImage();
  } catch (err) {
    setText(mainHeroSaveState, err.message || "업로드 실패");
    return;
  }
  setText(mainHeroSaveState, "저장 중");
  const response = await fetch("/api/admin/main-hero", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageUrls,
      intervalSeconds: Number(mainHeroInterval.value) || 5,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    setText(mainHeroSaveState, data.error || "실패");
    return;
  }
  renderMainHeroSettings(data.hero);
  setText(mainHeroSaveState, "저장됨");
}

function normalizeHexColor(value) {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : "#2c7eff";
}

function syncMentionColorPreview(color) {
  const nextColor = normalizeHexColor(color);
  if (mentionColorInput) mentionColorInput.value = nextColor;
  if (mentionColorText) mentionColorText.value = nextColor;
  window.BbibbiApplySiteAppearance?.({ mentionColor: nextColor });
  if (mentionColorPreview) mentionColorPreview.textContent = "@bbitsena";
}

function renderSiteAppearanceSettings(appearance) {
  if (!siteAppearanceForm || !appearance) return;
  syncMentionColorPreview(appearance.mentionColor);
  setText(siteAppearanceSaveState, "불러옴");
}

async function loadSiteAppearanceSettings() {
  if (!siteAppearanceForm) return;
  const response = await fetch("/api/site-appearance");
  if (!response.ok) return;
  const data = await response.json();
  renderSiteAppearanceSettings(data.appearance);
}

async function saveSiteAppearanceSettings(event) {
  event.preventDefault();
  const mentionColor = normalizeHexColor(mentionColorText?.value || mentionColorInput?.value);
  syncMentionColorPreview(mentionColor);
  setText(siteAppearanceSaveState, "저장 중");
  const response = await fetch("/api/admin/site-appearance", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mentionColor }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    setText(siteAppearanceSaveState, data.error || "실패");
    return;
  }
  renderSiteAppearanceSettings(data.appearance);
  setText(siteAppearanceSaveState, "저장됨");
}

async function saveAdminCouponCodes(event) {
  event.preventDefault();
  if (!adminCouponCodes?.value.trim()) {
    setText(adminCouponSaveState, "입력 필요");
    return;
  }
  setText(adminCouponSaveState, "업로드 중");
  const response = await fetch("/api/coupon/codes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codes: adminCouponCodes.value }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    setText(adminCouponSaveState, data.error || "실패");
    return;
  }
  adminCouponCodes.value = "";
  setText(adminCouponSaveState, `${formatNumber(data.added || 0)}개 저장`);
  const dbResponse = await fetch("/api/admin/db-status");
  if (dbResponse.ok) {
    const dbStatus = await dbResponse.json();
    renderDatabaseTable(dbStatus.counts || {});
    renderAuditList(dbStatus.recentAudit || []);
  }
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
    const actions = document.createElement("div");
    const role = document.createElement("select");
    const permissions = document.createElement("div");
    const save = document.createElement("button");
    const remove = document.createElement("button");

    row.className = "admin-user-row";
    avatar.className = "admin-row-avatar";
    avatar.textContent = (user.display_name || user.username || "?").slice(0, 1).toUpperCase();
    name.textContent = user.display_name || user.username;
    meta.textContent = [user.email || user.username, user.provider, `글 ${formatNumber(user.post_count)}`, formatDate(user.created_at)]
      .filter(Boolean)
      .join(" · ");
    actions.className = "admin-row-actions";
    permissions.className = "admin-permission-grid";

    [
      ["superadmin", "최고관리자"],
      ["admin", "관리자"],
      ["elite", "정예"],
      ["user", "일반"],
      ["blocked", "열람 차단"],
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = user.role === value || (user.role === "verified" && value === "elite");
      role.append(option);
    });

    permissionOptions.forEach(([key, label]) => {
      const item = document.createElement("label");
      const input = document.createElement("input");
      const text = document.createElement("span");
      input.type = "checkbox";
      input.dataset.permission = key;
      input.checked = Boolean(user[key]);
      text.textContent = label;
      item.append(input, text);
      permissions.append(item);
    });
    role.addEventListener("change", () => {
      const defaults = roleDefaults[role.value] || roleDefaults.user;
      permissions.querySelectorAll("[data-permission]").forEach((input) => {
        input.checked = Boolean(defaults[input.dataset.permission]);
      });
    });

    save.type = "button";
    save.textContent = "저장";
    save.addEventListener("click", () => updateUserRole(user.id, role.value, readPermissionForm(permissions)));
    remove.type = "button";
    remove.textContent = "삭제";
    remove.addEventListener("click", () => deleteUser(user.id, user.display_name || user.username));

    body.append(name, meta);
    actions.append(role, save, remove);
    row.append(avatar, body, actions, permissions);
    recentUsers.append(row);
  });
}

function readPermissionForm(container) {
  return Object.fromEntries(
    [...container.querySelectorAll("[data-permission]")].map((input) => [input.dataset.permission, input.checked]),
  );
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
    const actions = document.createElement("div");
    const status = document.createElement("select");
    const save = document.createElement("button");
    const remove = document.createElement("button");

    avatar.className = "admin-row-avatar";
    avatar.textContent = "글";
    title.textContent = post.title || "제목 없음";
    meta.textContent = [post.author || post.authorUsername || "작성자 없음", post.category, post.status, `조회 ${formatNumber(post.views)}`]
      .filter(Boolean)
      .join(" · ");
    actions.className = "admin-row-actions";

    ["published", "hidden", "deleted"].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = post.status === value;
      status.append(option);
    });

    save.type = "button";
    save.textContent = "저장";
    save.addEventListener("click", () => updatePostStatus(post.id, status.value));
    remove.type = "button";
    remove.textContent = "삭제";
    remove.addEventListener("click", () => deletePost(post.id, post.title));

    body.append(title, meta);
    actions.append(status, save, remove);
    row.append(avatar, body, actions);
    recentPosts.append(row);
  });
}

async function loadManagementLists() {
  const [usersResponse, postsResponse] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/posts")]);
  if (usersResponse.ok) renderUsers(await usersResponse.json());
  if (postsResponse.ok) renderPosts(await postsResponse.json());
}

async function updateUserRole(id, role, permissions = {}) {
  const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, permissions }),
  });
  if (!response.ok) alert((await response.json().catch(() => ({}))).error || "회원 저장 실패");
  await loadDashboard();
}

async function deleteUser(id, name) {
  if (!confirm(`${name} 회원을 삭제할까요?`)) return;
  const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) alert((await response.json().catch(() => ({}))).error || "회원 삭제 실패");
  await loadDashboard();
}

async function updatePostStatus(id, status) {
  const response = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) alert((await response.json().catch(() => ({}))).error || "게시글 저장 실패");
  await loadDashboard();
}

async function deletePost(id, title) {
  if (!confirm(`${title || "게시글"}을 완전히 삭제할까요?`)) return;
  const response = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) alert((await response.json().catch(() => ({}))).error || "게시글 삭제 실패");
  await loadDashboard();
}

async function loadDashboard() {
  const [meResponse, dashboardResponse, dbResponse] = await Promise.all([
    fetch("/api/me"),
    fetch("/api/admin/dashboard"),
    fetch("/api/admin/db-status"),
  ]);
  if (!meResponse.ok || !dashboardResponse.ok || !dbResponse.ok) {
    location.href = "/?login=required";
    return;
  }

  const me = await meResponse.json();
  const dashboard = await dashboardResponse.json();
  const dbStatus = await dbResponse.json();

  setText(adminName, me.displayName || me.username || "관리자");
  setText(adminEmail, me.username || "admin");
  setText(metricUsers, formatNumber(dashboard.counts.users));
  setText(metricVerified, formatNumber(dashboard.counts.verified));
  setText(metricPosts, formatNumber(dashboard.counts.posts));
  setText(metricSheets, formatNumber(dashboard.counts.guildSheets));

  renderChart(dashboard.daily || []);
  renderDailyTable(dashboard.daily || []);
  renderDatabaseTable(dbStatus.counts || {});
  renderAuditList(dbStatus.recentAudit || []);
  await loadGuildSeasonSettings();
  await loadImportantNoticeSettings();
  await loadMainHeroSettings();
  await loadSiteAppearanceSettings();
  await loadManagementLists();
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.adminView));
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.adminViewButton));
});

adminMemo.value = localStorage.getItem(memoKey) || "";
adminMemo.addEventListener("input", () => {
  localStorage.setItem(memoKey, adminMemo.value);
});

clearMemoButton?.addEventListener("click", () => {
  adminMemo.value = "";
  localStorage.removeItem(memoKey);
});

refreshUsersButton?.addEventListener("click", loadManagementLists);
refreshDatabaseButton?.addEventListener("click", loadDashboard);
guildSeasonForm?.addEventListener("submit", saveGuildSeasonSettings);
importantNoticeForm?.addEventListener("submit", saveImportantNoticeSettings);
importantNoticeImageFile?.addEventListener("change", () => {
  const files = [...(importantNoticeImageFile.files || [])];
  const totalKb = files.reduce((sum, file) => sum + file.size / 1024, 0);
  if (importantNoticeImageName) {
    importantNoticeImageName.textContent = files.length ? `${files.length}장 · ${formatNumber(totalKb)}KB` : "선택된 이미지 없음";
  }
});
mainHeroForm?.addEventListener("submit", saveMainHeroSettings);
siteAppearanceForm?.addEventListener("submit", saveSiteAppearanceSettings);
mentionColorInput?.addEventListener("input", () => syncMentionColorPreview(mentionColorInput.value));
mentionColorText?.addEventListener("input", () => {
  if (/^#[0-9a-fA-F]{6}$/.test(mentionColorText.value.trim())) syncMentionColorPreview(mentionColorText.value);
});
adminCouponForm?.addEventListener("submit", saveAdminCouponCodes);
mainHeroImageFile?.addEventListener("change", () => {
  const files = [...(mainHeroImageFile.files || [])];
  const totalKb = files.reduce((sum, file) => sum + file.size / 1024, 0);
  if (mainHeroImageName) {
    mainHeroImageName.textContent = files.length ? `${files.length}장 · ${formatNumber(totalKb)}KB` : "선택된 이미지 없음";
  }
});

adminLogoutButton?.addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  location.href = "/";
});

switchView(location.hash.replace("#", "") || "dashboard");
loadDashboard().catch(() => {
  location.href = "/?login=required";
});
