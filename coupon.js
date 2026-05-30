const couponBulkForm = document.querySelector("#couponBulkForm");
const couponUidInput = document.querySelector("#couponUidInput");
const couponBulkButton = document.querySelector("#couponBulkButton");
const couponStatus = document.querySelector("#couponStatus");
const couponHistory = document.querySelector("#couponHistory");
const couponReloadButton = document.querySelector("#couponReloadButton");
const couponCodeList = document.querySelector("#couponCodeList");
const couponCodeForm = document.querySelector("#couponCodeForm");
const couponCodesInput = document.querySelector("#couponCodesInput");
const couponCodeSaveButton = document.querySelector("#couponCodeSaveButton");

let savedCouponCodes = [];
let canManageCouponCodes = false;

function formatCouponDate(value) {
  const raw = String(value || "").trim();
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw) ? `${raw.replace(" ", "T")}Z` : raw;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return raw || "-";
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

function statusLabel(status) {
  if (status === "sent") return "\uC0AC\uC6A9 \uC644\uB8CC";
  if (status === "claimed") return "\uC774\uBBF8 \uC218\uB839";
  if (status === "expired") return "\uC720\uD6A8\uAE30\uAC04 \uB9CC\uB8CC";
  if (status === "failed") return "\uC2E4\uD328";
  return "\uB300\uAE30";
}
function canManageCoupons(user) {
  return Boolean(user?.canManageContent || user?.canAccessAdminDb || user?.isAdmin || user?.isSuperAdmin);
}

function renderCodeList() {
  couponCodeList.innerHTML = "";
  if (!savedCouponCodes.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "저장된 쿠폰이 없습니다. 발견한 쿠폰을 위 등록칸에 올려주세요.";
    couponCodeList.append(empty);
    return;
  }

  savedCouponCodes.forEach((item, index) => {
    const row = document.createElement("article");
    const order = document.createElement("span");
    const code = document.createElement("strong");
    const remove = document.createElement("button");
    row.className = "coupon-code-row";
    order.textContent = String(index + 1).padStart(2, "0");
    code.textContent = item.code;
    remove.type = "button";
    remove.className = "ghost-button coupon-code-remove";
    remove.textContent = "삭제";
    remove.hidden = !canManageCouponCodes;
    remove.addEventListener("click", () => deleteCouponCode(item.id));
    row.append(order, code, remove);
    couponCodeList.append(row);
  });
}

function renderHistory(items = []) {
  couponHistory.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "아직 쿠폰 처리 내역이 없습니다.";
    couponHistory.append(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("article");
    const code = document.createElement("strong");
    const meta = document.createElement("span");
    const message = document.createElement("p");
    row.className = `coupon-history-row is-${item.status || "pending"}`;
    code.textContent = item.couponCode || "-";
    meta.textContent = `${statusLabel(item.status)} · 회원번호 ${item.uid || "-"} · ${formatCouponDate(item.createdAt)}`;
    message.textContent = item.message || "처리 메시지가 없습니다.";
    row.append(code, meta, message);
    couponHistory.append(row);
  });
}

async function loadCurrentUser() {
  const response = await fetch("/api/me");
  if (!response.ok) return null;
  const data = await response.json().catch(() => ({}));
  return data.user || data || null;
}

async function loadCouponHistory() {
  const response = await fetch("/api/coupon/requests");
  if (!response.ok) {
    couponStatus.textContent = "쿠폰 정보를 불러오지 못했습니다.";
    renderHistory([]);
    return;
  }
  const data = await response.json();
  savedCouponCodes = data.codes || [];
  if (couponUidInput && data.couponUid && !couponUidInput.value.trim()) {
    couponUidInput.value = data.couponUid;
  }
  couponStatus.textContent = savedCouponCodes.length
    ? `${savedCouponCodes.length}개의 쿠폰이 저장되어 있습니다.`
    : "저장된 쿠폰이 없습니다. 발견한 쿠폰을 등록해주세요.";
  renderCodeList();
  renderHistory(data.requests || []);
}

async function submitBulkCoupons(event) {
  event.preventDefault();
  couponBulkButton.disabled = true;
  couponBulkButton.textContent = "사용 중";
  couponStatus.textContent = "저장된 쿠폰을 순서대로 사용하는 중입니다.";

  try {
    const response = await fetch("/api/coupon/send-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: couponUidInput.value }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "쿠폰 일괄 사용에 실패했습니다.");
    couponStatus.textContent = `\uC644\uB8CC: \uC131\uACF5 ${data.sent || 0}\uAC1C, \uC774\uBBF8 \uC218\uB839 ${data.claimed || 0}\uAC1C, \uB9CC\uB8CC ${data.expired || 0}\uAC1C, \uC2E4\uD328 ${data.failed || 0}\uAC1C, \uB300\uAE30 ${data.pending || 0}\uAC1C`;
    await loadCouponHistory();
  } catch (error) {
    couponStatus.textContent = error.message || "쿠폰 일괄 사용에 실패했습니다.";
  } finally {
    couponBulkButton.disabled = false;
    couponBulkButton.textContent = "저장된 쿠폰 전부 사용";
  }
}

async function saveCouponCodes(event) {
  event.preventDefault();
  couponCodeSaveButton.disabled = true;
  couponCodeSaveButton.textContent = "등록 중";

  try {
    const response = await fetch("/api/coupon/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codes: couponCodesInput.value }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "쿠폰 등록에 실패했습니다.");
    couponCodesInput.value = "";
    couponStatus.textContent = `${data.added || 0}개의 쿠폰을 새로 등록했습니다.`;
    await loadCouponHistory();
  } catch (error) {
    couponStatus.textContent = error.message || "쿠폰 등록에 실패했습니다.";
  } finally {
    couponCodeSaveButton.disabled = false;
    couponCodeSaveButton.textContent = "쿠폰 등록";
  }
}

async function deleteCouponCode(id) {
  if (!id) return;
  const response = await fetch(`/api/coupon/codes/${id}`, { method: "DELETE" });
  if (!response.ok) {
    couponStatus.textContent = "쿠폰 삭제에 실패했습니다.";
    return;
  }
  couponStatus.textContent = "쿠폰을 삭제했습니다.";
  await loadCouponHistory();
}

async function initCouponPage() {
  const user = await loadCurrentUser();
  canManageCouponCodes = canManageCoupons(user);
  await loadCouponHistory();
}

couponBulkForm?.addEventListener("submit", submitBulkCoupons);
couponCodeForm?.addEventListener("submit", saveCouponCodes);
couponReloadButton?.addEventListener("click", loadCouponHistory);
initCouponPage();
