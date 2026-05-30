(() => {
  if (window.BbibbiMentionAutocomplete) return;

  let activePanel = null;
  let activeField = null;
  let activeRange = null;
  let activeIndex = 0;
  let lastController = null;

  function findMentionRange(field) {
    const caret = field.selectionStart ?? field.value.length;
    const before = field.value.slice(0, caret);
    const match = before.match(/(^|[\s([{<])@([가-힣ㄱ-ㅎA-Za-z0-9_-]{0,30})$/);
    if (!match) return null;
    return {
      start: caret - match[2].length - 1,
      end: caret,
      query: match[2],
    };
  }

  function closePanel() {
    activePanel?.remove();
    activePanel = null;
    activeField = null;
    activeRange = null;
    activeIndex = 0;
    lastController?.abort();
    lastController = null;
  }

  function ensurePanel(field) {
    if (activePanel && activeField === field) return activePanel;
    closePanel();
    activeField = field;
    activePanel = document.createElement("div");
    activePanel.className = "mention-suggest-panel";
    activePanel.setAttribute("role", "listbox");
    document.body.append(activePanel);
    return activePanel;
  }

  function placePanel(field, panel) {
    const rect = field.getBoundingClientRect();
    panel.style.left = `${Math.max(12, rect.left + window.scrollX)}px`;
    panel.style.top = `${rect.bottom + window.scrollY + 8}px`;
    panel.style.width = `${Math.min(rect.width, 340)}px`;
  }

  function insertMention(field, item) {
    if (!activeRange) return;
    const label = item.label || item.displayName || item.username || item.value || "";
    if (!label) return;
    const before = field.value.slice(0, activeRange.start);
    const after = field.value.slice(activeRange.end);
    const suffix = after.startsWith(" ") || after.startsWith("\n") ? "" : " ";
    const insert = `@${label}${suffix}`;
    field.value = `${before}${insert}${after}`;
    const caret = before.length + insert.length;
    field.focus();
    field.setSelectionRange(caret, caret);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    closePanel();
  }

  function renderPanel(field, items) {
    const panel = ensurePanel(field);
    panel.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "mention-suggest-empty";
      empty.textContent = "일치하는 멘션이 없습니다.";
      panel.append(empty);
      placePanel(field, panel);
      return;
    }

    activeIndex = Math.min(activeIndex, items.length - 1);
    items.forEach((item, index) => {
      const button = document.createElement("button");
      const name = document.createElement("strong");
      const meta = document.createElement("small");
      button.type = "button";
      button.className = "mention-suggest-item";
      button.classList.toggle("active", index === activeIndex);
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(index === activeIndex));
      name.textContent = `@${item.label || item.displayName || item.username}`;
      meta.textContent = item.kind === "group" ? "그룹 멘션" : item.username || "회원";
      button.append(name, meta);
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        insertMention(field, item);
      });
      panel.append(button);
    });
    placePanel(field, panel);
  }

  async function updatePanel(field) {
    const range = findMentionRange(field);
    if (!range) {
      closePanel();
      return;
    }

    activeRange = range;
    lastController?.abort();
    lastController = new AbortController();
    const query = encodeURIComponent(range.query);
    const response = await fetch(`/api/mentions?q=${query}`, { signal: lastController.signal }).catch(() => null);
    if (!response?.ok || activeField !== field && activeField !== null) return;
    const data = await response.json().catch(() => ({}));
    renderPanel(field, Array.isArray(data.items) ? data.items : []);
  }

  function moveActive(delta) {
    if (!activePanel) return;
    const items = [...activePanel.querySelectorAll(".mention-suggest-item")];
    if (!items.length) return;
    activeIndex = (activeIndex + delta + items.length) % items.length;
    items.forEach((item, index) => {
      item.classList.toggle("active", index === activeIndex);
      item.setAttribute("aria-selected", String(index === activeIndex));
    });
    items[activeIndex]?.scrollIntoView({ block: "nearest" });
  }

  function attach(field) {
    if (!field || field.dataset.mentionAutocomplete === "ready") return;
    field.dataset.mentionAutocomplete = "ready";
    field.addEventListener("input", () => updatePanel(field));
    field.addEventListener("click", () => updatePanel(field));
    field.addEventListener("keyup", (event) => {
      if (!["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(event.key)) updatePanel(field);
    });
    field.addEventListener("keydown", (event) => {
      if (!activePanel || activeField !== field) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActive(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActive(-1);
      } else if (event.key === "Enter") {
        const items = [...activePanel.querySelectorAll(".mention-suggest-item")];
        if (!items.length) return;
        event.preventDefault();
        items[activeIndex]?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      } else if (event.key === "Escape") {
        closePanel();
      }
    });
    field.addEventListener("blur", () => window.setTimeout(closePanel, 140));
  }

  window.addEventListener("resize", closePanel);
  document.addEventListener("scroll", closePanel, true);
  window.BbibbiMentionAutocomplete = { attach };
})();
