const couponForm = document.querySelector("#couponForm");
const couponUidInput = document.querySelector("#couponUidInput");
const couponCodeInput = document.querySelector("#couponCodeInput");
const couponSubmitButton = document.querySelector("#couponSubmitButton");
const couponStatus = document.querySelector("#couponStatus");
const couponHistory = document.querySelector("#couponHistory");
const couponReloadButton = document.querySelector("#couponReloadButton");

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
  if (status === "sent") return "전송 완료";
  if (status === "failed") return "실패";
  return "연동 대기";
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
    meta.textContent = `${statusLabel(item.status)} · UID ${item.uid || "-"} · ${formatCouponDate(item.createdAt)}`;
    message.textContent = item.message || "처리 메시지가 없습니다.";
    row.append(code, meta, message);
    couponHistory.append(row);
  });
}

async function loadCouponHistory() {
  const response = await fetch("/api/coupon/requests");
  if (!response.ok) {
    couponStatus.textContent = "쿠폰 내역을 불러오지 못했습니다.";
    renderHistory([]);
    return;
  }
  const data = await response.json();
  couponStatus.textContent = data.configured
    ? "쿠폰 API가 연결되어 있습니다."
    : "공식 쿠폰 API 주소가 아직 설정되지 않아 전송 요청은 내부 기록으로 저장됩니다.";
  renderHistory(data.requests || []);
}

async function submitCoupon(event) {
  event.preventDefault();
  couponSubmitButton.disabled = true;
  couponSubmitButton.textContent = "전송 중";
  couponStatus.textContent = "쿠폰 전송 요청을 처리하는 중입니다.";

  const payload = {
    uid: couponUidInput.value,
    couponCode: couponCodeInput.value,
  };

  try {
    const response = await fetch("/api/coupon/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.request?.message || "쿠폰 전송 실패");
    couponStatus.textContent = data.request?.message || "쿠폰 전송 요청이 처리되었습니다.";
    couponCodeInput.value = "";
    await loadCouponHistory();
  } catch (error) {
    couponStatus.textContent = error.message || "쿠폰 전송 실패";
  } finally {
    couponSubmitButton.disabled = false;
    couponSubmitButton.textContent = "쿠폰 전송";
  }
}

couponForm?.addEventListener("submit", submitCoupon);
couponReloadButton?.addEventListener("click", loadCouponHistory);
loadCouponHistory();
