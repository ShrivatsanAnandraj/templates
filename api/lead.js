/* =============================================================
   Vercel serverless function — POST /api/lead
   Stores the wizard lead in Neon Postgres and emails you
   (SMTP or Resend, if configured via env vars).
   Env required: DATABASE_URL
   ============================================================= */
const { Pool } = require("pg");

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1, // serverless — one connection per instance
    });
  }
  return pool;
}

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,22}$/;

function validateLead(b) {
  const errors = [];
  if (!b || typeof b !== "object") return ["payload"];
  if (!b.fullName || String(b.fullName).trim().length < 2) errors.push("fullName");
  if (!b.purpose || String(b.purpose).trim().length < 3) errors.push("purpose");
  if (
    !b.phone ||
    !PHONE_RE.test(String(b.phone).trim()) ||
    String(b.phone).replace(/\D/g, "").length < 7
  )
    errors.push("phone");
  if (!b.email || !EMAIL_RE.test(String(b.email).trim())) errors.push("email");
  const s = String(b.summary || "");
  if (!s.includes("colour:") || !s.includes("effect:") || !s.includes("specifications:"))
    errors.push("summary");
  return errors;
}

// All notifications are delivered to this address (override with NOTIFY_EMAIL)
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "shrivatsan.anandraj@gmail.com";

async function sendEmail(payload) {
  const subject = payload._subject || "[Website Wizard] New website request";
  const text = [
    "New website request received!\n",
    `Name:    ${payload.fullName}`,
    `Purpose: ${payload.purpose}`,
    `Phone:   ${payload.phone}`,
    `Email:   ${payload.email}`,
    "",
    "----- Specification -----",
    payload.summary,
  ].join("\n");

  // Option A: SMTP (Gmail app password, Outlook, …)
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
      subject,
      text,
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
        subject,
        text,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return "resend";
  }

  return null;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const errors = validateLead(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, error: "Invalid fields", fields: errors });
    }

    const b = req.body;
    const db = getPool();

    // Lazy table creation (idempotent)
    try {
      await db.query(CREATE_TABLE_SQL);
    } catch (e) {
      console.error("[db] create table failed:", e.message);
    }

    const { rows } = await db.query(
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
        String(req.headers["user-agent"] || "").slice(0, 300),
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

    return res.status(200).json({ ok: true, id: Number(rows[0].id), emailSent: Boolean(emailVia) });
  } catch (e) {
    console.error("[lead] save failed:", e.message);
    return res
      .status(500)
      .json({ ok: false, error: "Could not save your request. Please try again." });
  }
};
