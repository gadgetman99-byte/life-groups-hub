import { getPool, json, options } from "./db.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();

  const pool = getPool();
  const params = event.queryStringParameters || {};
  const tenantId = params.tenant_id;
  // Support pagination: only fetch messages after a given id
  const after = params.after;

  try {
    // GET /messages?tenant_id=xxx&after=id
    if (event.httpMethod === "GET") {
      if (!tenantId) return json(400, { error: "tenant_id required" });

      let query, queryParams;
      if (after) {
        // Get the created_at of the "after" message then fetch newer
        const pivot = await pool.query("SELECT created_at FROM messages WHERE id=$1", [after]);
        if (pivot.rows.length > 0) {
          query = "SELECT * FROM messages WHERE tenant_id=$1 AND created_at > $2 ORDER BY created_at ASC LIMIT 100";
          queryParams = [tenantId, pivot.rows[0].created_at];
        } else {
          query = "SELECT * FROM messages WHERE tenant_id=$1 ORDER BY created_at ASC LIMIT 200";
          queryParams = [tenantId];
        }
      } else {
        query = "SELECT * FROM messages WHERE tenant_id=$1 ORDER BY created_at ASC LIMIT 200";
        queryParams = [tenantId];
      }

      const result = await pool.query(query, queryParams);
      return json(200, result.rows);
    }

    // POST /messages
    if (event.httpMethod === "POST") {
      const { tenant_id, author, avatar_idx, text } = JSON.parse(event.body || "{}");
      if (!tenant_id || !author || !text) return json(400, { error: "tenant_id, author, text required" });
      const result = await pool.query(
        "INSERT INTO messages (tenant_id, author, avatar_idx, text) VALUES ($1,$2,$3,$4) RETURNING *",
        [tenant_id, author, avatar_idx ?? 0, text.trim()]
      );
      return json(201, result.rows[0]);
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("messages error:", err);
    return json(500, { error: err.message });
  }
};
