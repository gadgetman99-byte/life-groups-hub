import { getPool, json, options } from "./db.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();

  const pool = getPool();
  const params = event.queryStringParameters || {};
  const tenantId = params.tenant_id;
  const segments = (event.path || "").replace(/.*\/events\/?/, "").split("/").filter(Boolean);
  const id = segments[0];

  try {
    // GET /events?tenant_id=xxx
    if (event.httpMethod === "GET") {
      if (!tenantId) return json(400, { error: "tenant_id required" });
      const result = await pool.query(
        "SELECT * FROM events WHERE tenant_id=$1 ORDER BY date ASC, created_at ASC",
        [tenantId]
      );
      return json(200, result.rows);
    }

    // POST /events
    if (event.httpMethod === "POST") {
      const { tenant_id, title, date, time, location, description, color, created_by } = JSON.parse(event.body || "{}");
      if (!tenant_id || !title || !date) return json(400, { error: "tenant_id, title, date required" });
      const result = await pool.query(
        `INSERT INTO events (tenant_id, title, date, time, location, description, color, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [tenant_id, title, date, time || null, location || null, description || null, color || "#6c8eff", created_by]
      );
      return json(201, result.rows[0]);
    }

    // PUT /events/:id
    if (event.httpMethod === "PUT" && id) {
      const { title, date, time, location, description, color } = JSON.parse(event.body || "{}");
      const result = await pool.query(
        `UPDATE events SET title=$1, date=$2, time=$3, location=$4, description=$5, color=$6
         WHERE id=$7 RETURNING *`,
        [title, date, time || null, location || null, description || null, color || "#6c8eff", id]
      );
      return json(200, result.rows[0]);
    }

    // DELETE /events/:id
    if (event.httpMethod === "DELETE" && id) {
      await pool.query("DELETE FROM events WHERE id=$1", [id]);
      return json(200, { deleted: true });
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("events error:", err);
    return json(500, { error: err.message });
  }
};
