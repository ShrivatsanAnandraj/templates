/* =============================================================
   Website Builder Wizard — backend server.js
   • Serves the static wizard (freelance/)
   • POST /api/lead  → stores lead in Neon Postgres + emails you
   • GET  /api/leads → recent leads (protected by ADMIN_TOKEN)
   Run:  npm start          (from freelance/server)
   ============================================================= */
require("dotenv").config();
const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

/* ---------------- Database (Neon) ---------------- */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5, // Neon pooled endpoint — keep connections light
});

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS wizard_leads (
  id            BIGSERIAL PRIMARY KEY,
  full_name     TEXT NOT NULL,
  purpose       TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  summary       TEXT NOT NULL,
  colour        TEXT,
  effect        TEXT,
  specifications TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function initDb() {
  await pool.query(CREATE_TABLE_SQL);
  console.log("[db] wizard_leads table ready");
}

/* ---------------- Validation ---------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,22}$/;

function validateLead(b) {
  const errors = [];
  if (!b || typeof b !== "object") return ["Invalid payload"];
  if (!b.fullName || String(b.fullName).trim().length < 2) errors.push("fullName");
  if (!b.purpose || String(b.purpose).trim().length < 3) errors.push("purpose");
  if (!b.phone || !PHONE_RE.test(String(b.phone).trim()) || String(b.phone).replace(/\D/g, "").length < 7)
    errors.push("phone");
  if (!b.email || !EMAIL_RE.test(String(b.email).trim())) errors.push("email");
  const s = String(b.summary || "");
  if (!s.includes("colour:") || !s.includes("effect:") || !s.includes("specifications:"))
    errors.push("summary");
  return errors;
}

/* ---------------- Email (optional — SMTP or Resend) ---------------- */
// All notifications are delivered to this address (override with NOTIFY_EMAIL)
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "shrivatsan.anandraj@gmail.com";

async function sendEmail(payload) {
  // Option A: SMTP (Gmail app password, Outlook, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require("nodemailer");
    const tx = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await tx.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: NOTIFY_EMAIL,
      subject: payload._subject || "[Website Wizard] New website request",
      text: [
        "New website request received!\n",
        `Name:    ${payload.fullName}`,
        `Purpose: ${payload.purpose}`,
        `Phone:   ${payload.phone}`,
        `Email:   ${payload.email}`,
        "",
        "----- Specification -----",
        payload.summary,
      ].join("\n"),
    });
    return "smtp";
  }

  // Option B: Resend API
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Website Wizard <onboarding@resend.dev>",
        to: [NOTIFY_EMAIL],
        subject: payload._subject || "[Website Wizard] New website request",
        text: `New lead:\n\nName: ${payload.fullName}\nPurpose: ${payload.purpose}\nPhone: ${payload.phone}\nEmail: ${payload.email}\n\n----- Specification -----\n${payload.summary}`,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return "resend";
  }

  return null; // no email provider configured — lead still saved
}

/* ---------------- Simple per-IP rate limit ---------------- */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const win = 60 * 60 * 1000; // 1 hour
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  if (list.length >= 15) return true;
  list.push(now);
  hits.set(ip, list);
  return false;
}

/* ---------------- Routes ---------------- */
app.post("/api/lead", async (req, res) => {
  try {
    if (rateLimited(req.ip)) {
      return res.status(429).json({ ok: false, error: "Too many requests — try again later." });
    }

    const errors = validateLead(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, error: "Invalid fields", fields: errors });
    }

    const b = req.body;
    const { rows } = await pool.query(
      `INSERT INTO wizard_leads
         (full_name, purpose, phone, email, summary, colour, effect, specifications, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, created_at`,
      [
        String(b.fullName).trim(),
        String(b.purpose).trim(),
        String(b.phone).trim(),
        String(b.email).trim(),
        String(b.summary),
        b.colour || null,
        b.effect || null,
        b.specifications || null,
        (req.headers["user-agent"] || "").slice(0, 300),
      ]
    );
    console.log(`[lead] saved #${rows[0].id} for ${b.email}`);

    let emailVia = null;
    try {
      emailVia = await sendEmail(b);
      console.log(emailVia ? `[email] sent via ${emailVia}` : "[email] skipped — no provider configured");
    } catch (e) {
      console.error("[email] failed (lead still saved):", e.message);
    }

    res.json({ ok: true, id: Number(rows[0].id), emailSent: Boolean(emailVia) });
  } catch (e) {
    console.error("[lead] save failed:", e.message);
    res.status(500).json({ ok: false, error: "Could not save your request. Please try again." });
  }
});

app.get("/api/leads", async (req, res) => {
  if (!process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: "Set ADMIN_TOKEN in .env to enable this endpoint." });
  }
  if (req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { rows } = await pool.query(
    "SELECT id, full_name, purpose, phone, email, summary, colour, effect, specifications, created_at FROM wizard_leads ORDER BY id DESC LIMIT 100"
  );
  res.json(rows);
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "up" });
  } catch {
    res.status(500).json({ ok: false, db: "down" });
  }
});

/* ---------------- Static wizard ---------------- */
app.use(express.static(path.join(__dirname, "..")));

/* ---------------- Boot ---------------- */
initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] Wizard running at http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error("[db] init failed:", e.message);
    process.exit(1);
  });
