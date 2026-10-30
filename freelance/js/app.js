/* =============================================================
   Website Builder Wizard — app.js
   Gradient color editor · 200+ multi-select effects · page
   structure · live summary · validated contact form · lead
   delivery to the backend (or Formspree/webhook fallback).
   ============================================================= */
(function () {
  "use strict";

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

  // Named palette used to label stop colors with friendly names
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
  let stopIdSeq = 1;
  const state = {
    step: 1,
    maxStep: 1,
    gradient: {
      angle: 135,
      stops: [
        { id: stopIdSeq++, color: "#3B82F6", pos: 0 },
        { id: stopIdSeq++, color: "#8B5CF6", pos: 100 },
      ],
      selectedId: 1,
    },
    effects: [], // array of effect ids (multi-select)
    pageCount: null,
    pageNames: [],
    customPages: [],
    customNotes: "",
    sending: false,
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
    return best.name;
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
     STEP 1 · GRADIENT EDITOR
     ========================================================= */

  const gradBarWrap = $("#grad-bar-wrap");
  const gradBar = $("#grad-bar");
  const gradStopsEl = $("#grad-stops");
  const stopColorInput = $("#stop-color-input");
  const stopHexInput = $("#stop-hex-input");
  const stopPosInput = $("#stop-pos-input");
  const stopIndexLabel = $("#stop-index-label");
  const delStopBtn = $("#del-stop-btn");
  const angleInput = $("#grad-angle");
  const angleVal = $("#grad-angle-val");

  function sortedStops() {
    return [...state.gradient.stops].sort((a, b) => a.pos - b.pos);
  }

  function selectedStop() {
    return state.gradient.stops.find((s) => s.id === state.gradient.selectedId) || state.gradient.stops[0];
  }

  function gradientCss() {
    const stops = sortedStops()
      .map((s) => `${s.color} ${Math.round(s.pos)}%`)
      .join(", ");
    return `linear-gradient(${state.gradient.angle}deg, ${stops})`;
  }

  function gradientNames() {
    const stops = sortedStops();
    const names = stops.map((s) => nearestName(s.color));
    const uniq = names.filter((n, i) => names.indexOf(n) === i);
    return uniq.length <= 1 ? uniq[0] || "" : `${uniq[0]} to ${uniq[uniq.length - 1]}`;
  }

  function renderGradient() {
    const css = gradientCss();

    // Bar + page-wide preview
    gradBar.style.background = css;
    const preview = $("#grad-preview");
    if (preview) preview.style.background = css;
    $("#grad-css").textContent = css;
    $("#grad-names").textContent = gradientNames();

    // Accent follows the first stop so buttons/labels match the palette
    const first = sortedStops()[0];
    const [r, g, b] = hexToRgb(first.color);
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("--accent", first.color);
    rootStyle.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
    rootStyle.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.16)`);
    rootStyle.setProperty("--accent-glow", `rgba(${r}, ${g}, ${b}, 0.35)`);

    // Stop markers
    gradStopsEl.innerHTML = sortedStops()
      .map((s, i) => `
        <button
          type="button"
          class="grad-stop${s.id === state.gradient.selectedId ? " is-selected" : ""}"
          style="left:${s.pos}%; --stop-color:${s.color}"
          data-stop-id="${s.id}"
          role="slider"
          aria-label="Color stop ${i + 1}, ${s.color}, position ${Math.round(s.pos)} percent"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${Math.round(s.pos)}"
          aria-valuetext="${s.color} at ${Math.round(s.pos)} percent"
          tabindex="${s.id === state.gradient.selectedId ? "0" : "-1"}"
        ><span class="grad-stop-dot" aria-hidden="true"></span></button>`)
      .join("");

    // Panel values for the selected stop
    const sel = selectedStop();
    const idx = sortedStops().findIndex((s) => s.id === sel.id) + 1;
    stopIndexLabel.textContent = String(idx);
    stopColorInput.value = sel.color.toLowerCase();
    if (document.activeElement !== stopHexInput) stopHexInput.value = sel.color;
    if (document.activeElement !== stopPosInput) stopPosInput.value = String(Math.round(sel.pos));
    delStopBtn.disabled = state.gradient.stops.length <= 2;
    angleInput.value = String(state.gradient.angle);
    angleVal.textContent = `${state.gradient.angle}\u00B0`;

    updateSummary();
  }

  function selectStop(id) {
    state.gradient.selectedId = id;
    renderGradient();
  }

  function stopAtPos(clientX) {
    const rect = gradBar.getBoundingClientRect();
    return clamp(Math.round(((clientX - rect.left) / rect.width) * 100), 0, 100);
  }

  function addStop(pos, color) {
    const s = { id: stopIdSeq++, color: color || selectedStop().color, pos: clamp(pos, 0, 100) };
    state.gradient.stops.push(s);
    state.gradient.selectedId = s.id;
    renderGradient();
  }

  function deleteStop(id) {
    if (state.gradient.stops.length <= 2) return;
    state.gradient.stops = state.gradient.stops.filter((s) => s.id !== id);
    if (state.gradient.selectedId === id) {
      state.gradient.selectedId = sortedStops()[0].id;
    }
    renderGradient();
  }

  function initGradient() {
    // Click the track to add a stop there
    gradBarWrap.addEventListener("click", (e) => {
      if (e.target.closest(".grad-stop")) return;
      addStop(stopAtPos(e.clientX), selectedStop().color);
    });

    // Markers: select + drag + keyboard
    gradStopsEl.addEventListener("pointerdown", (e) => {
      const marker = e.target.closest(".grad-stop");
      if (!marker) return;
      e.preventDefault();
      const id = Number(marker.dataset.stopId);
      selectStop(id);
      marker.setPointerCapture(e.pointerId);

      const move = (ev) => {
        const s = state.gradient.stops.find((x) => x.id === id);
        if (!s) return;
        s.pos = stopAtPos(ev.clientX);
        renderGradient();
      };
      const up = () => {
        marker.releasePointerCapture?.(e.pointerId);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });

    gradStopsEl.addEventListener("keydown", (e) => {
      const marker = e.target.closest(".grad-stop");
      if (!marker) return;
      const id = Number(marker.dataset.stopId);
      const s = state.gradient.stops.find((x) => x.id === id);
      if (!s) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        s.pos = clamp(s.pos + (e.key === "ArrowRight" ? 1 : -1), 0, 100);
        selectStop(id);
        const again = $(`.grad-stop[data-stop-id="${id}"]`, gradStopsEl);
        again?.focus();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteStop(id);
      }
    });

    // Color picker (native spectrum pop-up) + hex + position + angle
    stopColorInput.addEventListener("input", () => {
      const s = selectedStop();
      s.color = stopColorInput.value.toUpperCase();
      renderGradient();
    });

    stopHexInput.addEventListener("input", () => {
      const hex = normalizeHex(stopHexInput.value);
      if (hex) {
        selectedStop().color = hex;
        renderGradient();
      }
    });
    stopHexInput.addEventListener("blur", () => renderGradient());

    stopPosInput.addEventListener("input", () => {
      const v = clamp(Number(stopPosInput.value) || 0, 0, 100);
      selectedStop().pos = v;
      renderGradient();
    });

    angleInput.addEventListener("input", () => {
      state.gradient.angle = Number(angleInput.value);
      renderGradient();
    });

    delStopBtn.addEventListener("click", () => deleteStop(state.gradient.selectedId));
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
    if (state.fxSort === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } // "category" order is pre-sorted in effects.js
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

    // Rebuild the live stage with every selected effect
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

  // Restart an animation when a card is hovered (fresh preview every time)
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

    // Search / sort / category toolbar
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

    // Multi-select toggling
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

    // Hover / focus plays a live preview
    effectGrid.addEventListener("mouseover", (e) => {
      const card = e.target.closest(".effect-card");
      if (card) playCardPreview(card);
    });
    effectGrid.addEventListener("mouseout", (e) => {
      const card = e.target.closest(".effect-card");
      if (card && !e.relatedTarget?.closest?.(".effect-card")) stopCardPreview(card);
      else if (card && !card.contains(e.relatedTarget)) stopCardPreview(card);
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
    const css = gradientCss();
    const names = gradientNames();
    return names ? `${css} (${names})` : css;
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
    if (recapSwatch) recapSwatch.style.background = gradientCss();
    $("#recap-color").textContent = gradientNames();
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
      "Step 1: Build your color gradient",
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

    submitBtn.disabled = !ok || state.sending;
    return ok;
  }

  function initContact() {
    ["full-name", "purpose", "phone", "email"].forEach((id) => {
      const el = $("#" + id);
      el.addEventListener("blur", () => validateContact(true));
      el.addEventListener("input", () => {
        if (el.getAttribute("aria-invalid") === "true") validateContact(true);
        else submitBtn.disabled = false;
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
      targets.map((t) =>
        fetch(t.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          if (!res.ok) {
            const body = await res.text().catch(() => "");
            const err = new Error(`${t.kind} ${res.status}: ${body.slice(0, 200)}`);
            err.http = true;
            throw err;
          }
          return res;
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

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
    if (state.sending) return;

    if (state.step !== 5) {
      nextBtn.click();
      return;
    }

    if (!validateContact(true)) {
      $('[aria-invalid="true"]')?.focus();
      return;
    }

    state.sending = true;
    submitBtn.disabled = true;
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
      if (result.demo) console.info("[Website Wizard] Shown confirmation in demo mode.");
    } catch (err) {
      console.error("[Website Wizard] Submission failed:", err);
      showFormAlert(
        "Sorry - we could not send your request right now. Please check your connection and try again, or call " +
          CONTACT_PHONE +
          "."
      );
    } finally {
      state.sending = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.removeAttribute("aria-busy");
      submitBtn.disabled = false;
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
      state.gradient = {
        angle: 135,
        stops: [
          { id: stopIdSeq++, color: "#3B82F6", pos: 0 },
          { id: stopIdSeq++, color: "#8B5CF6", pos: 100 },
        ],
        selectedId: null,
      };
      state.gradient.selectedId = state.gradient.stops[0].id;
      renderGradient();
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
    initGradient();
    renderGradient();
    initEffects();
    initStructure();
    initSummary();
    initContact();
    initRestart();

    updateSummary();

    nextBtn.addEventListener("click", () => {
      if (!validateStep(state.step)) return;
      goToStep(state.step + 1);
    });
    backBtn.addEventListener("click", () => goToStep(state.step - 1));
    form.addEventListener("submit", handleSubmit);

    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-goto]");
      if (!target || target.disabled) return;
      const n = Number(target.dataset.goto);
      if (n >= 1 && n <= state.maxStep && n !== state.step) goToStep(n);
    });

    if (endpoints().length === 0) demoNote.hidden = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
