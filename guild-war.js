const GuildWar = (() => {
  const storageKey = "guild-war-sheet-v4";
  const modes = ["attack", "defense"];
  const modeLabels = {
    attack: "공격 족보",
    defense: "방어 족보",
  };
  const formationTypes = {
    att: { label: "공격진형", src: "assets/formation/att.png" },
    bal: { label: "밸런스진형", src: "assets/formation/Bal.png" },
    base: { label: "기본진형", src: "assets/formation/base.png" },
    def: { label: "보호진형", src: "assets/formation/def.png" },
  };
  const planCards = [
    { label: "필수 조합" },
    { label: "세팅 보류" },
    { label: "위험 조합" },
  ];
  const formationLayouts = {
    att: [
      { top: "55%", left: "60%" },
      { top: "85%", left: "40%" },
      { top: "65%", left: "40%" },
      { top: "45%", left: "40%" },
      { top: "25%", left: "40%" },
    ],
    bal: [
      { top: "70%", left: "60%" },
      { top: "50%", left: "60%" },
      { top: "30%", left: "60%" },
      { top: "60%", left: "40%" },
      { top: "40%", left: "40%" },
    ],
    base: [
      { top: "60%", left: "60%" },
      { top: "40%", left: "60%" },
      { top: "70%", left: "40%" },
      { top: "50%", left: "40%" },
      { top: "30%", left: "40%" },
    ],
    def: [
      { top: "85%", left: "60%" },
      { top: "65%", left: "60%" },
      { top: "45%", left: "60%" },
      { top: "25%", left: "60%" },
      { top: "55%", left: "40%" },
    ],
  };

  const accessoryVisuals = {
    불사의반지: {
      label: "불사",
      tone: "immortal",
      images: {
        4: "assets/ring/immortality1.png",
        5: "assets/ring/immortality2.png",
        6: "assets/ring/immortality3.png",
      },
    },
    부활의반지: {
      label: "부활",
      tone: "revive",
      images: {
        4: "assets/ring/resurrection1.png",
        5: "assets/ring/resurrection2.png",
        6: "assets/ring/resurrection3.png",
      },
    },
    권능의반지: {
      label: "권능",
      tone: "power",
      images: {
        4: "assets/ring/Might1.png",
        5: "assets/ring/Might2.png",
        6: "assets/ring/Might3.png",
      },
    },
  };
  const accessoryRefineAliases = {
    불권: "불사세공",
    권불: "불사세공",
    불부: "불사세공",
    불기: "불사세공",
    부불: "부활세공",
    부권: "부활세공",
    권기: "권능세공",
    권부: "권능세공",
    권능: "권능세공",
    기합: "기합세공",
    철벽: "철벽세공",
    불사: "불사세공",
    부활: "부활세공",
  };
  const legacyDefaultGearValues = new Set([
    "추적자",
    "수문장",
    "수호자",
    "선봉장",
    "초월자",
    "방어무시",
    "받는 피해 감소",
    "생존력",
    "약점 확률",
    "모든 공격력 %",
    "모든 공격력%",
    "전열 유지",
    "반격 주의",
    "마무리",
    "스킬 100% 목표 세팅",
  ]);

  const petCatalog = ["루", "크리", "이린", "리첼", "파이크", "델로", "윈디", "제브", "유", "요랑", "연지", "카람", "제오", "멜페로"];
  const petImages = Object.fromEntries(petCatalog.map((name) => [name, `assets/pet/${name}.png`]));
  petImages["멜패로"] = "assets/pet/멜페로.png";

  const characterCatalog = [
    "겔리두스", "나타", "델론즈", "라드그리드", "라이언", "란드그리드", "레긴레이프", "레이첼", "로지", "루디",
    "룩", "리나", "린", "멜키르", "미스트", "밀리아", "바네사", "발리스타", "브브", "성진우",
    "손오공", "스파이크", "실베스타", "아라곤", "아멜리아", "아일린", "아킬라", "앨리스", "에이스", "엘리시아",
    "여포", "연희", "오목", "제이브", "쥬리", "챈슬러", "초선", "카구라", "카론", "카르마",
    "카린", "카일", "칼헤론", "콜트", "크리스", "키리엘", "태오", "트루드", "파이", "팔라누스",
    "프레이야", "플라튼", "헬레니아",
  ];
  const characterImages = Object.fromEntries(characterCatalog.map((name) => [name, `assets/character/${name}.png`]));
  let characterComboboxId = 0;

  const sheetDefaults = {
    attack: {
      title: "공격 족보",
      formationType: "att",
      allyFormationType: "base",
      seasonNote: "세븐나이츠 리버스 길드전",
      round: 0,
      totalRound: 18,
      bosses: ["라온일", "여라갈", "밀프레", "초오린", "트젤미"],
      enemyTeam: ["루디", "레이첼", "아일린"],
      allyTeam: ["밀리아", "레긴레이프", "프레이야"],
      enemyPositions: [1, 2, 3, 4],
      allyPositions: [1, 2, 3, 4],
      enemyPets: { main: "", alt: "" },
      allyPets: { main: "", alt: "" },
      gear: [
        "- / - / - / - / - / -",
        "- / - / - / - / - / -",
        "- / - / - / - / - / -",
      ],
      skillOrder: ["레긴레이프 2", "프레이야 2", "밀리아 1"],
      skillNote: "",
      memo: "1. 노아 버프 -> 2. 레긴레이프 스킬 -> 3. 레이첼 마무리",
    },
    defense: {
      title: "방어 족보",
      formationType: "def",
      allyFormationType: "base",
      seasonNote: "세븐나이츠 리버스 길드전",
      round: 0,
      totalRound: 18,
      bosses: ["방어 1", "방어 2", "방어 3", "방어 4", "방어 5"],
      enemyTeam: ["상대 1", "상대 2", "상대 3"],
      allyTeam: ["루디", "아일린", "레이첼"],
      enemyPositions: [1, 2, 3, 4],
      allyPositions: [1, 2, 3, 4],
      enemyPets: { main: "", alt: "" },
      allyPets: { main: "", alt: "" },
      gear: [
        "- / - / - / - / - / -",
        "- / - / - / - / - / -",
        "- / - / - / - / - / -",
      ],
      skillOrder: ["루디 1", "아일린 2", "레이첼 1"],
      skillNote: "",
      memo: "방어 조합은 생존력과 반격 변수 위주로 확인합니다.",
    },
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeSheet(sheet, fallback) {
    const bosses = Array.isArray(sheet?.bosses) && sheet.bosses.length ? sheet.bosses : fallback.bosses;
    const sourceTargets = Array.isArray(sheet?.targetSheets) ? sheet.targetSheets : [];
    const baseTarget = {
      formationType: sheet?.formationType || fallback.formationType,
      allyFormationType: sheet?.allyFormationType || fallback.allyFormationType,
      enemyTeam: sheet?.enemyTeam || fallback.enemyTeam,
      allyTeam: sheet?.allyTeam || fallback.allyTeam,
      enemyPositions: sheet?.enemyPositions || fallback.enemyPositions,
      allyPositions: sheet?.allyPositions || fallback.allyPositions,
      enemyPets: sheet?.enemyPets || fallback.enemyPets,
      allyPets: sheet?.allyPets || fallback.allyPets,
      gear: sheet?.gear || fallback.gear,
      skillOrder: sheet?.skillOrder || fallback.skillOrder,
      skillNote: typeof sheet?.skillNote === "string" ? sheet.skillNote : fallback.skillNote,
      memo: sheet?.memo || fallback.memo,
    };
    const targetSheets = bosses.map((name, index) => normalizeTarget(sourceTargets[index] || (index === 0 ? baseTarget : {}), fallback, name));
    const activeTargetIndex = Math.min(Math.max(Number(sheet?.activeTargetIndex) || 0, 0), Math.max(0, bosses.length - 1));

    return {
      ...fallback,
      ...sheet,
      bosses,
      activeTargetIndex,
      targetSheets,
    };
  }

  function normalizeVariant(source = {}, fallback) {
    return {
      allyFormationType: formationTypes[source?.allyFormationType] ? source.allyFormationType : fallback.allyFormationType,
      allyTeam: Array.isArray(source?.allyTeam) ? source.allyTeam : fallback.allyTeam,
      allyPositions: Array.isArray(source?.allyPositions) ? source.allyPositions : fallback.allyPositions,
      allyPets: normalizePets(source?.allyPets, fallback.allyPets, source?.allyTeam || fallback.allyTeam),
      gear: Array.isArray(source?.gear) ? source.gear : fallback.gear,
      skillOrder: Array.isArray(source?.skillOrder) ? source.skillOrder : fallback.skillOrder,
      skillNote: typeof source?.skillNote === "string" ? source.skillNote : fallback.skillNote,
      memo: typeof source?.memo === "string" ? source.memo : fallback.memo,
    };
  }

  function normalizeVariants(target, fallback) {
    const baseVariant = normalizeVariant(target, fallback);
    const variants = Array.isArray(target?.variants) ? target.variants : [];
    return planCards.map((_, index) => normalizeVariant(variants[index] || baseVariant, baseVariant));
  }

  function shouldUseVariants(fallback) {
    return fallback === sheetDefaults.attack || fallback?.targetSheets?.some((target) => Array.isArray(target?.variants));
  }

  function normalizeTarget(target, fallback, name) {
    const includeVariants = shouldUseVariants(fallback);
    const variants = includeVariants ? normalizeVariants(target, fallback) : undefined;
    return {
      name,
      formationType: formationTypes[target?.formationType] ? target.formationType : fallback.formationType,
      allyFormationType: formationTypes[target?.allyFormationType] ? target.allyFormationType : fallback.allyFormationType,
      enemyTeam: Array.isArray(target?.enemyTeam) ? target.enemyTeam : fallback.enemyTeam,
      allyTeam: Array.isArray(target?.allyTeam) ? target.allyTeam : fallback.allyTeam,
      enemyPositions: Array.isArray(target?.enemyPositions) ? target.enemyPositions : fallback.enemyPositions,
      allyPositions: Array.isArray(target?.allyPositions) ? target.allyPositions : fallback.allyPositions,
      enemyPets: normalizePets(target?.enemyPets, fallback.enemyPets, target?.enemyTeam || fallback.enemyTeam),
      allyPets: normalizePets(target?.allyPets, fallback.allyPets, target?.allyTeam || fallback.allyTeam),
      gear: Array.isArray(target?.gear) ? target.gear : fallback.gear,
      skillOrder: Array.isArray(target?.skillOrder) ? target.skillOrder : fallback.skillOrder,
      skillNote: typeof target?.skillNote === "string" ? target.skillNote : fallback.skillNote,
      memo: typeof target?.memo === "string" ? target.memo : fallback.memo,
      ...(includeVariants ? { variants } : {}),
    };
  }

  function getActiveTarget(sheet) {
    return sheet.targetSheets?.[sheet.activeTargetIndex] || normalizeTarget({}, sheet, sheet.bosses[0] || "대상");
  }

  function getActivePlanTarget(sheet, mode, activePlanIndex = 0) {
    const target = getActiveTarget(sheet);
    if (mode !== "attack") return target;
    const planIndex = Math.min(Math.max(Number(activePlanIndex) || 0, 0), planCards.length - 1);
    return {
      ...target,
      ...(target.variants?.[planIndex] || target.variants?.[0] || {}),
    };
  }

  function normalizeState(saved = {}) {
    return {
      attack: normalizeSheet(saved.attack, sheetDefaults.attack),
      defense: normalizeSheet(saved.defense, sheetDefaults.defense),
    };
  }

  function loadState() {
    try {
      return normalizeState(JSON.parse(localStorage.getItem(storageKey) || "{}"));
    } catch {
      return normalizeState();
    }
  }

  function saveState(state) {
    localStorage.setItem(storageKey, JSON.stringify(normalizeState(state)));
  }

  async function loadRemoteState(fallbackState = loadState()) {
    try {
      const response = await fetch("/api/guild-war/sheets", { headers: { Accept: "application/json" } });
      if (!response.ok) return normalizeState(fallbackState);
      const data = await response.json();
      return normalizeState({
        ...fallbackState,
        ...(data.state || {}),
      });
    } catch {
      return normalizeState(fallbackState);
    }
  }

  async function saveRemoteState(state) {
    const normalized = normalizeState(state);
    const response = await fetch("/api/admin/guild-war/sheets", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ state: normalized }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "족보 저장에 실패했습니다.");
    }
    saveState(data.state || normalized);
    return normalizeState(data.state || normalized);
  }

  function resetState() {
    localStorage.removeItem(storageKey);
    return normalizeState();
  }

  function field(form, name) {
    return form.elements.namedItem(name);
  }

  function splitList(value, fallback) {
    const items = String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items : fallback;
  }

  function normalizePositions(value, fallback) {
    const positions = Array.isArray(value) ? value : fallback;
    return [0, 1, 2].map((index) => {
      const position = Number(positions[index]) || Number(fallback[index]) || index + 1;
      return Math.min(5, Math.max(1, position));
    });
  }

  function normalizePets(value, fallback, team = []) {
    const cleanPet = (name) => (name === "펫" ? "" : name || "");
    const legacyPet = Array.isArray(team) ? cleanPet(team[3]) : "";
    return {
      main: typeof value?.main === "string" ? cleanPet(value.main) : legacyPet || cleanPet(fallback?.main),
      alt: typeof value?.alt === "string" ? cleanPet(value.alt) : cleanPet(fallback?.alt),
    };
  }

  function readPets(form, prefix, fallback) {
    return {
      main: field(form, `${prefix}MainPet`).value.trim(),
      alt: field(form, `${prefix}AltPet`).value.trim() || "",
    };
  }

  function getPositionLayout(layout, positions) {
    const normalized = normalizePositions(positions, [1, 2, 3, 4]);
    return normalized.map((position, index) => layout[position - 1] || layout[index] || layout[0]);
  }

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function parseGear(line) {
    const parts = String(line || "")
      .split("/")
      .map((part) => part.trim());
    return [...parts, "", "", "", "", ""].slice(0, 6);
  }

  function parseAccessory(value) {
    const text = String(value || "").trim();
    if (!text || text === "-") return { type: "-", refine: "-", grade: "" };
    const type = Object.keys(accessoryVisuals).find((name) => text.includes(name)) || text;
    const gradeMatch = text.match(/([456](?:\/[456])?)\s*★?/);
    const refineMatch = text.match(/\(([^)]+)\)$/);
    return {
      type,
      refine: normalizeAccessoryRefine(refineMatch ? refineMatch[1].trim() : "-"),
      grade: gradeMatch ? gradeMatch[1] : "",
    };
  }

  function normalizeAccessoryRefine(value) {
    const refine = String(value || "").trim();
    if (!refine || refine === "-") return refine;
    return accessoryRefineAliases[refine] || refine;
  }

  function toAdminInputValue(value) {
    if (value === "-" || legacyDefaultGearValues.has(value)) return "";
    return value;
  }

  function formatAccessoryGrade(grade) {
    if (!grade) return "";
    return grade.includes("/") ? grade : `${grade} ★`;
  }

  function getAccessoryImageGrade(grade) {
    const imageGrade = String(grade || "6").split("/").pop();
    return ["4", "5", "6"].includes(imageGrade) ? imageGrade : "6";
  }

  function formatAccessory(type, refine, grade) {
    if (!type || type === "-") return "-";
    const gradeText = grade ? ` ${formatAccessoryGrade(grade)}` : "";
    const normalizedRefine = normalizeAccessoryRefine(refine);
    const refineText = normalizedRefine && normalizedRefine !== "-" ? ` (${normalizedRefine})` : "";
    return `${type}${gradeText}${refineText}`;
  }

  function fillGearFields(form, gearList) {
    gearList.slice(0, 3).forEach((line, index) => {
      const parts = parseGear(line);
      const accessory = parseAccessory(parts[4]);
      setSelectValue(field(form, `gearHero${index}`), toAdminInputValue(parts[0]));
      field(form, `gearSet${index}`).value = toAdminInputValue(parts[1]);
      field(form, `gearWeapon${index}`).value = toAdminInputValue(parts[2]);
      field(form, `gearArmor${index}`).value = toAdminInputValue(parts[3]);
      setSelectValue(field(form, `gearAccessoryType${index}`), toAdminInputValue(accessory.type));
      setSelectValue(field(form, `gearAccessoryRefine${index}`), toAdminInputValue(accessory.refine));
      setSelectValue(field(form, `gearAccessoryGrade${index}`), accessory.grade);
      field(form, `gearMemo${index}`).value = toAdminInputValue(parts[5]);
    });
  }

  function fillPositionFields(form, prefix, positions) {
    normalizePositions(positions, [1, 2, 3]).forEach((position, index) => {
      setSelectValue(field(form, `${prefix}Position${index}`), String(position));
    });
  }

  function fillTeamFields(form, prefix, team) {
    [0, 1, 2].forEach((index) => {
      setSelectValue(field(form, `${prefix}Hero${index}`), team[index] || "");
    });
  }

  function getHeroSourcePrefix(mode) {
    return mode === "defense" ? "enemy" : "ally";
  }

  function syncGearHeroes(form, sourcePrefix = "ally") {
    [0, 1, 2].forEach((index) => {
      setSelectValue(field(form, `gearHero${index}`), field(form, `${sourcePrefix}Hero${index}`).value);
    });
  }

  function syncSkillHeroes(form, sourcePrefix = "ally") {
    [0, 1, 2].forEach((index) => {
      const skillEntry = field(form, `slotHero${index}`);
      if (!skillEntry.value.trim()) {
        skillEntry.value = field(form, `${sourcePrefix}Hero${index}`).value;
      }
    });
  }

  function setSelectValue(select, value) {
    const normalized = value || "";
    if (normalized && ![...select.options].some((option) => option.value === normalized)) {
      const option = document.createElement("option");
      option.value = normalized;
      option.textContent = normalized;
      select.append(option);
    }
    select.value = normalized;
    syncCharacterCombobox(select);
  }

  function readGearFields(form, fallback, sourcePrefix = "ally") {
    return [0, 1, 2].map((index) => {
      const accessory = formatAccessory(
        field(form, `gearAccessoryType${index}`).value.trim(),
        field(form, `gearAccessoryRefine${index}`).value.trim(),
        field(form, `gearAccessoryGrade${index}`).value.trim(),
      );
      const parts = [
        field(form, `${sourcePrefix}Hero${index}`).value.trim(),
        field(form, `gearSet${index}`).value.trim(),
        field(form, `gearWeapon${index}`).value.trim(),
        field(form, `gearArmor${index}`).value.trim(),
        accessory,
        field(form, `gearMemo${index}`).value.trim(),
      ];
      const hasMeaningfulValue = parts.some((part) => part && part !== "-");
      if (!hasMeaningfulValue) return fallback[index];
      return parts.map((part) => part || "-").join(" / ");
    });
  }

  function readPositionFields(form, prefix, fallback) {
    return [0, 1, 2].map((index) => Number(field(form, `${prefix}Position${index}`).value) || Number(fallback[index]) || index + 1);
  }

  function readTeamFields(form, prefix, fallback) {
    const values = [0, 1, 2].map((index) => field(form, `${prefix}Hero${index}`).value.trim());
    if (!values.some(Boolean)) return fallback.slice(0, 3);
    return values.map((value, index) => value || fallback[index] || "-");
  }

  function parseSkillEntry(value) {
    if (value && typeof value === "object") {
      return {
        hero: String(value.label || value.hero || value.name || "").trim(),
        skill: String(value.skill || "").trim(),
      };
    }
    const text = String(value || "").trim();
    const match = text.match(/\s+([0-9]+)$/);
    return {
      hero: match ? text.slice(0, match.index).trim() : text,
      skill: match ? match[1] : "",
    };
  }

  function getTokenImage(name, className = "") {
    const cleanName = String(name || "").trim();
    if (!cleanName) return "";
    if (className.includes("pet")) return petImages[cleanName] || "";
    return characterImages[cleanName] || "";
  }

  function createToken(name, className, subLabel = "") {
    const token = document.createElement("div");
    const icon = document.createElement("i");
    const label = document.createElement("span");
    const imageSrc = getTokenImage(name, className);
    token.className = `hero-token ${className}`;
    if (imageSrc) {
      const image = document.createElement("img");
      image.src = imageSrc;
      image.alt = name;
      icon.classList.add("has-image");
      icon.append(image);
    } else {
      icon.textContent = String(name || "?").slice(0, 1);
    }
    label.textContent = name || "-";
    token.append(icon, label);
    if (subLabel) {
      const sub = document.createElement("small");
      sub.textContent = subLabel;
      token.append(sub);
    }
    return token;
  }

  function renderTokens(target, names, classes, positions = [], pets = {}) {
    const stage = document.querySelector(target);
    stage.replaceChildren();
    names.slice(0, 3).forEach((name, index) => {
      const token = createToken(name, classes[index]);
      if (positions[index]) {
        token.style.top = positions[index].top;
        token.style.left = positions[index].left;
        token.style.right = "auto";
        token.style.bottom = "auto";
        token.style.transform = "translate(-50%, -50%)";
      }
      stage.append(token);
    });
    const pet = normalizePets(pets, {}, names);
    if (pet.main) {
      stage.append(createToken(pet.main, "support pet fixed-pet", pet.alt ? `대체 ${pet.alt}` : ""));
    }
  }

  function renderPositionOptions(select) {
    select.replaceChildren();
    [1, 2, 3, 4, 5].forEach((position) => {
      const option = document.createElement("option");
      option.value = String(position);
      option.textContent = `${position}번 자리`;
      select.append(option);
    });
  }

  function initPositionEditors(form) {
    form.querySelectorAll("[data-position-select]").forEach((select) => {
      if (!select.options.length) renderPositionOptions(select);
    });
  }

  function initPetDatalist() {
    const list = document.querySelector("#petOptions");
    if (!list || list.children.length) return;
    petCatalog.forEach((petName) => {
      const option = document.createElement("option");
      option.value = petName;
      list.append(option);
    });
  }

  function renderCharacterOptions(select) {
    const placeholder = select.dataset.placeholder || "캐릭터";
    select.replaceChildren();
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = placeholder;
    select.append(blank);
    characterCatalog.forEach((characterName) => {
      const option = document.createElement("option");
      option.value = characterName;
      option.textContent = characterName;
      select.append(option);
    });
    syncCharacterCombobox(select);
  }

  function getCharacterMatches(query) {
    const keyword = String(query || "").trim();
    const source = keyword
      ? characterCatalog.filter((characterName) => characterName.includes(keyword))
      : characterCatalog;
    return source.slice(0, 14);
  }

  function syncCharacterCombobox(select) {
    if (!select?.dataset?.comboboxInputId) return;
    const input = document.querySelector(`#${select.dataset.comboboxInputId}`);
    if (input && input.value !== select.value) input.value = select.value || "";
  }

  function chooseCharacter(select, value) {
    setSelectValue(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function renderCharacterComboboxMenu(select, input, menu) {
    const matches = getCharacterMatches(input.value);
    menu.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "character-combobox-empty";
      empty.textContent = "일치하는 영웅이 없습니다";
      menu.append(empty);
    } else {
      matches.forEach((characterName) => {
        const option = document.createElement("button");
        option.type = "button";
        option.textContent = characterName;
        option.className = characterName === select.value ? "active" : "";
        option.addEventListener("mousedown", (event) => event.preventDefault());
        option.addEventListener("click", () => {
          chooseCharacter(select, characterName);
          menu.hidden = true;
        });
        menu.append(option);
      });
    }
    menu.hidden = false;
  }

  function enhanceCharacterSelect(select) {
    if (!select || select.disabled || select.dataset.comboboxReady === "true") return;

    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    const menu = document.createElement("div");
    const inputId = `characterCombobox${++characterComboboxId}`;

    wrapper.className = "character-combobox";
    input.type = "text";
    input.id = inputId;
    input.className = "character-combobox-input";
    input.placeholder = `${select.dataset.placeholder || "영웅"} 검색`;
    input.autocomplete = "off";
    input.spellcheck = false;
    menu.className = "character-combobox-menu";
    menu.hidden = true;

    select.dataset.comboboxReady = "true";
    select.dataset.comboboxInputId = inputId;
    select.hidden = true;
    select.tabIndex = -1;
    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(select, input, menu);

    input.addEventListener("focus", () => renderCharacterComboboxMenu(select, input, menu));
    input.addEventListener("input", () => renderCharacterComboboxMenu(select, input, menu));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        menu.hidden = true;
        syncCharacterCombobox(select);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const firstMatch = getCharacterMatches(input.value)[0];
        if (firstMatch) {
          chooseCharacter(select, firstMatch);
          menu.hidden = true;
        }
      }
    });
    input.addEventListener("blur", () => {
      window.setTimeout(() => {
        const typedName = input.value.trim();
        if (characterCatalog.includes(typedName)) {
          chooseCharacter(select, typedName);
        } else {
          syncCharacterCombobox(select);
        }
        menu.hidden = true;
      }, 120);
    });
    select.addEventListener("change", () => syncCharacterCombobox(select));
    syncCharacterCombobox(select);
  }

  function initCharacterSelects(form) {
    form.querySelectorAll("[data-character-select]").forEach((select) => {
      if (!select.options.length) renderCharacterOptions(select);
      enhanceCharacterSelect(select);
    });
  }

  function syncAdminModeVisibility(mode) {
    const isDefense = mode === "defense";
    setText("#formationTypeLabelText", isDefense ? "진형" : "상대 진형");
    setText("#enemyTeamLabelText", isDefense ? "방어덱" : "상대 방어대");
    setText("#enemyPositionLabelText", isDefense ? "자리 지정" : "상대 자리 지정");
    setText("#enemyPetLabelText", isDefense ? "메인펫" : "상대 펫");
    document.querySelector("#adminPlanRow")?.classList.toggle("hidden", isDefense);
    document.querySelector("#allyTeamLabel")?.classList.toggle("hidden", isDefense);
    document.querySelector("#allyFormationLabel")?.classList.toggle("hidden", isDefense);
    document.querySelector("#allyPositionPanel")?.classList.toggle("hidden", isDefense);
    document.querySelector("#allyPetPanel")?.classList.toggle("hidden", isDefense);
    document.querySelector("#teamEditor")?.classList.toggle("single-column", isDefense);
    document.querySelector("#positionEditor")?.classList.toggle("single-column", isDefense);
    document.querySelector("#petEditor")?.classList.toggle("single-column", isDefense);
    document.querySelector("#enemyAltPetLabel")?.classList.toggle("hidden", mode === "attack");
  }

  function renderModeTabs(containerSelector, activeMode, onSelect) {
    const container = document.querySelector(containerSelector);
    container.replaceChildren();
    modes.forEach((mode) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = mode === activeMode ? "active" : "";
      button.textContent = modeLabels[mode];
      button.addEventListener("click", () => onSelect(mode));
      container.append(button);
    });
  }

  function renderTargetSelect(sheet, selector) {
    const select = document.querySelector(selector);
    if (!select) return;
    select.replaceChildren();
    sheet.bosses.forEach((boss, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = boss;
      select.append(option);
    });
    select.value = String(sheet.activeTargetIndex || 0);
  }

  function renderAccessoryCell(value) {
    const normalized = value || "-";
    const accessory = parseAccessory(normalized);
    const visual = accessoryVisuals[accessory.type];
    const cell = document.createElement("span");
    if (!visual) {
      cell.textContent = normalized || "-";
      return cell;
    }

    const badge = document.createElement("span");
    const mark = document.createElement("i");
    const name = document.createElement("em");
    const level = document.createElement("b");
    cell.className = "accessory-cell";
    badge.className = `accessory-badge ${visual.tone}`;
    mark.className = "accessory-mark";
    name.textContent = accessory.type;
    level.textContent = [formatAccessoryGrade(accessory.grade), accessory.refine !== "-" ? accessory.refine : ""]
      .filter(Boolean)
      .join(" / ");

    const imageSrc = visual.images?.[getAccessoryImageGrade(accessory.grade)];
    if (imageSrc) {
      const image = document.createElement("img");
      image.src = imageSrc;
      image.alt = normalized;
      mark.classList.add("has-image");
      mark.append(image);
    } else {
      mark.textContent = visual.label.slice(0, 1);
    }

    badge.append(mark, name, level);
    cell.append(badge);
    return cell;
  }

  function renderGear(sheet) {
    const rows = document.querySelector("#gearRows");
    rows.replaceChildren();
    sheet.gear.slice(0, 3).forEach((line) => {
      const parts = parseGear(line);
      const row = document.createElement("div");
      row.className = "table-row";
      const hero = document.createElement("b");
      hero.textContent = parts[0] || "영웅";
      row.append(hero);
      parts.slice(1, 4).forEach((part) => {
        const cell = document.createElement("span");
        cell.textContent = part || "-";
        row.append(cell);
      });
      row.append(renderAccessoryCell(parts[4]));
      const memo = document.createElement("small");
      memo.textContent = parts[5] || "-";
      row.append(memo);
      rows.append(row);
    });
  }

  function renderSkillOrder(sheet) {
    const order = document.querySelector("#skillOrderPreview");
    order.replaceChildren();
    sheet.skillOrder.slice(0, 3).forEach((entry) => {
      const parsed = parseSkillEntry(entry);
      const card = document.createElement("article");
      const face = document.createElement("div");
      const icon = document.createElement("i");
      const label = document.createElement("span");
      const chips = document.createElement("div");
      const first = document.createElement("b");
      const second = document.createElement("b");
      card.className = "order-card";
      face.className = "order-face";
      chips.className = "order-chips";
      const imageSrc = getTokenImage(parsed.hero);
      if (imageSrc) {
        const image = document.createElement("img");
        image.src = imageSrc;
        image.alt = parsed.hero;
        icon.classList.add("has-image");
        icon.append(image);
      } else {
        icon.textContent = String(parsed.hero || "?").slice(0, 1);
      }
      label.textContent = parsed.hero || "-";
      first.textContent = "1";
      second.textContent = "2";
      first.className = parsed.skill === "1" ? "active" : "";
      second.className = parsed.skill === "2" ? "active" : "";
      face.append(icon, label);
      chips.append(first, second);
      card.append(face, chips);
      order.append(card);
    });
  }

  function renderPublic(sheet, mode, activePlanIndex = 0) {
    const activeTarget = getActivePlanTarget(sheet, mode, activePlanIndex);
    const round = Number(sheet.round) || 0;
    const total = Math.max(1, Number(sheet.totalRound) || sheetDefaults[mode].totalRound);
    const allyFormation = formationTypes[activeTarget.allyFormationType] || formationTypes.base;
    const planIndex = Math.min(Math.max(Number(activePlanIndex) || 0, 0), planCards.length - 1);
    setText("#publicModeLabel", modeLabels[mode]);
    setText("#targetSelectLabel", mode === "attack" ? "공격 대상" : "방어 대상");
    setText("#publicDefensePanelTitle", mode === "attack" ? "상대 방어대" : "방어덱");
    setText("#publicDefensePanelSubtitle", mode === "attack" ? "공격 진형" : "진형");
    setText("#primaryFormationHint", mode === "attack" ? allyFormation.label : "권장");
    setText("#activeCompositionLabel", planCards[planIndex].label);
    document.querySelectorAll("[data-plan-card]").forEach((card) => {
      const isActive = Number(card.dataset.planCard) === planIndex;
      card.classList.toggle("active", isActive);
      card.setAttribute("aria-pressed", String(isActive));
    });
    renderFormationType(activeTarget);
    setText("#previewSeasonNote", sheet.seasonNote);
    setText("#previewRound", `라운드 ${round} / ${total}`);
    document.querySelector("#previewProgress").style.width = `${Math.min(100, (round / total) * 100)}%`;
    renderTargetSelect(sheet, "#publicTargetSelect");
    document.querySelector("#formationCardRow")?.classList.toggle("hidden", mode === "defense");
    document.querySelector("#compositionGrid")?.classList.toggle("defense-only", mode === "defense");
    document.querySelector("#allyCompositionPanel")?.classList.toggle("hidden", mode === "defense");
    const formationLayout = formationLayouts[activeTarget.formationType] || formationLayouts.base;
    const allyFormationLayout = formationLayouts[activeTarget.allyFormationType] || formationLayouts.base;
    const enemyPets = mode === "attack" ? { ...activeTarget.enemyPets, alt: "" } : activeTarget.enemyPets;
    renderTokens("#enemyStage", activeTarget.enemyTeam, ["enemy", "enemy", "enemy"], getPositionLayout(formationLayout, activeTarget.enemyPositions), enemyPets);
    renderTokens("#allyStage", activeTarget.allyTeam, ["ally a", "ally b", "ally c"], getPositionLayout(allyFormationLayout, activeTarget.allyPositions), activeTarget.allyPets);
    renderGear(activeTarget);
    renderSkillOrder(activeTarget);
    setText("#skillNotePreview", activeTarget.skillNote);
    setText("#memoPreview", activeTarget.memo);
  }

  function renderFormationType(sheet) {
    const type = formationTypes[sheet.formationType] || formationTypes.base;
    const image = document.querySelector("#formationTypeImage");
    if (!image) return;
    image.src = type.src;
    image.alt = type.label;
    setText("#formationTypeLabel", type.label);
  }

  function fillAdminForm(form, sheet, mode, activePlanIndex = 0) {
    const baseTarget = getActiveTarget(sheet);
    const activeTarget = getActivePlanTarget(sheet, mode, activePlanIndex);
    initPositionEditors(form);
    initPetDatalist();
    initCharacterSelects(form);
    syncAdminModeVisibility(mode);
    field(form, "formationType").value = baseTarget.formationType;
    field(form, "allyFormationType").value = activeTarget.allyFormationType;
    field(form, "bosses").value = sheet.bosses.join(", ");
    renderTargetSelect(sheet, "#adminTargetSelect");
    document.querySelector("#adminTargetSelectLabel").textContent = mode === "attack" ? "공격 대상" : "방어 대상";
    document.querySelector("#targetManagerTitle").textContent = mode === "attack" ? "공격 대상 관리" : "방어덱 관리";
    fillTeamFields(form, "enemy", activeTarget.enemyTeam);
    fillTeamFields(form, "ally", activeTarget.allyTeam);
    field(form, "enemyMainPet").value = activeTarget.enemyPets.main;
    field(form, "enemyAltPet").value = activeTarget.enemyPets.alt;
    field(form, "allyMainPet").value = activeTarget.allyPets.main;
    field(form, "allyAltPet").value = activeTarget.allyPets.alt;
    fillPositionFields(form, "enemy", activeTarget.enemyPositions);
    fillPositionFields(form, "ally", activeTarget.allyPositions);
    fillGearFields(form, activeTarget.gear);
    const sourcePrefix = getHeroSourcePrefix(mode);
    syncGearHeroes(form, sourcePrefix);
    [0, 1, 2].forEach((index) => {
      field(form, `slotHero${index}`).value = "";
      field(form, `slotSkill${index}`).value = "";
    });
    activeTarget.skillOrder.slice(0, 3).forEach((skill, index) => {
      const parsed = parseSkillEntry(skill);
      field(form, `slotHero${index}`).value = parsed.hero;
      field(form, `slotSkill${index}`).value = parsed.skill;
    });
    syncSkillChoiceButtons(form);
    field(form, "skillNote").value = activeTarget.skillNote;
    field(form, "memo").value = activeTarget.memo;
  }

  function readAdminForm(form, fallback, previousSheet = fallback, activePlanIndex = 0) {
    const isDefense = fallback === sheetDefaults.defense;
    const sourcePrefix = isDefense ? "enemy" : "ally";
    const planIndex = Math.min(Math.max(Number(activePlanIndex) || 0, 0), planCards.length - 1);
    const skillOrder = [0, 1, 2]
      .map((index) => ({
        hero: field(form, `${sourcePrefix}Hero${index}`).value.trim(),
        label: field(form, `slotHero${index}`).value.trim(),
        skill: field(form, `slotSkill${index}`).value.trim(),
      }))
      .filter((slot) => slot.label || slot.hero)
      .map((slot) => ({
        label: slot.label || slot.hero,
        skill: slot.skill,
      }));
    const bosses = splitList(field(form, "bosses").value, fallback.bosses);
    const activeTargetIndex = Math.min(Math.max(Number(previousSheet.activeTargetIndex) || 0, 0), Math.max(0, bosses.length - 1));
    const previousTargets = Array.isArray(previousSheet.targetSheets) ? previousSheet.targetSheets : [];
    const targetSheets = bosses.map((name, index) => {
      const existing = normalizeTarget(previousTargets[index] || {}, fallback, name);
      if (index !== activeTargetIndex) return { ...existing, name };
      const enemyPets = readPets(form, "enemy", existing.enemyPets || fallback.enemyPets);
      if (!isDefense) enemyPets.alt = "";
      const variantFallback = existing.variants?.[planIndex] || existing;
      const currentVariant = {
        allyFormationType: field(form, "allyFormationType").value || variantFallback.allyFormationType || fallback.allyFormationType,
        allyTeam: readTeamFields(form, "ally", variantFallback.allyTeam || fallback.allyTeam),
        allyPositions: readPositionFields(form, "ally", variantFallback.allyPositions || fallback.allyPositions),
        allyPets: readPets(form, "ally", variantFallback.allyPets || fallback.allyPets),
        gear: readGearFields(form, variantFallback.gear || fallback.gear, sourcePrefix),
        skillOrder: skillOrder.length ? skillOrder : variantFallback.skillOrder || fallback.skillOrder,
        skillNote: field(form, "skillNote").value.trim(),
        memo: field(form, "memo").value.trim() || fallback.memo,
      };
      const variants = isDefense
        ? undefined
        : planCards.map((_, variantIndex) => (
          variantIndex === planIndex
            ? currentVariant
            : normalizeVariant(existing.variants?.[variantIndex], existing.variants?.[0] || existing)
        ));
      const primaryVariant = variants?.[0] || currentVariant;
      return {
        name,
        formationType: field(form, "formationType").value || fallback.formationType,
        allyFormationType: isDefense ? existing.allyFormationType : primaryVariant.allyFormationType,
        enemyTeam: readTeamFields(form, "enemy", fallback.enemyTeam),
        allyTeam: isDefense ? existing.allyTeam : primaryVariant.allyTeam,
        enemyPositions: readPositionFields(form, "enemy", existing.enemyPositions || fallback.enemyPositions),
        allyPositions: isDefense ? existing.allyPositions : primaryVariant.allyPositions,
        enemyPets,
        allyPets: isDefense ? existing.allyPets : primaryVariant.allyPets,
        gear: isDefense ? readGearFields(form, fallback.gear, sourcePrefix) : primaryVariant.gear,
        skillOrder: isDefense ? (skillOrder.length ? skillOrder : fallback.skillOrder) : primaryVariant.skillOrder,
        skillNote: isDefense ? field(form, "skillNote").value.trim() : primaryVariant.skillNote,
        memo: isDefense ? field(form, "memo").value.trim() || fallback.memo : primaryVariant.memo,
        ...(isDefense ? {} : { variants }),
      };
    });

    const previousRound = Number(previousSheet.round);
    const previousTotalRound = Number(previousSheet.totalRound);
    return {
      title: previousSheet.title || fallback.title,
      seasonNote: previousSheet.seasonNote || fallback.seasonNote,
      round: Number.isFinite(previousRound) ? previousRound : fallback.round,
      totalRound: Number.isFinite(previousTotalRound) ? previousTotalRound : fallback.totalRound,
      bosses,
      activeTargetIndex,
      targetSheets,
    };
  }

  function setActiveTarget(sheet, index) {
    return normalizeSheet({ ...sheet, activeTargetIndex: index }, sheet);
  }

  function setSkillChoice(form, slot, skill) {
    field(form, `slotSkill${slot}`).value = skill;
    syncSkillChoiceButtons(form);
  }

  function syncSkillChoiceButtons(form) {
    form.querySelectorAll(".skill-choice").forEach((choice) => {
      const slot = choice.dataset.slot;
      const value = field(form, `slotSkill${slot}`).value;
      choice.querySelectorAll("button").forEach((button) => {
        button.classList.toggle("active", button.dataset.skill === value);
      });
    });
  }

  async function copySummary(sheet, mode) {
    const summary = `${modeLabels[mode]}\n${sheet.enemyTeam.join(", ")} VS ${sheet.allyTeam.join(", ")}\n${sheet.memo}`;
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      return false;
    }
    return true;
  }

  return {
    modes,
    modeLabels,
    formationTypes,
    petCatalog,
    characterCatalog,
    sheetDefaults,
    loadState,
    saveState,
    loadRemoteState,
    saveRemoteState,
    resetState,
    renderModeTabs,
    renderTargetSelect,
    getActiveTarget,
    getActivePlanTarget,
    setActiveTarget,
    syncGearHeroes,
    syncSkillHeroes,
    renderPublic,
    fillAdminForm,
    readAdminForm,
    setSkillChoice,
    syncSkillChoiceButtons,
    copySummary,
  };
})();
