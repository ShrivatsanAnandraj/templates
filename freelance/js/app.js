/* =============================================================
   Website Builder Wizard — app.js
   Vanilla JS · no dependencies · step flow, live summary,
   validation and lead delivery (Formspree / webhook / demo).
   ============================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     CONFIG — plug in your notification endpoint here.
     • Formspree:  https://formspree.io/f/YOUR_FORM_ID
       (free tier at formspree.io — creates a form that emails you)
     • Webhook:    any URL that accepts a JSON POST
       (Zapier, Make, n8n, Slack incoming webhook proxy, your API…)
     Leave both empty to run in DEMO mode (console + localStorage).
     --------------------------------------------------------- */
  const CONFIG = {
    formspreeEndpoint: "https://formspree.io/f/YOUR_FORM_ID",
    webhookUrl: "",
    emailSubjectPrefix: "[Website Wizard]",
  };

  /* ---------------- Data ---------------- */

  const COLORS = [
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
  ];

  const EFFECTS = [
    {
      key: "fade-in",
      label: "Fade In",
      dotClass: "dot-fade-in",
      animClass: "anim-fade-in",
      desc: "Content gently appears from transparent to visible. Soft and distraction-free.",
      tip: "Best for: page-load intros, text blocks and anywhere you want a calm, professional entrance.",
    },
    {
      key: "slide-up",
      label: "Slide Up",
      dotClass: "dot-slide-up",
      animClass: "anim-slide-up",
      desc: "Elements rise into place from below while fading in — a classic modern reveal.",
      tip: "Best for: hero sections, feature cards and scroll-triggered content reveals.",
    },
    {
      key: "pulse",
      label: "Pulse",
      dotClass: "dot-pulse",
      animClass: "anim-pulse",
      desc: "A rhythmic breathing scale that continuously draws the eye.",
      tip: "Best for: primary CTAs, sale badges, live indicators and ‘new’ labels.",
    },
    {
      key: "zoom",
      label: "Zoom",
      dotClass: "dot-zoom",
      animClass: "anim-zoom",
      desc: "Starts small and scales up into focus with a soft fade.",
      tip: "Best for: modals, popups, image galleries and product highlights.",
    },
    {
      key: "bounce",
      label: "Bounce",
      dotClass: "dot-bounce",
      animClass: "anim-bounce",
      desc: "A playful, springy hop that feels energetic and fun.",
      tip: "Best for: kids’ brands, gamified UI, notifications and celebratory moments.",
    },
    {
      key: "hover-lift",
      label: "Hover Lift",
      dotClass: "dot-hover-lift",
      animClass: "anim-hover-lift",
      desc: "Not an entrance — the element floats up with a shadow when hovered.",
      tip: "Best for: cards, buttons and nav items to signal they are interactive.",
    },
  ];

  const DEFAULT_PAGES = [
    "Home",
    "About Us",
    "Services",
    "Portfolio",
    "Contact",
    "FAQ",
    "Blog",
    "Gallery",
    "Testimonials",
    "Shop",
  ];

  /* ---------------- State ---------------- */

  const state = {
    step: 1,
    maxStep: 1,
    color: COLORS[0], // pre-selected for a delightful first paint
    effect: null,
    pageCount: null,
    pageNames: [], // e.g. ["Home", "About Us"]
    customPages: [], // user-added names kept so chips persist
    customNotes: "",
    sending: false,
  };

  /* ---------------- Helpers ---------------- */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const hexToRgb = (hex) => {
    const h = hex.replace("#", "");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

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
  const effectGrid = $("#effect-grid");
  const chipCloud = $("#chip-cloud");
  const chipInput = $("#custom-page-input");
  const addPageBtn = $("#add-page-btn");
  const notesArea = $("#custom-notes");
  const notesCount = $("#notes-count");
  const chipCount = $("#chip-count");
  const pageNamesHint = $("#page-names-hint");
  const summaryOutput = $("#summary-output");
  const attachPreview = $("#attach-preview-body");
  const livePreviewCard = $("#live-preview-card");
  const confirmation = $("#confirmation");
  const demoNote = $("#demo-note");

  /* ---------------- Step 1 · Colors ---------------- */

  function renderColors() {
    colorGrid.innerHTML = COLORS.map((c, i) => {
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
          <span class="check-badge" aria-hidden="true">&#10003;</span>
        </button>`;
    }).join("");

    colorGrid.addEventListener("click", (e) => {
      const swatch = e.target.closest(".color-swatch");
      if (!swatch) return;
      selectColor(swatch.dataset.hex);
    });

    // Arrow-key navigation inside the radiogroup (WAI-ARIA pattern)
    colorGrid.addEventListener("keydown", (e) => {
      if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      const swatches = $$(".color-swatch", colorGrid);
      const idx = swatches.indexOf(document.activeElement);
      const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      const next = swatches[(idx + dir + swatches.length) % swatches.length];
      next.focus();
      selectColor(next.dataset.hex);
    });
  }

  function selectColor(hex) {
    const color = COLORS.find((c) => c.hex === hex);
    if (!color) return;
    state.color = color;

    $$(".color-swatch", colorGrid).forEach((s) =>
      s.setAttribute("aria-checked", String(s.dataset.hex === hex))
    );

    const [r, g, b] = hexToRgb(hex);
    const root = document.documentElement.style;
    root.setProperty("--accent", hex);
    root.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
    root.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.16)`);
    root.setProperty("--accent-glow", `rgba(${r}, ${g}, ${b}, 0.35)`);

    $("#preview-name").textContent = color.name;
    $("#preview-hex").textContent = hex;
    $("#preview-rgb").textContent = `rgb(${r}, ${g}, ${b})`;

    updateSummary();
  }

  /* ---------------- Step 2 · Effects ---------------- */

  function renderEffects() {
    effectGrid.innerHTML = EFFECTS.map(
      (fx) => `
      <label class="effect-card">
        <input type="radio" name="effect" value="${fx.key}" />
        <span class="effect-card-top">
          <span class="effect-card-title">${esc(fx.label)}</span>
          <span class="effect-selected-tag">Selected</span>
        </span>
        <span class="effect-demo" aria-hidden="true">
          <span class="effect-demo-dot ${fx.dotClass}"></span>
        </span>
        <span class="effect-card-desc">${esc(fx.desc)}</span>
        <span class="effect-card-tip">${esc(fx.tip)}</span>
      </label>`
    ).join("");

    effectGrid.addEventListener("change", (e) => {
      if (e.target.name !== "effect") return;
      selectEffect(e.target.value, true);
    });

    // Hovering (or keyboard-focusing) a card plays a live preview
    const previewOnHover = (e) => {
      const card = e.target.closest(".effect-card");
      if (!card) return;
      const input = $("input", card);
      playPreview(input.value);
    };
    effectGrid.addEventListener("mouseover", previewOnHover);
    effectGrid.addEventListener("focusin", previewOnHover);

    // When the pointer leaves the grid, restore the selected effect
    effectGrid.addEventListener("mouseleave", () => {
      if (state.effect) playPreview(state.effect.key);
    });
  }

  function playPreview(effectKey) {
    const fx = EFFECTS.find((f) => f.key === effectKey);
    if (!fx) return;
    EFFECTS.forEach((f) => livePreviewCard.classList.remove(f.animClass));
    // Force reflow so the animation restarts every time
    void livePreviewCard.offsetWidth;
    livePreviewCard.classList.add(fx.animClass);
  }

  function selectEffect(effectKey, fromUser) {
    const fx = EFFECTS.find((f) => f.key === effectKey);
    if (!fx) return;
    state.effect = fx;
    const input = $(`input[value="${effectKey}"]`, effectGrid);
    if (input) input.checked = true;
    playPreview(effectKey);
    if (fromUser) updateSummary();
  }

  /* ---------------- Step 3 · Structure ---------------- */

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
            ? `<button type="button" class="chip-x" data-remove="${esc(
                name
              )}" aria-label="Remove custom page ${esc(name)}">&times;</button>`
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
    const rec = { "1-page": "1 name", "3-5 pages": "3–5 names", "5+ pages": "5+ names" }[state.pageCount];
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
      // Already available — just make sure it is selected
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
    // Check the freshly added chip
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

    // Remove buttons for custom chips (preventDefault stops the label toggle)
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

    addPageBtn.addEventListener("click", () => addCustomPage(chipInput.value));
    chipInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addCustomPage(chipInput.value);
      }
    });

    // Page-count radios
    $$('input[name="pageCount"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        state.pageCount = radio.value;

        // Convenience: a 1-page site is usually one "Landing Page"
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

  /* ---------------- Step 4 · Summary ---------------- */

  function buildSpecLine() {
    const pages = state.pageCount || "pages TBC";
    const names = state.pageNames.length ? state.pageNames.join(", ") : "no pages named yet";
    const notes = state.customNotes.trim() || "None";
    return `${pages} (${names}). Notes: ${notes}`;
  }

  function buildSummary() {
    const color = state.color
      ? `${state.color.hex} (${state.color.name})`
      : "not selected yet";
    const effect = state.effect ? state.effect.label : "not selected yet";
    return [
      `colour:${color}`,
      `effect:${effect}`,
      `specifications:${buildSpecLine()}`,
    ].join("\n");
  }

  function updateSummary() {
    const text = buildSummary();
    summaryOutput.textContent = text;
    attachPreview.textContent = text;

    $("#recap-color").textContent = state.color
      ? `${state.color.name} · ${state.color.hex}`
      : "—";
    $("#recap-effect").textContent = state.effect ? state.effect.label : "—";
    $("#recap-specs").textContent = state.pageCount
      ? `${state.pageCount} · ${state.pageNames.length} page name${
          state.pageNames.length === 1 ? "" : "s"
        }`
      : "—";
  }

  function initSummary() {
    $("#copy-summary-btn").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const text = buildSummary();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback for non-secure contexts
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

  /* ---------------- Step navigation ---------------- */

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

    if (n === 4) updateSummary();
    if (n === 5) {
      updateSummary();
      validateContact(false); // refresh submit button state without shouting errors
    }

    const titles = [
      "",
      "Step 1: Pick your brand color",
      "Step 2: Choose an animation effect",
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

  /* ---------------- Validation ---------------- */

  function showFormAlert(message) {
    clearFormAlert();
    const p = document.createElement("p");
    p.className = "form-alert";
    p.setAttribute("role", "alert");
    p.textContent = message;
    $("#wizard-nav").insertAdjacentElement("afterend", p);
  }

  function clearFormAlert() {
    const existing = $(".form-alert");
    if (existing) existing.remove();
  }

  function validateStep(n) {
    clearFormAlert();
    if (n === 2 && !state.effect) {
      showFormAlert("Please select an animation effect to continue.");
      const first = $("input", effectGrid);
      if (first) first.focus();
      return false;
    }
    if (n === 3) {
      if (!state.pageCount) {
        showFormAlert("Please choose how many pages your website needs.");
        const first = $('input[name="pageCount"]');
        if (first) first.focus();
        return false;
      }
      if (state.pageNames.length === 0) {
        showFormAlert("Please select or add at least one page name.");
        const first = $("input", chipCloud);
        if (first) first.focus();
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

    // Full name
    let msg = "";
    if (!name.value.trim()) msg = showErrors ? "Please enter your full name." : "";
    else if (name.value.trim().length < 2) msg = showErrors ? "Name looks too short." : "";
    setFieldError(name, $("#full-name-error"), msg);
    if (msg) ok = false;

    // Purpose
    msg = "";
    if (!purpose.value.trim()) msg = showErrors ? "Tell us briefly why you need the website." : "";
    setFieldError(purpose, $("#purpose-error"), msg);
    if (msg) ok = false;

    // Phone — 7–15 digits, +, spaces, dashes, brackets allowed
    msg = "";
    const digits = phone.value.replace(/\D/g, "");
    if (!phone.value.trim()) msg = showErrors ? "Please enter a phone number." : "";
    else if (!PHONE_RE.test(phone.value.trim()) || digits.length < 7 || digits.length > 15)
      msg = showErrors
        ? "Enter a valid phone number (7–15 digits; +, spaces, dashes and brackets are OK)."
        : "";
    setFieldError(phone, $("#phone-error"), msg);
    if (msg) ok = false;

    // Email
    msg = "";
    if (!email.value.trim()) msg = showErrors ? "Please enter your email address." : "";
    else if (!EMAIL_RE.test(email.value.trim())) msg = showErrors ? "That email doesn’t look valid." : "";
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
        else submitBtn.disabled = false; // keep it enabled while typing cleanly
      });
    });
  }

  /* ---------------- Submission ---------------- */

  function buildPayload() {
    return {
      _subject: `${CONFIG.emailSubjectPrefix} New website request${
        state.color ? " · " + state.color.name : ""
      }`,
      fullName: $("#full-name").value.trim(),
      purpose: $("#purpose").value.trim(),
      phone: $("#phone").value.trim(),
      email: $("#email").value.trim(),
      summary: buildSummary(),
      colour: state.color ? `${state.color.hex} (${state.color.name})` : "",
      effect: state.effect ? state.effect.label : "",
      specifications: buildSpecLine(),
      submittedAt: new Date().toISOString(),
    };
  }

  function endpoints() {
    const list = [];
    if (
      CONFIG.formspreeEndpoint &&
      !CONFIG.formspreeEndpoint.includes("YOUR_FORM_ID")
    ) {
      list.push({ url: CONFIG.formspreeEndpoint, kind: "formspree" });
    }
    if (CONFIG.webhookUrl) list.push({ url: CONFIG.webhookUrl, kind: "webhook" });
    return list;
  }

  async function sendRequest(payload) {
    const targets = endpoints();

    // Demo mode — nothing configured yet
    if (targets.length === 0) {
      console.info(
        "%c[Website Wizard] DEMO MODE — no endpoint configured. Payload:",
        "color:#f59e0b;font-weight:bold",
        payload
      );
      try {
        const archive = JSON.parse(localStorage.getItem("wizardLeads") || "[]");
        archive.push(payload);
        localStorage.setItem("wizardLeads", JSON.stringify(archive));
      } catch {
        /* storage unavailable — ignore */
      }
      return { demo: true };
    }

    const results = await Promise.allSettled(
      targets.map((t) =>
        fetch(t.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`${t.kind} ${res.status}: ${body.slice(0, 200)}`);
          }
          return res;
        })
      )
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length === results.length) {
      throw new Error(failed[0].reason?.message || "All delivery endpoints failed.");
    }
    if (failed.length) {
      console.warn("[Website Wizard] Some endpoints failed:", failed);
    }
    return { demo: false };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (state.sending) return;

    if (state.step !== 5) {
      // Enter key pressed on an earlier step — behave like "Next"
      nextBtn.click();
      return;
    }

    if (!validateContact(true)) {
      const invalid = $('[aria-invalid="true"]');
      if (invalid) invalid.focus();
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

      // Confirmation screen
      form.hidden = true;
      confirmation.hidden = false;
      $("#confirmation-spec").textContent = payload.summary;
      $("#confirmation-sub").textContent = result.demo
        ? "Demo mode is on — your request was captured locally (see the console) but not emailed yet."
        : "A copy of your specification has been sent to our team.";
      $("#confirmation-title").focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("[Website Wizard] Submission failed:", err);
      showFormAlert(
        "Sorry — we couldn’t send your request right now. Please check your connection and try again, or email us directly."
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
      state.effect = null;
      state.pageCount = null;
      state.pageNames = [];
      state.customPages = [];
      state.customNotes = "";
      notesCount.textContent = "0";
      EFFECTS.forEach((f) => livePreviewCard.classList.remove(f.animClass));
      renderChips();
      selectColor(COLORS[0].hex);
      updateSummary();
      confirmation.hidden = true;
      form.hidden = false;
      goToStep(1);
    });
  }

  /* ---------------- Boot ---------------- */

  function init() {
    $("#year").textContent = String(new Date().getFullYear());

    renderColors();
    renderEffects();
    initStructure();
    initSummary();
    initContact();
    initRestart();

    selectColor(COLORS[0].hex);
    updateSummary();

    nextBtn.addEventListener("click", () => {
      if (!validateStep(state.step)) return;
      goToStep(state.step + 1);
    });

    backBtn.addEventListener("click", () => goToStep(state.step - 1));

    form.addEventListener("submit", handleSubmit);

    // Progress dots + summary "edit" links
    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-goto]");
      if (!target || target.disabled) return;
      const n = Number(target.dataset.goto);
      if (n >= 1 && n <= state.maxStep && n !== state.step) goToStep(n);
    });

    // Show the demo-mode hint on the contact step
    if (endpoints().length === 0) demoNote.hidden = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
