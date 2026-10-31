/* =============================================================
   Website Builder Wizard — app.js
   Main color theme picker · 200+ multi-select effects · page
   structure · live summary · validated contact form · lead
   delivery to the backend (or Formspree/webhook fallback).
   ============================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     Self-diagnostics overlay — open with ?debug=1 in the URL.
     Shows which app.js version loaded and traces the send flow.
     --------------------------------------------------------- */
  const APP_VERSION = "v5-diagnose";
  const debugOn = /[?&]debug\b/.test(location.search);
  let dbgEl = null;
  const dbgLines = [];

  function ensureDbg() {
    if (dbgEl || !document.body) return;
    dbgEl = document.createElement("pre");
    dbgEl.id = "wiz-debug";
    dbgEl.style.cssText =
      "position:fixed;left:8px;bottom:8px;z-index:99999;max-width:94vw;max-height:45vh;" +
      "overflow:auto;margin:0;padding:10px 12px;background:rgba(0,0,0,.9);color:#4ade80;" +
      "font:11px/1.55 monospace;white-space:pre-wrap;border:1px solid #3f3f46;border-radius:8px;pointer-events:none;";
    document.body.appendChild(dbgEl);
  }

  function dbg(msg) {
    const t = new Date().toTimeString().slice(0, 8);
    dbgLines.push(t + " " + msg);
    if (dbgLines.length > 40) dbgLines.shift();
    if (!debugOn && !dbgEl) return;
    ensureDbg();
    if (dbgEl) {
      dbgEl.textContent =
        "WIZARD DEBUG " + APP_VERSION + "  (" + location.protocol + ")\n" + dbgLines.join("\n");
      dbgEl.scrollTop = dbgEl.scrollHeight;
    }
  }

  window.addEventListener("error", (e) => dbg("JS ERROR: " + (e.message || e.type)));
  window.addEventListener("unhandledrejection", (e) =>
    dbg("PROMISE REJECTION: " + ((e.reason && e.reason.message) || e.reason))
  );
  if (debugOn) ensureDbg();
  dbg("app.js " + APP_VERSION + " evaluated, origin=" + location.origin);

  /* ---------------------------------------------------------
     CONFIG — optional extra delivery endpoints.
     The primary endpoint is POST /api/lead (backend/serverless),
     detected automatically when served over http(s).
     --------------------------------------------------------- */
  const CONFIG = {
    formspreeEndpoint: "", // e.g. "https://formspree.io/f/xxxxxxx"
    webhookUrl: "", // e.g. "https://hooks.example.com/leads"
    emailSubjectPrefix: "[Website Wizard]",
  };

  const CONTACT_PHONE = "9095291686";

  /* ---------------- Data ---------------- */

  const PALETTE = [
    { name: "Royal Blue", hex: "#3B82F6" },
    { name: "Indigo", hex: "#6366F1" },
    { name: "Violet", hex: "#8B5CF6" },
    { name: "Fuchsia", hex: "#D946EF" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Rose", hex: "#F43F5E" },
    { name: "Crimson Red", hex: "#EF4444" },
    { name: "Orange", hex: "#F97316" },
    { name: "Amber", hex: "#F59E0B" },
    { name: "Yellow", hex: "#EAB308" },
    { name: "Lime", hex: "#84CC16" },
    { name: "Green", hex: "#22C55E" },
    { name: "Emerald", hex: "#10B981" },
    { name: "Teal", hex: "#14B8A6" },
    { name: "Cyan", hex: "#06B6D4" },
    { name: "Sky", hex: "#0EA5E9" },
    { name: "Slate Gray", hex: "#64748B" },
    { name: "Charcoal", hex: "#1F2937" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Black", hex: "#000000" },
  ];

  const DEFAULT_PAGES = [
    "Home", "About Us", "Services", "Portfolio", "Contact",
    "FAQ", "Blog", "Gallery", "Testimonials", "Shop",
  ];

  const EFFECT_TIPS = {
    entrance: "Best for: page-load intros and content entering the screen.",
    attention: "Best for: CTAs, alerts and anything that must grab attention.",
    loop: "Best for: ambient life - loaders, hero accents, idle states.",
    hover: "Best for: cards, buttons and links to show they are clickable.",
    text: "Best for: headlines, hero copy and key messages.",
    background: "Best for: hero panels, section backdrops and empty states.",
    shape: "Best for: decorative accents, avatars and icon holders.",
    ui: "Best for: buttons, badges, progress bars and feedback states.",
    threed: "Best for: product showcases, galleries and premium feels.",
  };

  /* ---------------- State ---------------- */
  const state = {
    step: 1,
    maxStep: 1,
    color: PALETTE[0], // { name, hex } — main color theme
    effects: [], // array of effect ids (multi-select)
    pageCount: null,
    pageNames: [],
    customPages: [],
    customNotes: "",
    sending: false,
    sendingAt: 0,
    fxSearch: "",
    fxSort: "category",
    fxCat: "all",
  };

  /* ---------------- Helpers ---------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function normalizeHex(v) {
    let h = String(v || "").trim().toUpperCase();
    if (!h.startsWith("#")) h = "#" + h;
    if (/^#[0-9A-F]{3}$/.test(h)) {
      h = "#" + h.slice(1).split("").map((c) => c + c).join("");
    }
    return /^#[0-9A-F]{6}$/.test(h) ? h : null;
  }

  function nearestName(hex) {
    const [r, g, b] = hexToRgb(hex);
    let best = PALETTE[0];
    let bestD = Infinity;
    for (const p of PALETTE) {
      const [pr, pg, pb] = hexToRgb(p.hex);
      const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return bestD > 1600 ? { name: "Custom Color", hex: best.hex } : best;
  }

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  /* ---------------- DOM refs ---------------- */
  const form = $("#wizard-form");
  const steps = $$(".step");
  const backBtn = $("#back-btn");
  const nextBtn = $("#next-btn");
  const submitBtn = $("#submit-btn");
  const announcer = $("#step-announcer");
  const progressBar = $("#progress-list");
  const colorGrid = $("#color-grid");
  const customColorInput = $("#custom-color-input");
  const customHexInput = $("#custom-hex-input");
  const effectGrid = $("#effect-grid");
  const liveStage = $("#live-preview-stage");
  const chipCloud = $("#chip-cloud");
  const chipInput = $("#custom-page-input");
  const notesArea = $("#custom-notes");
  const notesCount = $("#notes-count");
  const chipCount = $("#chip-count");
  const pageNamesHint = $("#page-names-hint");
  const summaryOutput = $("#summary-output");
  const attachPreview = $("#attach-preview-body");
  const confirmation = $("#confirmation");
  const demoNote = $("#demo-note");

  /* =========================================================
     STEP 1 · MAIN COLOR THEME
     ========================================================= */

  function renderColorGrid() {
    colorGrid.innerHTML = PALETTE.map((c, i) => {
      const checked = i === 0;
      return `
        <button
          type="button"
          class="color-swatch"
          role="radio"
          aria-checked="${checked}"
          aria-label="${esc(c.name)} ${c.hex}"
          data-hex="${c.hex}"
          style="--swatch: ${c.hex}"
        >
          <span class="swatch-name" aria-hidden="true">${esc(c.name)}</span>
          <span class="check-badge" aria-hidden="true">&#10003;</span>
        </button>`;
    }).join("");
  }

  function applyColor(hex, name) {
    const known = PALETTE.find((c) => c.hex === hex);
    const resolved = known || nearestName(hex);
    state.color = known
      ? { name: known.name, hex: known.hex }
      : { name: name || resolved.name || "Custom Color", hex: hex };

    // Mark swatch selection (only for palette matches)
    $$(".color-swatch", colorGrid).forEach((s) =>
      s.setAttribute("aria-checked", String(s.dataset.hex === hex))
    );

    const [r, g, b] = hexToRgb(hex);
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("--accent", hex);
    rootStyle.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
    rootStyle.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.16)`);
    rootStyle.setProperty("--accent-glow", `rgba(${r}, ${g}, ${b}, 0.35)`);

    // Preview panel
    $("#preview-swatch").style.background = hex;
    $("#preview-name").textContent = state.color.name;
    $("#preview-hex").textContent = hex;
    $("#preview-rgb").textContent = `rgb(${r}, ${g}, ${b})`;

    // Keep custom inputs in sync
    if (document.activeElement !== customHexInput) customHexInput.value = hex;
    customColorInput.value = hex.toLowerCase();

    updateSummary();
  }

  function initColors() {
    renderColorGrid();

    colorGrid.addEventListener("click", (e) => {
      const swatch = e.target.closest(".color-swatch");
      if (!swatch) return;
      applyColor(swatch.dataset.hex);
    });

    // Arrow-key navigation inside the radiogroup
    colorGrid.addEventListener("keydown", (e) => {
      if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      const swatches = $$(".color-swatch", colorGrid);
      const idx = swatches.indexOf(document.activeElement);
      const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      const next = swatches[(idx + dir + swatches.length) % swatches.length];
      next.focus();
      applyColor(next.dataset.hex);
    });

    // Custom color picker (native spectrum) + hex field
    customColorInput.addEventListener("input", () => {
      applyColor(customColorInput.value.toUpperCase(), "Custom Color");
    });
    customHexInput.addEventListener("input", () => {
      const hex = normalizeHex(customHexInput.value);
      if (hex) applyColor(hex, "Custom Color");
    });
    customHexInput.addEventListener("blur", () => {
      const hex = normalizeHex(customHexInput.value);
      applyColor(hex || state.color.hex, "Custom Color");
    });
  }

  /* =========================================================
     STEP 2 · EFFECTS (200+, sorted, multi-select)
     ========================================================= */

  const EFFECTS = () => window.WIZARD_EFFECTS || [];
  const sampleHtml = (kind) => {
    switch (kind) {
      case "text": return '<span class="s-text">Sample Text</span>';
      case "heading": return '<span class="s-heading">Heading</span>';
      case "text-underline": return '<span class="s-text s-underline">Underlined</span>';
      case "text-gradient": return '<span class="s-text s-gradient">Gradient Text</span>';
      case "shape-square": return '<span class="s-square"></span>';
      case "shape-triangle": return '<span class="s-triangle"></span>';
      case "shape-blob": return '<span class="s-blob"></span>';
      case "shape-ring": return '<span class="s-ring"></span>';
      case "pill": return '<span class="s-pill">Button</span>';
      case "card": return '<span class="s-card">Card</span>';
      case "badge": return '<span class="s-badge">New</span>';
      case "progress": return '<span class="s-progress"><span class="s-progress-bar"></span></span>';
      case "bg": return '<span class="s-bg">Background</span>';
      case "bg-stripes": return '<span class="s-bg s-stripes">Stripes</span>';
      case "bg-radial": return '<span class="s-bg s-radial">Radial</span>';
      default: return '<span class="s-circle"></span>';
    }
  };

  function effectSample(effect, extraClass) {
    return `<span class="fx-el ${effect.id} ${extraClass || ""}" data-fx="${effect.id}">${sampleHtml(effect.preview)}</span>`;
  }

  function visibleEffects() {
    let list = EFFECTS();
    const q = state.fxSearch.trim().toLowerCase();
    if (state.fxCat !== "all") list = list.filter((e) => e.cat === state.fxCat);
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q) || e.catLabel.toLowerCase().includes(q));
    if (state.fxSort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function renderCategories() {
    const cats = window.WIZARD_EFFECT_CATS || [];
    $("#fx-cats").innerHTML =
      `<button type="button" class="fx-cat is-active" data-cat="all">All</button>` +
      cats.map((c) => `<button type="button" class="fx-cat" data-cat="${c.key}">${c.label} (${c.count})</button>`).join("");
  }

  function renderEffects() {
    const list = visibleEffects();
    $("#fx-count").textContent = `${list.length} effect${list.length === 1 ? "" : "s"}`;

    effectGrid.innerHTML = list
      .map((e) => {
        const checked = state.effects.includes(e.id);
        return `
        <label class="effect-card${checked ? " is-selected" : ""}" data-fx-card="${e.id}">
          <input type="checkbox" value="${e.id}"${checked ? " checked" : ""} />
          <span class="effect-card-top">
            <span class="effect-card-title">${esc(e.name)}</span>
            <span class="effect-card-tag">${e.catLabel}</span>
          </span>
          <span class="effect-demo preview-loop">
            ${effectSample(e, checked ? "is-playing" : "")}
          </span>
          <span class="effect-card-tip">${EFFECT_TIPS[e.cat] || ""}</span>
        </label>`;
      })
      .join("");

    if (list.length === 0) {
      effectGrid.innerHTML = `<p class="fx-empty">No effects match your search.</p>`;
    }
    updateSelectionUi();
  }

  function updateSelectionUi() {
    const n = state.effects.length;
    $("#fx-selected").textContent = n
      ? `${n} selected: ${state.effects
          .map((id) => (EFFECTS().find((e) => e.id === id) || {}).name)
          .filter(Boolean)
          .join(", ")}`
      : "None selected yet";

    const selected = state.effects
      .map((id) => EFFECTS().find((e) => e.id === id))
      .filter(Boolean);

    if (!selected.length) {
      liveStage.innerHTML = `<p class="stage-empty">Select effects above to preview them here together.</p>`;
      return;
    }
    liveStage.innerHTML = selected
      .map(
        (e) => `
        <div class="stage-item">
          ${effectSample(e, "is-playing")}
          <span class="stage-label">${esc(e.name)}</span>
        </div>`
      )
      .join("");
  }

  function playCardPreview(card) {
    const el = card.querySelector(".fx-el");
    if (!el) return;
    el.classList.remove("is-playing");
    void el.offsetWidth;
    el.classList.add("is-playing");
  }

  function stopCardPreview(card) {
    if (card.classList.contains("is-selected")) return;
    card.querySelector(".fx-el")?.classList.remove("is-playing");
  }

  function initEffects() {
    renderCategories();
    renderEffects();

    $("#fx-search").addEventListener("input", (e) => {
      state.fxSearch = e.target.value;
      renderEffects();
    });
    $("#fx-sort").addEventListener("change", (e) => {
      state.fxSort = e.target.value;
      renderEffects();
    });
    $("#fx-cats").addEventListener("click", (e) => {
      const btn = e.target.closest(".fx-cat");
      if (!btn) return;
      state.fxCat = btn.dataset.cat;
      $$(".fx-cat").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderEffects();
    });

    effectGrid.addEventListener("change", (e) => {
      if (e.target.type !== "checkbox") return;
      const id = e.target.value;
      const card = e.target.closest(".effect-card");
      if (e.target.checked) {
        if (!state.effects.includes(id)) state.effects.push(id);
        card.classList.add("is-selected");
        playCardPreview(card);
      } else {
        state.effects = state.effects.filter((x) => x !== id);
        card.classList.remove("is-selected");
        stopCardPreview(card);
      }
      updateSelectionUi();
      updateSummary();
    });

    effectGrid.addEventListener("mouseover", (e) => {
      const card = e.target.closest(".effect-card");
      if (card) playCardPreview(card);
    });
    effectGrid.addEventListener("mouseout", (e) => {
      const card = e.target.closest(".effect-card");
      if (card && !card.contains(e.relatedTarget)) stopCardPreview(card);
    });
    effectGrid.addEventListener("focusin", (e) => {
      const card = e.target.closest(".effect-card");
      if (card) playCardPreview(card);
    });
  }

  /* =========================================================
     STEP 3 · STRUCTURE
     ========================================================= */

  function renderChips() {
    const names = [...DEFAULT_PAGES, ...state.customPages];
    chipCloud.innerHTML = names
      .map((name) => {
        const isCustom = state.customPages.includes(name);
        const checked = state.pageNames.includes(name);
        return `
        <label class="chip${isCustom ? " is-custom" : ""}">
          <input type="checkbox" value="${esc(name)}"${checked ? " checked" : ""} />
          <span>${esc(name)}${
          isCustom
            ? `<button type="button" class="chip-x" data-remove="${esc(name)}" aria-label="Remove custom page ${esc(name)}">&times;</button>`
            : ""
        }</span>
        </label>`;
      })
      .join("");
    updateChipCount();
  }

  function updateChipCount() {
    const n = state.pageNames.length;
    chipCount.textContent = `${n} selected`;
    const rec = { "1-page": "1 name", "3-5 pages": "3-5 names", "5+ pages": "5+ names" }[state.pageCount];
    pageNamesHint.textContent = rec
      ? `Tip: a ${state.pageCount} site usually needs ${rec}. Pick common pages below or add your own.`
      : "Pick common pages below or add your own custom names.";
  }

  function togglePageName(name, on) {
    const i = state.pageNames.indexOf(name);
    if (on && i === -1) state.pageNames.push(name);
    if (!on && i > -1) state.pageNames.splice(i, 1);
    updateChipCount();
    updateSummary();
  }

  function addCustomPage(name) {
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) return;
    const exists = [...DEFAULT_PAGES, ...state.customPages].some(
      (p) => p.toLowerCase() === clean.toLowerCase()
    );
    if (exists) {
      const input = $$("input", chipCloud).find(
        (el) => el.value.toLowerCase() === clean.toLowerCase()
      );
      if (input && !input.checked) {
        input.checked = true;
        togglePageName(input.value, true);
      }
      chipInput.value = "";
      return;
    }
    state.customPages.push(clean);
    renderChips();
    const input = $$("input", chipCloud).find((el) => el.value === clean);
    if (input) {
      input.checked = true;
      togglePageName(clean, true);
    }
    chipInput.value = "";
  }

  function initStructure() {
    renderChips();

    chipCloud.addEventListener("change", (e) => {
      if (e.target.type === "checkbox") togglePageName(e.target.value, e.target.checked);
    });

    chipCloud.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip-x");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const name = btn.dataset.remove;
      state.customPages = state.customPages.filter((p) => p !== name);
      state.pageNames = state.pageNames.filter((p) => p !== name);
      renderChips();
      updateSummary();
    });

    $("#add-page-btn").addEventListener("click", () => addCustomPage(chipInput.value));
    chipInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addCustomPage(chipInput.value);
      }
    });

    $$('input[name="pageCount"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        state.pageCount = radio.value;
        if (radio.value === "1-page") {
          if (!state.customPages.includes("Landing Page")) {
            state.customPages.push("Landing Page");
          }
          renderChips();
          $$("input", chipCloud).forEach((el) => {
            el.checked = el.value === "Landing Page";
          });
          state.pageNames = ["Landing Page"];
          updateChipCount();
        }
        updateSummary();
      });
    });

    notesArea.addEventListener("input", () => {
      state.customNotes = notesArea.value;
      notesCount.textContent = String(notesArea.value.length);
      updateSummary();
    });
  }

  /* =========================================================
     STEP 4 · SUMMARY (exact structured format)
     ========================================================= */

  function buildColourLine() {
    return `${state.color.hex} (${state.color.name})`;
  }

  function buildEffectLine() {
    if (!state.effects.length) return "not selected yet";
    return state.effects
      .map((id) => (EFFECTS().find((e) => e.id === id) || {}).name)
      .filter(Boolean)
      .join(", ");
  }

  function buildSpecLine() {
    const pages = state.pageCount || "pages TBC";
    const names = state.pageNames.length ? state.pageNames.join(", ") : "no pages named yet";
    const notes = state.customNotes.trim() || "None";
    return `${pages} (${names}). Notes: ${notes}`;
  }

  function buildSummary() {
    return [
      `colour:${buildColourLine()}`,
      `effect:${buildEffectLine()}`,
      `specifications:${buildSpecLine()}`,
    ].join("\n");
  }

  function updateSummary() {
    const text = buildSummary();
    summaryOutput.textContent = text;
    attachPreview.textContent = text;

    const recapSwatch = $("#recap-swatch");
    if (recapSwatch) recapSwatch.style.background = state.color.hex;
    $("#recap-color").textContent = `${state.color.name} · ${state.color.hex}`;
    $("#recap-effect").textContent = state.effects.length
      ? `${state.effects.length} effect${state.effects.length === 1 ? "" : "s"} selected`
      : "—";
    $("#recap-specs").textContent = state.pageCount
      ? `${state.pageCount} · ${state.pageNames.length} page name${state.pageNames.length === 1 ? "" : "s"}`
      : "—";
  }

  function initSummary() {
    $("#copy-summary-btn").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const text = buildSummary();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      const old = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = old), 1600);
    });
  }

  /* =========================================================
     STEP NAVIGATION
     ========================================================= */

  function goToStep(n, { focus = true } = {}) {
    n = Math.min(5, Math.max(1, Number(n) || 1));
    dbg("goToStep(" + n + ")");
    state.step = n;
    state.maxStep = Math.max(state.maxStep, n);

    steps.forEach((s) => {
      const active = Number(s.dataset.step) === n;
      s.hidden = !active;
      s.classList.toggle("is-active", active);
    });

    $$(".progress-item", progressBar).forEach((item) => {
      const idx = Number(item.dataset.goto);
      const dot = $(".progress-dot", item);
      item.classList.toggle("is-active", idx === n);
      item.classList.toggle("is-complete", idx < n);
      dot.disabled = idx > state.maxStep;
      if (idx === n) dot.setAttribute("aria-current", "step");
      else dot.removeAttribute("aria-current");
    });

    backBtn.hidden = n === 1;
    nextBtn.hidden = n === 5;
    submitBtn.hidden = n !== 5;

    if (n === 4 || n === 5) updateSummary();
    if (n === 5) validateContact(false);

    const titles = [
      "",
      "Step 1: Choose your main color theme",
      "Step 2: Choose your animation effects",
      "Step 3: Website structure and specs",
      "Step 4: Your specification summary",
      "Step 5: Contact details",
    ];
    announcer.textContent = titles[n];

    if (focus) {
      const heading = $(`#step${n}-title`);
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  /* =========================================================
     VALIDATION
     ========================================================= */

  function showFormAlert(message) {
    clearFormAlert();
    const p = document.createElement("p");
    p.className = "form-alert";
    p.setAttribute("role", "alert");
    p.textContent = message;
    $("#wizard-nav").insertAdjacentElement("afterend", p);
  }

  function clearFormAlert() {
    $(".form-alert")?.remove();
  }

  function validateStep(n) {
    clearFormAlert();
    if (n === 2 && state.effects.length === 0) {
      showFormAlert("Select at least one animation effect to continue.");
      $(".effect-card input")?.focus();
      return false;
    }
    if (n === 3) {
      if (!state.pageCount) {
        showFormAlert("Please choose how many pages your website needs.");
        $('input[name="pageCount"]')?.focus();
        return false;
      }
      if (state.pageNames.length === 0) {
        showFormAlert("Please select or add at least one page name.");
        $("input", chipCloud)?.focus();
        return false;
      }
    }
    return true;
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\+?[\d\s\-().]{7,22}$/;

  function setFieldError(input, errorEl, message) {
    if (message) {
      input.setAttribute("aria-invalid", "true");
      errorEl.textContent = message;
    } else {
      input.removeAttribute("aria-invalid");
      errorEl.textContent = "";
    }
  }

  function validateContact(showErrors = true) {
    const name = $("#full-name");
    const purpose = $("#purpose");
    const phone = $("#phone");
    const email = $("#email");
    let ok = true;

    let msg = "";
    if (!name.value.trim()) msg = showErrors ? "Please enter your full name." : "";
    else if (name.value.trim().length < 2) msg = showErrors ? "Name looks too short." : "";
    setFieldError(name, $("#full-name-error"), msg);
    if (msg) ok = false;

    msg = "";
    if (!purpose.value.trim()) msg = showErrors ? "Tell us briefly why you need the website." : "";
    setFieldError(purpose, $("#purpose-error"), msg);
    if (msg) ok = false;

    msg = "";
    const digits = phone.value.replace(/\D/g, "");
    if (!phone.value.trim()) msg = showErrors ? "Please enter a phone number." : "";
    else if (!PHONE_RE.test(phone.value.trim()) || digits.length < 7 || digits.length > 15)
      msg = showErrors
        ? "Enter a valid phone number (7-15 digits; +, spaces, dashes and brackets are OK)."
        : "";
    setFieldError(phone, $("#phone-error"), msg);
    if (msg) ok = false;

    msg = "";
    if (!email.value.trim()) msg = showErrors ? "Please enter your email address." : "";
    else if (!EMAIL_RE.test(email.value.trim())) msg = showErrors ? "That email doesn't look valid." : "";
    setFieldError(email, $("#email-error"), msg);
    if (msg) ok = false;

    submitBtn.setAttribute("aria-disabled", String(!ok || state.sending));
    return ok;
  }

  function initContact() {
    ["full-name", "purpose", "phone", "email"].forEach((id) => {
      const el = $("#" + id);
      el.addEventListener("blur", () => validateContact(true));
      el.addEventListener("input", () => {
        if (el.getAttribute("aria-invalid") === "true") validateContact(true);
        else submitBtn.setAttribute("aria-disabled", "false");
      });
    });
  }

  /* =========================================================
     SUBMISSION
     ========================================================= */

  function buildPayload() {
    return {
      _subject: `${CONFIG.emailSubjectPrefix} New website request`,
      fullName: $("#full-name").value.trim(),
      purpose: $("#purpose").value.trim(),
      phone: $("#phone").value.trim(),
      email: $("#email").value.trim(),
      summary: buildSummary(),
      colour: buildColourLine(),
      effect: buildEffectLine(),
      specifications: buildSpecLine(),
      submittedAt: new Date().toISOString(),
    };
  }

  function endpoints() {
    const list = [];
    if (window.location.protocol.startsWith("http")) {
      list.push({ url: "/api/lead", kind: "backend", allowFallback: true });
    }
    if (CONFIG.formspreeEndpoint && !CONFIG.formspreeEndpoint.includes("YOUR_FORM_ID")) {
      list.push({ url: CONFIG.formspreeEndpoint, kind: "formspree" });
    }
    if (CONFIG.webhookUrl) list.push({ url: CONFIG.webhookUrl, kind: "webhook" });
    return list;
  }

  function demoCapture(payload, reason) {
    dbg("DEMO FALLBACK: " + reason);
    console.info(
      "%c[Website Wizard] DEMO MODE - lead captured locally only. " + reason,
      "color:#f59e0b;font-weight:bold",
      payload
    );
    try {
      const archive = JSON.parse(localStorage.getItem("wizardLeads") || "[]");
      archive.push(payload);
      localStorage.setItem("wizardLeads", JSON.stringify(archive));
    } catch {
      /* storage unavailable */
    }
    return { demo: true };
  }

  async function sendRequest(payload) {
    const targets = endpoints();
    if (targets.length === 0) return demoCapture(payload, "No endpoint configured.");

    const results = await Promise.allSettled(
      targets.map((t) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 20000);
        return fetch(t.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
          signal: ctrl.signal,
        })
          .then(async (res) => {
            if (!res.ok) {
              const body = await res.text().catch(() => "");
              const err = new Error(`${t.kind} ${res.status}: ${body.slice(0, 200)}`);
              err.http = true;
              throw err;
            }
            return res;
          })
          .finally(() => clearTimeout(timer));
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");
    dbg(
      "API result: " + succeeded.length + " ok, " + failed.length + " failed" +
        (failed[0] ? " — " + String(failed[0].reason && failed[0].reason.message).slice(0, 110) : "")
    );

    if (succeeded.length > 0) {
      if (failed.length) console.warn("[Website Wizard] Some endpoints failed:", failed);
      return { demo: false };
    }

    const onlyFallbackTargets = targets.every((t) => t.allowFallback);
    const allNetworkErrors = failed.every((r) => !r.reason?.http);
    if (onlyFallbackTargets && allNetworkErrors) {
      return demoCapture(payload, "Backend unreachable (is `npm start` running?).");
    }

    console.error("[Website Wizard] Delivery failed:", failed);
    throw new Error(failed[0].reason?.message || "All delivery endpoints failed.");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    dbg("handleSubmit fired: step=" + state.step + " sending=" + state.sending);

    if (state.sending) {
      // A previous send hung (dropped network) — recover instead of ignoring clicks forever
      if (Date.now() - state.sendingAt < 20000) {
        dbg("blocked: previous send still in flight");
        return;
      }
      dbg("recovering hung send");
      state.sending = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.removeAttribute("aria-busy");
      submitBtn.setAttribute("aria-disabled", "false");
    }

    if (state.step !== 5) {
      // Defence: if the contact step is actually on screen, treat this as a submit
      const step5 = $('[data-step="5"]');
      if (step5 && !step5.hidden) {
        state.step = 5;
        dbg("step mismatch — forcing step=5 (panel visible)");
      } else {
        nextBtn.click();
        return;
      }
    }

    if (!validateContact(true)) {
      const bad = $('[aria-invalid="true"]');
      dbg("validation FAILED — invalid: " + (bad ? bad.id || "?" : "?"));
      $('[aria-invalid="true"]')?.focus();
      return;
    }

    dbg("validation OK — POSTing to " + endpoints().map((t) => t.url).join(", "));
    state.sending = true;
    state.sendingAt = Date.now();
    submitBtn.setAttribute("aria-disabled", "true");
    submitBtn.classList.add("is-loading");
    submitBtn.setAttribute("aria-busy", "true");
    clearFormAlert();

    try {
      const payload = buildPayload();
      const result = await sendRequest(payload);

      form.hidden = true;
      confirmation.hidden = false;
      $("#confirmation-spec").textContent = payload.summary;
      $("#confirmation-title").focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
      dbg("CONFIRMATION SHOWN (demo=" + result.demo + ")");
      if (result.demo) console.info("[Website Wizard] Shown confirmation in demo mode.");
    } catch (err) {
      console.error("[Website Wizard] Submission failed:", err);
      dbg("SUBMIT ERROR: " + (err && err.message));
      showFormAlert(
        "Sorry - we could not send your request right now. Please check your connection and try again, or call " +
          CONTACT_PHONE +
          "."
      );
    } finally {
      state.sending = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.removeAttribute("aria-busy");
      submitBtn.setAttribute("aria-disabled", "false");
    }
  }

  function initRestart() {
    $("#restart-btn").addEventListener("click", () => {
      form.reset();
      state.step = 1;
      state.maxStep = 1;
      state.effects = [];
      state.pageCount = null;
      state.pageNames = [];
      state.customPages = [];
      state.customNotes = "";
      state.fxSearch = "";
      state.fxCat = "all";
      state.fxSort = "category";
      notesCount.textContent = "0";
      $("#fx-search").value = "";
      $("#fx-sort").value = "category";
      $$(".fx-cat").forEach((b) => b.classList.toggle("is-active", b.dataset.cat === "all"));
      applyColor(PALETTE[0].hex);
      renderChips();
      renderEffects();
      updateSummary();
      confirmation.hidden = true;
      form.hidden = false;
      goToStep(1);
    });
  }

  /* ---------------- Boot ---------------- */
  function init() {
    initColors();
    applyColor(PALETTE[0].hex);
    initEffects();
    initStructure();
    initSummary();
    initContact();
    initRestart();

    updateSummary();

    nextBtn.addEventListener("click", () => {
      if (state.step >= 5) return;
      if (!validateStep(state.step)) return;
      goToStep(state.step + 1);
    });
    backBtn.addEventListener("click", () => goToStep(state.step - 1));
    form.addEventListener("submit", handleSubmit);
    // Direct click path — guarantees the button always responds even if the
    // browser's implicit form-submission handling differs
    submitBtn.addEventListener("click", (e) => {
      dbg("submit CLICK event received (native disabled=" + submitBtn.disabled + ")");
      e.preventDefault();
      handleSubmit(e);
    });

    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-goto]");
      if (!target || target.disabled) return;
      const n = Number(target.dataset.goto);
      if (n >= 1 && n <= state.maxStep && n !== state.step) goToStep(n);
    });

    if (endpoints().length === 0) demoNote.hidden = false;
    dbg("init complete — all listeners bound. endpoints=" + (endpoints().map((t) => t.url).join(",") || "none"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
