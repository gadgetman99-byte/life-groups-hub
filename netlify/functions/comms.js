import { getPool, json, options } from "./db.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();

  const pool = getPool();
  const params = event.queryStringParameters || {};
  const tenantId = params.tenant_id;
  const raw = event.path.replace(/\/\.netlify\/functions\/comms\/?/, "");
  const segments = raw.split("/").filter(Boolean);
  const id = segments[0];
  const sub = segments[1]; // "react"

  try {
    // GET /comms?tenant_id=xxx
    if (event.httpMethod === "GET") {
      if (!tenantId) return json(400, { error: "tenant_id required" });

      const commsRes = await pool.query(
        "SELECT * FROM comms WHERE tenant_id=$1 ORDER BY created_at DESC",
        [tenantId]
      );
      if (commsRes.rows.length === 0) return json(200, []);

      const commIds = commsRes.rows.map(c => c.id);
      const reactRes = await pool.query(
        "SELECT comm_id, emoji, user_name FROM comms_reactions WHERE comm_id = ANY($1)",
        [commIds]
      );

      const reactMap = {};
      reactRes.rows.forEach(r => {
        if (!reactMap[r.comm_id]) reactMap[r.comm_id] = {};
        if (!reactMap[r.comm_id][r.emoji]) reactMap[r.comm_id][r.emoji] = [];
        reactMap[r.comm_id][r.emoji].push(r.user_name);
      });

      const comms = commsRes.rows.map(c => ({
        ...c,
        reactions: reactMap[c.id] || {},
      }));

      return json(200, comms);
    }

    // POST /comms — create comm
    if (event.httpMethod === "POST" && !id) {
      const { tenant_id, type, title, body, author, avatar_idx } = JSON.parse(event.body || "{}");
      if (!tenant_id || !title || !body) return json(400, { error: "tenant_id, title, body required" });
      const result = await pool.query(
        `INSERT INTO comms (tenant_id, type, title, body, author, avatar_idx)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [tenant_id, type || "announcement", title, body, author, avatar_idx ?? 0]
      );
      return json(201, { ...result.rows[0], reactions: {} });
    }

    // POST /comms/:id/react — toggle reaction
    if (event.httpMethod === "POST" && id && sub === "react") {
      const { emoji, user_name } = JSON.parse(event.body || "{}");
      if (!emoji || !user_name) return json(400, { error: "emoji and user_name required" });

      const exists = await pool.query(
        "SELECT 1 FROM comms_reactions WHERE comm_id=$1 AND emoji=$2 AND user_name=$3",
        [id, emoji, user_name]
      );
      if (exists.rows.length > 0) {
        await pool.query(
          "DELETE FROM comms_reactions WHERE comm_id=$1 AND emoji=$2 AND user_name=$3",
          [id, emoji, user_name]
        );
        return json(200, { reacted: false });
      } else {
        await pool.query(
          "INSERT INTO comms_reactions (comm_id, emoji, user_name) VALUES ($1,$2,$3)",
          [id, emoji, user_name]
        );
        return json(200, { reacted: true });
      }
    }

    // DELETE /comms/:id
    if (event.httpMethod === "DELETE" && id && !sub) {
      await pool.query("DELETE FROM comms WHERE id=$1", [id]);
      return json(200, { deleted: true });
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("comms error:", err);
    return json(500, { error: err.message });
  }
};
