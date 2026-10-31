/* =============================================================
   Vercel serverless function — GET /api/leads
   Returns recent wizard leads for the admin page.
   Auth: x-admin-token header or ?token= query param
   Env required: DATABASE_URL, ADMIN_TOKEN
   ============================================================= */
const { Pool } = require("pg");

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
  }
  return pool;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(403).json({ ok: false, error: "ADMIN_TOKEN is not configured." });
  }

  const given = req.headers["x-admin-token"] || (req.query && req.query.token);
  if (String(given) !== expected) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const { rows } = await getPool().query(
      `SELECT id::int AS id, full_name, purpose, phone, email, summary, colour, effect, specifications, created_at
       FROM wizard_leads ORDER BY id DESC LIMIT 200`
    );
    return res.status(200).json({ ok: true, count: rows.length, leads: rows });
  } catch (e) {
    console.error("[leads] query failed:", e.message);
    return res.status(500).json({ ok: false, error: "Could not load leads." });
  }
};
