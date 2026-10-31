/* =============================================================
   Website Builder Wizard — backend server.js
   • Serves the static wizard (freelance/) and /admin page
   • POST /api/lead  → stores lead in Neon Postgres
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

    res.json({ ok: true, id: Number(rows[0].id) });
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
    "SELECT id::int AS id, full_name, purpose, phone, email, summary, colour, effect, specifications, created_at FROM wizard_leads ORDER BY id DESC LIMIT 100"
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

/* ---------------- Static wizard + admin ---------------- */
app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "admin.html"));
});
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
