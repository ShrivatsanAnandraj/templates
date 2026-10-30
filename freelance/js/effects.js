/* =============================================================
   effects.js — 200+ CSS effects catalog
   Sorted (by category, then name), each with a mini preview
   using text, shapes, pills, cards, gradients and more.
   Exposes: window.WIZARD_EFFECTS = [{id, name, cat, type, preview}]
   Injects all keyframes/rules into a <style id="effects-css"> tag.
   ============================================================= */
(function (global) {
  "use strict";

  var entries = [];

  function slug(name) {
    return "fx-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  // Preview kinds cycle per category so cards mix text, shapes and UI bits
  var PREVIEWS = {
    entrance: ["shape-circle", "text", "shape-square", "pill", "shape-triangle", "heading", "shape-blob", "card"],
    attention: ["shape-circle", "pill", "text", "shape-square"],
    loop: ["shape-blob", "shape-circle", "text", "pill"],
    hover: ["card", "text", "pill", "shape-square", "heading"],
    text: ["text", "heading", "text-underline", "text-gradient"],
    background: ["bg", "bg-stripes", "bg-radial"],
    shape: ["shape-circle", "shape-square", "shape-triangle", "shape-blob", "shape-ring"],
    ui: ["card", "pill", "progress", "badge"],
    threed: ["card", "shape-square", "pill", "heading"],
  };
  var previewIdx = {};
  function nextPreview(cat) {
    var list = PREVIEWS[cat] || PREVIEWS.entrance;
    previewIdx[cat] = ((previewIdx[cat] || 0) + 1) % list.length;
    return list[previewIdx[cat]];
  }

  // One-shot / looping animation
  function addAnim(name, cat, frames, dur, ease, iter, origin) {
    var s = slug(name);
    var k = s.replace("fx-", "k-");
    var css =
      "@keyframes " + k + "{" + frames + "}" +
      "." + s + ".is-playing{animation:" + k + " " + dur + " " + ease + " " + (iter || "1") + " both" +
      (origin ? ";transform-origin:" + origin : "") + "}";
    entries.push({ id: s, name: name, cat: cat, type: "anim", preview: nextPreview(cat), css: css });
  }

  // Hover-triggered style (also plays via .is-playing for touch/selection)
  function addHover(name, cat, base, active, pseudo, preview) {
    var s = slug(name);
    var css =
      "." + s + "{" + base + "}" +
      (pseudo || "") +
      "." + s + ":hover,." + s + ".is-playing{" + active + "}";
    entries.push({ id: s, name: name, cat: cat, type: "hover", preview: preview || nextPreview(cat), css: css });
  }

  /* ---------------- ENTRANCE ---------------- */
  var EASE = "cubic-bezier(.22,1,.36,1)";
  var fadeDirs = {
    Up: "translateY(48px)", Down: "translateY(-48px)", Left: "translateX(48px)", Right: "translateX(-48px)",
    "Up Left": "translate(36px,36px)", "Up Right": "translate(-36px,36px)",
    "Down Left": "translate(36px,-36px)", "Down Right": "translate(-36px,-36px)",
  };
  addAnim("Fade In", "entrance", "from{opacity:0}to{opacity:1}", "1.1s", EASE);
  Object.keys(fadeDirs).forEach(function (d) {
    addAnim("Fade In " + d, "entrance", "from{opacity:0;transform:" + fadeDirs[d] + "}to{opacity:1;transform:none}", "1.1s", EASE);
  });

  var slideDirs = { Up: "translateY(56px)", Down: "translateY(-56px)", Left: "translateX(56px)", Right: "translateX(-56px)" };
  addAnim("Slide In", "entrance", "from{opacity:0;transform:translateY(56px)}to{opacity:1;transform:none}", "0.7s", EASE);
  Object.keys(slideDirs).forEach(function (d) {
    addAnim("Slide In " + d, "entrance", "from{opacity:0;transform:" + slideDirs[d] + "}to{opacity:1;transform:none}", "0.7s", EASE);
  });

  var zoomDirs = { Up: "translateY(40px)", Down: "translateY(-40px)", Left: "translateX(40px)", Right: "translateX(-40px)" };
  addAnim("Zoom In", "entrance", "from{opacity:0;transform:scale(.35)}to{opacity:1;transform:none}", "0.9s", EASE);
  Object.keys(zoomDirs).forEach(function (d) {
    addAnim("Zoom In " + d, "entrance", "from{opacity:0;transform:scale(.35) " + zoomDirs[d] + "}to{opacity:1;transform:none}", "0.9s", EASE);
  });

  var bounceDirs = { Up: "translateY(64px)", Down: "translateY(-64px)", Left: "translateX(64px)", Right: "translateX(-64px)" };
  function bounceFrames(t) {
    return "0%{opacity:0;transform:scale(.3) " + t + "}55%{opacity:1;transform:scale(1.08) translate(0,0)}70%{transform:scale(.95)}100%{opacity:1;transform:scale(1)}";
  }
  addAnim("Bounce In", "entrance", bounceFrames("translateY(0)"), "1.1s", "ease-out");
  Object.keys(bounceDirs).forEach(function (d) {
    addAnim("Bounce In " + d, "entrance", bounceFrames(bounceDirs[d]), "1.1s", "ease-out");
  });

  var swingDirs = { Up: "translateY(72px)", Down: "translateY(-72px)", Left: "translateX(72px)", Right: "translateX(-72px)" };
  addAnim("Swing In", "entrance", "from{opacity:0;transform:rotate(-92deg)}60%{opacity:1;transform:rotate(12deg)}80%{transform:rotate(-6deg)}to{transform:rotate(0)}", "1.2s", "ease-out", "1", "top center");
  Object.keys(swingDirs).forEach(function (d) {
    addAnim("Swing In " + d, "entrance",
      "from{opacity:0;transform:rotate(-60deg) " + swingDirs[d] + "}60%{opacity:1;transform:rotate(8deg) translate(0,0)}80%{transform:rotate(-4deg)}to{transform:rotate(0)}",
      "1.2s", "ease-out", "1", "top center");
  });

  addAnim("Flip In X", "entrance", "from{opacity:0;transform:perspective(700px) rotateX(90deg)}40%{opacity:1;transform:perspective(700px) rotateX(-18deg)}70%{transform:perspective(700px) rotateX(8deg)}to{opacity:1;transform:perspective(700px) rotateX(0)}", "1.1s", EASE);
  addAnim("Flip In Y", "entrance", "from{opacity:0;transform:perspective(700px) rotateY(90deg)}40%{opacity:1;transform:perspective(700px) rotateY(-18deg)}70%{transform:perspective(700px) rotateY(8deg)}to{opacity:1;transform:perspective(700px) rotateY(0)}", "1.1s", EASE);

  addAnim("Rotate In", "entrance", "from{opacity:0;transform:rotate(-200deg) scale(.2)}to{opacity:1;transform:none}", "1.1s", EASE);
  var rotCorners = { "Rotate In Up Left": "bottom right", "Rotate In Up Right": "bottom left", "Rotate In Down Left": "top right", "Rotate In Down Right": "top left" };
  Object.keys(rotCorners).forEach(function (n) {
    addAnim(n, "entrance", "from{opacity:0;transform:rotate(-160deg) scale(.2)}to{opacity:1;transform:none}", "1.1s", EASE, "1", rotCorners[n]);
  });

  var blurDirs = { Up: "translateY(40px)", Down: "translateY(-40px)", Left: "translateX(40px)", Right: "translateX(-40px)",
    "Up Left": "translate(28px,28px)", "Up Right": "translate(-28px,28px)", "Down Left": "translate(28px,-28px)", "Down Right": "translate(-28px,-28px)" };
  addAnim("Blur In", "entrance", "from{opacity:0;filter:blur(14px);transform:scale(1.05)}to{opacity:1;filter:blur(0);transform:none}", "1.1s", EASE);
  Object.keys(blurDirs).forEach(function (d) {
    addAnim("Blur In " + d, "entrance", "from{opacity:0;filter:blur(14px);transform:scale(1.05) " + blurDirs[d] + "}to{opacity:1;filter:blur(0);transform:none}", "1.1s", EASE);
  });

  addAnim("Sweep In Down", "entrance", "from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}", "0.9s", EASE);
  addAnim("Sweep In Up", "entrance", "from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}", "0.9s", EASE);
  addAnim("Sweep In Right", "entrance", "from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}", "0.9s", EASE);
  addAnim("Sweep In Left", "entrance", "from{clip-path:inset(0 0 0 100%)}to{clip-path:inset(0 0 0 0)}", "0.9s", EASE);

  addAnim("Expand In", "entrance", "from{opacity:0;transform:scale(0)}to{opacity:1;transform:none}", "0.9s", EASE, "1", "center");
  addAnim("Expand In Up", "entrance", "from{opacity:0;transform:scale(0)}to{opacity:1;transform:none}", "0.9s", EASE, "1", "bottom center");
  addAnim("Expand In Down", "entrance", "from{opacity:0;transform:scale(0)}to{opacity:1;transform:none}", "0.9s", EASE, "1", "top center");
  addAnim("Expand In Left", "entrance", "from{opacity:0;transform:scale(0)}to{opacity:1;transform:none}", "0.9s", EASE, "1", "right center");
  addAnim("Expand In Right", "entrance", "from{opacity:0;transform:scale(0)}to{opacity:1;transform:none}", "0.9s", EASE, "1", "left center");

  var pullDirs = { Up: "translateY(70px)", Down: "translateY(-70px)", Left: "translateX(70px)", Right: "translateX(-70px)" };
  Object.keys(pullDirs).forEach(function (d) {
    addAnim("Pull In " + d, "entrance", "from{opacity:0;transform:" + pullDirs[d] + " scale(1.25)}60%{opacity:1;transform:translate(0,0) scale(.97)}to{opacity:1;transform:none}", "0.8s", EASE);
  });

  var dropDirs = { Up: "translateY(-70px)", Down: "translateY(70px)", Left: "translateX(-70px)", Right: "translateX(70px)" };
  Object.keys(dropDirs).forEach(function (d) {
    addAnim("Drop In " + d, "entrance", "from{opacity:0;transform:" + dropDirs[d] + " rotate(8deg)}65%{opacity:1;transform:translate(0,0) rotate(-3deg)}to{opacity:1;transform:none}", "0.85s", "ease-out");
  });

  addAnim("Roll In Left", "entrance", "from{opacity:0;transform:translateX(-110%) skewX(-16deg)}to{opacity:1;transform:none}", "0.9s", EASE);
  addAnim("Roll In Right", "entrance", "from{opacity:0;transform:translateX(110%) skewX(16deg)}to{opacity:1;transform:none}", "0.9s", EASE);
  addAnim("Roll In Up", "entrance", "from{opacity:0;transform:translateY(110%) skewY(-8deg)}to{opacity:1;transform:none}", "0.9s", EASE);
  addAnim("Roll In Down", "entrance", "from{opacity:0;transform:translateY(-110%) skewY(8deg)}to{opacity:1;transform:none}", "0.9s", EASE);

  addAnim("Light Speed In", "entrance", "from{opacity:0;transform:translateX(120%) skewX(-24deg)}60%{opacity:1;transform:translateX(-8%) skewX(6deg)}80%{transform:translateX(4%) skewX(-2deg)}to{opacity:1;transform:none}", "1s", "ease-out");
  addAnim("Pop In", "entrance", "from{opacity:0;transform:scale(.4)}62%{opacity:1;transform:scale(1.12)}to{opacity:1;transform:scale(1)}", "0.8s", "cubic-bezier(.34,1.56,.64,1)");
  addAnim("Rise In", "entrance", "from{opacity:0;transform:translateY(36px);filter:blur(6px)}to{opacity:1;transform:none;filter:blur(0)}", "1s", EASE);
  addAnim("Drift In", "entrance", "from{opacity:0;transform:translateX(-48px);filter:blur(6px)}to{opacity:1;transform:none;filter:blur(0)}", "1.2s", EASE);
  addAnim("Slip In", "entrance", "from{opacity:0;transform:translateY(-36px)}to{opacity:1;transform:none}", "0.5s", EASE);
  addAnim("Zoom Blur In", "entrance", "from{opacity:0;filter:blur(18px);transform:scale(1.4)}to{opacity:1;filter:blur(0);transform:none}", "1s", EASE);
  addAnim("Flash In", "entrance", "from{opacity:0;background-color:currentColor}30%{opacity:1}55%{opacity:.2}to{opacity:1;background-color:transparent}", "1s", "ease-out");

  var cornerOrigins = { "Corner In Top Left": "top left", "Corner In Top Right": "top right", "Corner In Bottom Left": "bottom left", "Corner In Bottom Right": "bottom right" };
  Object.keys(cornerOrigins).forEach(function (n) {
    addAnim(n, "entrance", "from{opacity:0;transform:scale(.2) rotate(-24deg)}to{opacity:1;transform:none}", "0.9s", EASE, "1", cornerOrigins[n]);
  });

  addAnim("Diagonal Slide In Up Left", "entrance", "from{opacity:0;transform:translate(64px,64px)}to{opacity:1;transform:none}", "0.8s", EASE);
  addAnim("Diagonal Slide In Up Right", "entrance", "from{opacity:0;transform:translate(-64px,64px)}to{opacity:1;transform:none}", "0.8s", EASE);
  addAnim("Diagonal Slide In Down Left", "entrance", "from{opacity:0;transform:translate(64px,-64px)}to{opacity:1;transform:none}", "0.8s", EASE);
  addAnim("Diagonal Slide In Down Right", "entrance", "from{opacity:0;transform:translate(-64px,-64px)}to{opacity:1;transform:none}", "0.8s", EASE);

  /* ---------------- ATTENTION ---------------- */
  addAnim("Shake", "attention", "0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}", "0.7s", "ease-in-out");
  addAnim("Shake Slow", "attention", "0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}", "1.4s", "ease-in-out");
  addAnim("Shake X", "attention", "0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-9px)}40%,80%{transform:translateX(9px)}", "0.7s", "ease-in-out");
  addAnim("Shake Y", "attention", "0%,100%{transform:translateY(0)}20%,60%{transform:translateY(-9px)}40%,80%{transform:translateY(9px)}", "0.7s", "ease-in-out");
  addAnim("Head Shake", "attention", "0%,100%{transform:translateX(0)}6%{transform:translateX(-9px) rotate(-4deg)}18%{transform:translateX(7px) rotate(3deg)}32%{transform:translateX(-5px) rotate(-2deg)}46%{transform:translateX(4px) rotate(1deg)}60%{transform:translateX(-2px)}", "0.9s", "ease-in-out");
  addAnim("Wobble", "attention", "0%,100%{transform:translateX(0) rotate(0)}15%{transform:translateX(-14px) rotate(-6deg)}30%{transform:translateX(10px) rotate(4deg)}45%{transform:translateX(-7px) rotate(-3deg)}60%{transform:translateX(5px) rotate(2deg)}75%{transform:translateX(-3px) rotate(-1deg)}", "1.2s", "ease-in-out", "1", "top center");
  addAnim("Jello", "attention", "0%,100%{transform:scale3d(1,1,1)}25%{transform:scale3d(.9,1.1,1)}50%{transform:scale3d(1.1,.9,1)}75%{transform:scale3d(.97,1.03,1)}", "1.1s", "ease-in-out");
  addAnim("Rubber Band", "attention", "0%,100%{transform:scale(1)}30%{transform:scaleX(1.25) scaleY(.75)}40%{transform:scaleX(.75) scaleY(1.25)}50%{transform:scaleX(1.15) scaleY(.85)}65%{transform:scaleX(.95) scaleY(1.05)}", "1.1s", "ease-in-out");
  addAnim("Swing", "attention", "20%{transform:rotate(14deg)}40%{transform:rotate(-10deg)}60%{transform:rotate(6deg)}80%{transform:rotate(-4deg)}100%{transform:rotate(0)}", "1.4s", "ease-in-out", "1", "top center");
  addAnim("Heartbeat", "attention", "0%,100%{transform:scale(1)}14%{transform:scale(1.18)}28%{transform:scale(1)}42%{transform:scale(1.14)}56%{transform:scale(1)}", "1.3s", "ease-in-out");
  addAnim("Flash", "attention", "0%,100%{opacity:1}25%,75%{opacity:.15}50%{opacity:.6}}".replace("}}", "}"), "1.1s", "steps(1,end)");
  addAnim("Pulse", "attention", "0%,100%{transform:scale(1)}50%{transform:scale(1.09)}", "1.3s", "ease-in-out");
  addAnim("Glow Pulse", "attention", "0%,100%{filter:drop-shadow(0 0 2px rgba(255,255,255,.2));transform:scale(1)}50%{filter:drop-shadow(0 0 18px rgba(255,255,255,.85));transform:scale(1.05)}", "1.4s", "ease-in-out");
  addAnim("Neon Flicker", "attention", "0%,19%,21%,23%,25%,54%,56%,100%{opacity:1;filter:brightness(1)}20%,24%,55%{opacity:.35;filter:brightness(.4)}}".replace("}}", "}"), "2.2s", "steps(1,end)");
  addAnim("Tada", "attention", "0%,100%{transform:scale(1)}10%{transform:scale(.9) rotate(-3deg)}20%{transform:scale(.9) rotate(3deg)}30%{transform:scale(1) rotate(-2deg)}40%{transform:scale(1) rotate(2deg)}50%{transform:scale(1)}", "1.4s", "ease-in-out");
  addAnim("Pop", "attention", "0%,100%{transform:scale(1)}50%{transform:scale(1.18)}", "0.55s", "cubic-bezier(.34,1.56,.64,1)");
  addAnim("Squish", "attention", "0%,100%{transform:scale(1,1)}30%{transform:scale(1.25,.75)}50%{transform:scale(.8,1.2)}70%{transform:scale(1.08,.94)}", "1s", "ease-in-out");
  addAnim("Nudge", "attention", "0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}", "0.6s", "ease-in-out");
  addAnim("Alarm", "attention", "0%,100%{transform:rotate(0)}10%{transform:rotate(-14deg)}20%{transform:rotate(12deg)}30%{transform:rotate(-9deg)}40%{transform:rotate(7deg)}50%{transform:rotate(-4deg)}60%{transform:rotate(0)}", "1.6s", "ease-in-out", "1", "bottom center");

  /* ---------------- LOOP ---------------- */
  addAnim("Spin", "loop", "to{transform:rotate(360deg)}", "1.6s", "linear", "infinite");
  addAnim("Spin Reverse", "loop", "to{transform:rotate(-360deg)}", "1.6s", "linear", "infinite");
  addAnim("Slow Spin", "loop", "to{transform:rotate(360deg)}", "6s", "linear", "infinite");
  addAnim("Float", "loop", "0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}", "3s", "ease-in-out", "infinite");
  addAnim("Bob", "loop", "0%,100%{transform:translateY(0)}50%{transform:translateY(9px)}", "1.6s", "ease-in-out", "infinite");
  addAnim("Orbit", "loop", "0%{transform:rotate(0) translateX(14px) rotate(0)}100%{transform:rotate(360deg) translateX(14px) rotate(-360deg)}", "3s", "linear", "infinite");
  addAnim("Pulsate", "loop", "0%,100%{transform:scale(1)}50%{transform:scale(1.12)}", "2s", "ease-in-out", "infinite");
  addAnim("Breathing Soft", "loop", "0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.04);opacity:.82}", "3.4s", "ease-in-out", "infinite");
  addAnim("Drift", "loop", "0%,100%{transform:translate(-8px,-6px)}50%{transform:translate(8px,6px)}", "5s", "ease-in-out", "infinite");
  addAnim("Flip Loop", "loop", "0%,40%{transform:perspective(700px) rotateY(0)}60%,100%{transform:perspective(700px) rotateY(180deg)}", "2.6s", "ease-in-out", "infinite");
  addAnim("Tilt Loop", "loop", "0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}", "3s", "ease-in-out", "infinite");
  addAnim("Bounce Loop", "loop", "0%,100%{transform:translateY(0)}35%{transform:translateY(-22px)}55%{transform:translateY(0)}75%{transform:translateY(-9px)}", "1.8s", "ease-in-out", "infinite");
  addAnim("Neon Loop", "loop", "0%,100%{opacity:1;filter:drop-shadow(0 0 4px rgba(255,255,255,.6))}50%{opacity:.55;filter:drop-shadow(0 0 16px rgba(255,255,255,.95))}", "1.8s", "ease-in-out", "infinite");
  addAnim("Wave Loop", "loop", "0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}", "2.4s", "ease-in-out", "infinite", "bottom center");
  addAnim("Pendulum", "loop", "0%,100%{transform:rotate(14deg)}50%{transform:rotate(-14deg)}", "2.6s", "ease-in-out", "infinite", "top center");
  addAnim("Figure 8", "loop", "0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(10px,-8px) rotate(90deg)}50%{transform:translate(0,0) rotate(180deg)}75%{transform:translate(-10px,8px) rotate(270deg)}", "6s", "linear", "infinite");
  addAnim("Sway", "loop", "0%,100%{transform:translateX(-6px) rotate(-2deg)}50%{transform:translateX(6px) rotate(2deg)}", "4s", "ease-in-out", "infinite");
  addAnim("Orbit Reverse", "loop", "0%{transform:rotate(0) translateX(-14px) rotate(0)}100%{transform:rotate(-360deg) translateX(-14px) rotate(360deg)}", "3s", "linear", "infinite");
  addAnim("Zoom Loop", "loop", "0%,100%{transform:scale(1)}50%{transform:scale(1.1)}", "2.4s", "ease-in-out", "infinite");

  /* ---------------- HOVER ---------------- */
  addHover("Lift", "hover",
    "transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s",
    "transform:translateY(-10px);box-shadow:0 18px 34px rgba(0,0,0,.45)");
  addHover("Lift Small", "hover",
    "transition:transform .25s,box-shadow .25s",
    "transform:translateY(-4px);box-shadow:0 10px 20px rgba(0,0,0,.35)");
  addHover("Rise", "hover",
    "transition:transform .3s,box-shadow .3s,border-color .3s",
    "transform:translateY(-6px) scale(1.02);box-shadow:0 14px 28px rgba(0,0,0,.4);border-color:rgba(255,255,255,.35)");
  addHover("Drop Shadow", "hover",
    "transition:filter .35s,transform .35s",
    "filter:drop-shadow(0 16px 18px rgba(0,0,0,.55));transform:translateY(-4px)");
  addHover("Glow", "hover",
    "transition:box-shadow .35s,transform .35s",
    "box-shadow:0 0 24px var(--accent-glow, rgba(59,130,246,.7)),0 0 60px var(--accent-soft, rgba(59,130,246,.35));transform:scale(1.03)");
  addHover("Glow Soft", "hover",
    "transition:box-shadow .4s",
    "box-shadow:0 0 14px var(--accent-soft, rgba(59,130,246,.45))");
  addHover("Tilt Left", "hover",
    "transition:transform .35s cubic-bezier(.22,1,.36,1)",
    "transform:perspective(600px) rotateY(-12deg) rotateX(4deg)");
  addHover("Tilt Right", "hover",
    "transition:transform .35s cubic-bezier(.22,1,.36,1)",
    "transform:perspective(600px) rotateY(12deg) rotateX(-4deg)");
  addHover("Tilt 3D", "hover",
    "transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .4s",
    "transform:perspective(700px) rotateX(10deg) rotateY(-10deg) translateY(-6px);box-shadow:-14px 18px 30px rgba(0,0,0,.4)");
  addHover("Shine", "hover",
    "position:relative;overflow:hidden;transition:transform .3s",
    "transform:translateY(-4px)",
    ".{S}::after{content:\"\";position:absolute;top:0;left:-70%;width:50%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);transition:left .6s ease}" +
    ".{S}:hover::after,.{S}.is-playing::after{left:130%}");
  addHover("Sweep Bar", "hover",
    "position:relative;overflow:hidden;transition:color .3s",
    "color:var(--text-1, #fff)",
    ".{S}::after{content:\"\";position:absolute;left:0;bottom:0;width:100%;height:3px;background:var(--accent, #3b82f6);transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.22,1,.36,1)}" +
    ".{S}:hover::after,.{S}.is-playing::after{transform:scaleX(1)}");
  addHover("Border Draw", "hover",
    "background-image:linear-gradient(var(--accent,#3b82f6),var(--accent,#3b82f6));background-repeat:no-repeat;background-position:0 100%;background-size:0% 3px;transition:background-size .45s cubic-bezier(.22,1,.36,1)",
    "background-size:100% 3px");
  addHover("Underline Grow", "hover",
    "position:relative",
    "",
    ".{S}::after{content:\"\";position:absolute;left:0;bottom:-4px;width:100%;height:2px;background:var(--accent,#3b82f6);transform:scaleX(0);transform-origin:right;transition:transform .4s cubic-bezier(.22,1,.36,1)}" +
    ".{S}:hover::after,.{S}.is-playing::after{transform:scaleX(1);transform-origin:left}");
  addHover("Underline Slide", "hover",
    "position:relative",
    "",
    ".{S}::after{content:\"\";position:absolute;left:10%;bottom:-4px;width:80%;height:2px;background:var(--accent,#3b82f6);transform:translateX(-140%);transition:transform .45s cubic-bezier(.22,1,.36,1)}" +
    ".{S}:hover::after,.{S}.is-playing::after{transform:translateX(0)}");
  addHover("Scale Up", "hover", "transition:transform .3s cubic-bezier(.34,1.56,.64,1)", "transform:scale(1.12)");
  addHover("Scale Down", "hover", "transition:transform .3s", "transform:scale(.92)");
  addHover("Rotate Small", "hover", "transition:transform .4s cubic-bezier(.22,1,.36,1)", "transform:rotate(8deg)");
  addHover("Rotate Full", "hover", "transition:transform .6s cubic-bezier(.22,1,.36,1)", "transform:rotate(360deg)");
  addHover("Spin Hover", "hover", "transition:transform .6s cubic-bezier(.22,1,.36,1)", "transform:rotate(180deg) scale(1.06)");
  addHover("Squish Hover", "hover", "transition:transform .3s cubic-bezier(.34,1.56,.64,1)", "transform:scale(1.14,.86)");
  addHover("Jelly Hover", "hover", "transition:transform .5s cubic-bezier(.34,1.56,.64,1)", "transform:scale(1.08) rotate(-3deg)");
  addHover("Float Hover", "hover", "transition:transform .4s ease-in-out,box-shadow .4s", "transform:translateY(-9px);box-shadow:0 14px 26px rgba(0,0,0,.35)");
  addHover("Grayscale Off", "hover", "filter:grayscale(1);transition:filter .45s", "filter:grayscale(0) saturate(1.3)");
  addHover("Saturate Boost", "hover", "filter:saturate(.7);transition:filter .4s", "filter:saturate(1.8) contrast(1.1)");
  addHover("Blur Soft", "hover", "filter:blur(3px);transition:filter .4s", "filter:blur(0)");
  addHover("Skew Hover", "hover", "transition:transform .35s", "transform:skewX(-10deg)");
  addHover("Invert Flash", "hover", "filter:invert(0);transition:filter .3s", "filter:invert(1)");
  addHover("Shadow Pop", "hover", "transition:box-shadow .25s,transform .25s", "box-shadow:7px 7px 0 var(--accent,#3b82f6);transform:translate(-3px,-3px)");
  addHover("Border Pulse", "hover", "transition:border-color .35s,box-shadow .35s", "border-color:var(--accent,#3b82f6);box-shadow:0 0 0 4px var(--accent-soft, rgba(59,130,246,.25))");
  addHover("Background Slide", "hover",
    "background-image:linear-gradient(120deg,var(--accent,#3b82f6),#a855f7);background-size:220% 100%;background-position:0% 0%;transition:background-position .5s ease,color .3s",
    "background-position:100% 0%");
  addHover("Background Fade", "hover",
    "background-image:linear-gradient(var(--accent-soft,rgba(59,130,246,.3)),var(--accent-soft,rgba(59,130,246,.3)));background-size:100% 0%;background-repeat:no-repeat;background-position:center;transition:background-size .4s cubic-bezier(.22,1,.36,1),color .3s",
    "background-size:100% 100%");
  addHover("Button Press", "hover", "transition:transform .15s,box-shadow .15s", "transform:translateY(2px) scale(.97);box-shadow:inset 0 3px 8px rgba(0,0,0,.35)");
  addHover("Link Sweep", "hover",
    "position:relative;overflow:hidden",
    "",
    ".{S}::before{content:\"\";position:absolute;inset:0;background:var(--accent-soft,rgba(59,130,246,.3));transform:translateY(101%);transition:transform .4s cubic-bezier(.22,1,.36,1);z-index:-1}" +
    ".{S}:hover::before,.{S}.is-playing::before{transform:translateY(0)}");

  /* ---------------- TEXT ---------------- */
  addAnim("Typewriter", "text",
    "from{width:0}to{width:100%}", "2.4s", "steps(11,end)",
    "1",
    null);
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{white-space:nowrap;overflow:hidden;border-right:3px solid var(--accent,#3b82f6);box-sizing:border-box}";
  addAnim("Glitch", "text",
    "0%,100%{text-shadow:2px 0 #f0f, -2px 0 #0ff;transform:translate(0)}20%{text-shadow:-3px 0 #f0f,3px 0 #0ff;transform:translate(2px,1px)}40%{text-shadow:3px 0 #f0f,-3px 0 #0ff;transform:translate(-2px,-1px)}60%{text-shadow:-2px 0 #f0f,2px 0 #0ff;transform:translate(1px,2px)}80%{text-shadow:2px 0 #f0f,-2px 0 #0ff;transform:translate(-1px,-2px)}",
    "1.2s", "steps(1,end)");
  addAnim("Neon Text", "text",
    "0%,100%{opacity:1;text-shadow:0 0 4px #fff,0 0 12px var(--accent,#3b82f6),0 0 26px var(--accent,#3b82f6)}50%{opacity:.6;text-shadow:0 0 2px #fff,0 0 6px var(--accent,#3b82f6)}",
    "1.9s", "ease-in-out", "infinite");
  addAnim("Tracking Wide", "text", "from{letter-spacing:.05em;opacity:.4}to{letter-spacing:.42em;opacity:1}", "1.4s", EASE, "1", null);
  addAnim("Tracking Tight", "text", "from{letter-spacing:.6em;opacity:.4}to{letter-spacing:.02em;opacity:1}", "1.4s", EASE, "1", null);
  addAnim("Blur Reveal", "text", "from{filter:blur(10px);opacity:0}to{filter:blur(0);opacity:1}", "1.2s", EASE);
  addAnim("Gradient Pan", "text",
    "0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}",
    "4s", "ease-in-out", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:linear-gradient(90deg,var(--accent,#3b82f6),#a855f7,#ec4899,var(--accent,#3b82f6));background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:800}";
  addAnim("Marquee", "text", "from{transform:translateX(100%)}to{transform:translateX(-100%)}", "6s", "linear", "infinite");
  addAnim("Blink", "text", "0%,49%{opacity:1}50%,100%{opacity:0}", "1.2s", "steps(1,end)", "infinite");
  addAnim("Flicker", "text", "0%,100%{opacity:1}8%{opacity:.3}12%{opacity:1}30%{opacity:.55}34%{opacity:1}60%{opacity:.4}64%{opacity:1}}".replace("}}", "}"), "2.6s", "steps(1,end)", "infinite");
  addAnim("Shimmer", "text",
    "from{background-position:-200% 0}to{background-position:200% 0}",
    "2.6s", "linear", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:linear-gradient(90deg,#8d99ae 20%,#ffffff 40%,#8d99ae 60%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:800}";
  addHover("Strike Draw", "text", "position:relative", "",
    ".{S}::after{content:\"\";position:absolute;left:0;top:50%;width:100%;height:3px;background:var(--accent,#3b82f6);transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.22,1,.36,1)}" +
    ".{S}:hover::after,.{S}.is-playing::after{transform:scaleX(1)}", "text");
  addHover("Underline Draw Text", "text", "position:relative", "",
    ".{S}::after{content:\"\";position:absolute;left:0;bottom:-6px;width:100%;height:4px;border-radius:4px;background:var(--accent,#3b82f6);transform:scaleX(0);transform-origin:right;transition:transform .45s cubic-bezier(.22,1,.36,1)}" +
    ".{S}:hover::after,.{S}.is-playing::after{transform:scaleX(1);transform-origin:left}", "text-underline");
  addAnim("Rise Text", "text", "from{opacity:0;transform:translateY(1em);display:inline-block}to{opacity:1;transform:none}", "1s", EASE);
  addHover("Text Pop", "text", "display:inline-block;transition:transform .3s cubic-bezier(.34,1.56,.64,1)", "transform:scale(1.16)", null, "text");
  addHover("Text Float", "text", "display:inline-block;transition:transform .4s ease-in-out", "transform:translateY(-8px)", null, "text");
  addHover("Text Skew", "text", "display:inline-block;transition:transform .35s", "transform:skewX(-12deg) scaleX(1.05)", null, "text");

  /* ---------------- BACKGROUND ---------------- */
  addAnim("Gradient Pan", "background", "0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}", "6s", "ease-in-out", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:linear-gradient(120deg,var(--accent,#3b82f6),#a855f7,#06b6d4,var(--accent,#3b82f6));background-size:280% 280%}";
  addAnim("Gradient Spin", "background", "to{transform:rotate(360deg)}", "7s", "linear", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{position:relative;overflow:hidden}" +
    "." + entries[entries.length - 1].id + "::before{content:\"\";position:absolute;inset:-40%;background:conic-gradient(from 0deg,var(--accent,#3b82f6),#a855f7,#ec4899,var(--accent,#3b82f6));opacity:.5}";
  addAnim("Stripes Move", "background", "from{background-position:0 0}to{background-position:56px 0}", "1.4s", "linear", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:repeating-linear-gradient(45deg,var(--accent-soft,rgba(59,130,246,.35)) 0 14px,transparent 14px 28px)}";
  addAnim("Stripes Diagonal", "background", "from{background-position:0 0}to{background-position:80px 0}", "2.4s", "linear", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:repeating-linear-gradient(-45deg,rgba(255,255,255,.16) 0 10px,transparent 10px 24px)}";
  addAnim("Radial Pulse BG", "background", "0%,100%{background-size:40% 40%;background-position:center}50%{background-size:95% 95%;background-position:center}", "3.4s", "ease-in-out", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:radial-gradient(circle,var(--accent-soft,rgba(59,130,246,.5)),transparent 70%);background-repeat:no-repeat}";
  addAnim("Aurora", "background", "0%,100%{filter:hue-rotate(0deg) saturate(1)}50%{filter:hue-rotate(60deg) saturate(1.5)}", "7s", "ease-in-out", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:linear-gradient(130deg,#0ea5e9,#8b5cf6,#10b981,#0ea5e9);background-size:220% 220%}";
  addAnim("Grid Shift", "background", "from{background-position:0 0,0 0}to{background-position:40px 40px,40px 40px}", "2.6s", "linear", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:linear-gradient(rgba(255,255,255,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.14) 1px,transparent 1px);background-size:40px 40px}";
  addAnim("Shimmer Band", "background", "from{background-position:-150% 0}to{background-position:250% 0}", "2.8s", "linear", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.5) 50%,transparent 70%);background-size:200% 100%;background-repeat:no-repeat}";
  addAnim("Conic Spin", "background", "to{background-position:360deg}", "5s", "linear", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:conic-gradient(from 0deg at 50% 50%,transparent 0deg,var(--accent-soft,rgba(59,130,246,.55)) 90deg,transparent 180deg,var(--accent-soft,rgba(59,130,246,.55)) 270deg,transparent 360deg)}";
  addAnim("Dots Move", "background", "from{background-position:0 0}to{background-position:48px 48px}", "3s", "linear", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:radial-gradient(rgba(255,255,255,.4) 3px,transparent 3px);background-size:24px 24px}";

  /* ---------------- SHAPE ---------------- */
  addAnim("Blob Morph", "shape", "0%,100%{border-radius:58% 42% 55% 45%/48% 55% 45% 52%;transform:rotate(0)}50%{border-radius:42% 58% 38% 62%/58% 42% 58% 42%;transform:rotate(18deg)}", "7s", "ease-in-out", "infinite");
  addAnim("Circle Pulse", "shape", "0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.18);opacity:.75}", "2.2s", "ease-in-out", "infinite");
  addAnim("Square Spin", "shape", "0%{transform:rotate(0) scale(1)}50%{transform:rotate(180deg) scale(.7)}100%{transform:rotate(360deg) scale(1)}", "3.4s", "ease-in-out", "infinite");
  addAnim("Morph Round", "shape", "0%,100%{border-radius:12%}50%{border-radius:50%}", "3s", "ease-in-out", "infinite");
  addAnim("Ring Expand", "shape",
    "from{transform:scale(.6);opacity:.9;border-width:10px}to{transform:scale(1.6);opacity:0;border-width:1px}", "2s", "ease-out", "infinite");
  addAnim("Triangle Bob", "shape", "0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-14px) rotate(6deg)}", "2.6s", "ease-in-out", "infinite");
  addAnim("Blob Dance", "shape", "0%,100%{border-radius:42% 58% 62% 38%/55% 42% 58% 45%;transform:rotate(-8deg)}50%{border-radius:60% 40% 35% 65%/40% 62% 38% 60%;transform:rotate(10deg) scale(1.06)}", "6s", "ease-in-out", "infinite");
  addAnim("Corner Round", "shape", "0%,100%{border-radius:8px}50%{border-radius:50%}", "2.4s", "ease-in-out", "infinite");
  addAnim("Hex Pulse", "shape",
    "0%,100%{clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);transform:scale(1)}50%{clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);transform:scale(1.14)}",
    "3s", "ease-in-out", "infinite");

  /* ---------------- UI ---------------- */
  addAnim("Ripple", "ui",
    "from{transform:scale(0);opacity:.75}to{transform:scale(2.6);opacity:0}", "1.8s", "ease-out", "infinite");
  addAnim("Skeleton Shimmer", "ui", "from{background-position:-150% 0}to{background-position:250% 0}", "1.8s", "linear", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{background-image:linear-gradient(90deg,rgba(255,255,255,.08) 25%,rgba(255,255,255,.3) 45%,rgba(255,255,255,.08) 65%);background-size:200% 100%}";
  addAnim("Progress Fill", "ui", "0%{width:4%}70%{width:88%}100%{width:100%}", "3.2s", "ease-in-out", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent,#3b82f6),#a855f7)}";
  addAnim("Border Spin", "ui", "to{transform:rotate(360deg)}", "3s", "linear", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{position:relative;overflow:hidden}" +
    "." + entries[entries.length - 1].id + "::before{content:\"\";position:absolute;inset:-75%;background:conic-gradient(transparent 60%,var(--accent,#3b82f6) 80%,transparent 100%);opacity:.85}";
  addAnim("Badge Pop", "ui", "0%,70%,100%{transform:scale(1)}80%{transform:scale(1.35)}90%{transform:scale(.95)}", "2.4s", "ease-in-out", "infinite");
  addAnim("Card Float", "ui", "0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-9px) rotate(1deg)}", "3.6s", "ease-in-out", "infinite");
  addAnim("Toast Slide", "ui", "0%,100%{transform:translateX(0);opacity:1}30%{transform:translateX(14px);opacity:.55}60%{transform:translateX(-8px);opacity:.9}", "3.4s", "ease-in-out", "infinite");
  addAnim("Loading Bar", "ui", "0%{transform:translateX(-110%)}100%{transform:translateX(210%)}", "1.8s", "ease-in-out", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{display:block;height:100%;width:45%;border-radius:inherit;background:linear-gradient(90deg,transparent,var(--accent,#3b82f6),transparent)}";
  addAnim("Alert Nudge", "ui", "0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}", "1.6s", "ease-in-out", "infinite");
  addAnim("Progress Stripe", "ui", "from{background-position:0 0}to{background-position:40px 0}", "1.2s", "linear", "infinite");
  entries[entries.length - 1].css += "." + entries[entries.length - 1].id + "{display:block;height:100%;width:70%;border-radius:inherit;background-image:linear-gradient(45deg,rgba(255,255,255,.35) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.35) 50%,rgba(255,255,255,.35) 75%,transparent 75%);background-size:40px 40px;background-color:var(--accent,#3b82f6)}";

  /* ---------------- 3D ---------------- */
  addAnim("Cube Spin", "threed", "0%{transform:perspective(800px) rotateY(0) rotateX(0)}50%{transform:perspective(800px) rotateY(180deg) rotateX(20deg)}100%{transform:perspective(800px) rotateY(360deg) rotateX(0)}", "7s", "ease-in-out", "infinite");
  addAnim("Perspective Rise", "threed", "from{opacity:0;transform:perspective(900px) translateY(90px) rotateX(45deg)}to{opacity:1;transform:perspective(900px) none}", "1.2s", EASE);
  addAnim("Rotate X In", "threed", "from{opacity:0;transform:perspective(700px) rotateX(-90deg)}to{opacity:1;transform:perspective(700px) rotateX(0)}", "1s", EASE);
  addAnim("Rotate Y In", "threed", "from{opacity:0;transform:perspective(700px) rotateY(90deg)}to{opacity:1;transform:perspective(700px) rotateY(0)}", "1s", EASE);
  addHover("Card Flip", "threed", "transition:transform .7s;transform-style:preserve-3d", "transform:rotateY(180deg)", null, "card");
  addHover("Swing Door", "threed", "transition:transform .6s cubic-bezier(.22,1,.36,1);transform-origin:left center", "transform:perspective(900px) rotateY(-52deg)", null, "card");
  addAnim("Fold In", "threed", "from{opacity:0;transform:perspective(800px) rotateX(-80deg);transform-origin:top center}to{opacity:1;transform:perspective(800px) rotateX(0)}", "1.1s", EASE);
  addAnim("Tumble", "threed", "0%,100%{transform:perspective(900px) rotateX(0) rotateY(0)}25%{transform:perspective(900px) rotateX(180deg) rotateY(0)}50%{transform:perspective(900px) rotateX(180deg) rotateY(180deg)}75%{transform:perspective(900px) rotateX(0) rotateY(180deg)}", "8s", "linear", "infinite");

  /* ---------------- Sort + inject ---------------- */
  var CAT_ORDER = ["entrance", "attention", "loop", "hover", "text", "background", "shape", "ui", "threed"];
  var CAT_LABEL = {
    entrance: "Entrance", attention: "Attention", loop: "Loop", hover: "Hover",
    text: "Text", background: "Background", shape: "Shape", ui: "UI", threed: "3D",
  };

  // Guard against accidental duplicate names/slugs
  var seen = {};
  entries = entries.filter(function (e) {
    if (seen[e.id]) return false;
    seen[e.id] = true;
    return true;
  });

  entries.sort(function (a, b) {
    var ci = CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat);
    if (ci !== 0) return ci;
    return a.name.localeCompare(b.name);
  });

  entries.forEach(function (e) {
    e.label = e.name;
    e.catLabel = CAT_LABEL[e.cat];
    // Replace the pseudo-class placeholder with the real slug
    e.css = e.css.split("{S}").join(e.id);
  });

  var styleEl = document.createElement("style");
  styleEl.id = "effects-css";
  styleEl.textContent = entries.map(function (e) { return e.css; }).join("\n");
  document.head.appendChild(styleEl);

  global.WIZARD_EFFECTS = entries;
  global.WIZARD_EFFECT_CATS = CAT_ORDER.map(function (c) {
    return { key: c, label: CAT_LABEL[c], count: entries.filter(function (e) { return e.cat === c; }).length };
  });
})(window);
