import { getPool, json, options } from "./db.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();

  const pool = getPool();
  const params = event.queryStringParameters || {};
  const tenantId = params.tenant_id;
  const raw = event.path.replace(/\/\.netlify\/functions\/ideas\/?/, "");
  const segments = raw.split("/").filter(Boolean);
  const id = segments[0];
  const sub = segments[1]; // "vote" or "comments"

  try {
    // GET /ideas?tenant_id=xxx — fetch ideas with vote counts and comments
    if (event.httpMethod === "GET") {
      if (!tenantId) return json(400, { error: "tenant_id required" });

      const ideasRes = await pool.query(
        "SELECT * FROM ideas WHERE tenant_id=$1 ORDER BY created_at DESC",
        [tenantId]
      );
      if (ideasRes.rows.length === 0) return json(200, []);

      const ideaIds = ideasRes.rows.map(i => i.id);

      const votesRes = await pool.query(
        "SELECT idea_id, user_name FROM idea_votes WHERE idea_id = ANY($1)",
        [ideaIds]
      );
      const commentsRes = await pool.query(
        "SELECT * FROM idea_comments WHERE idea_id = ANY($1) ORDER BY created_at ASC",
        [ideaIds]
      );

      const votesMap = {};
      votesRes.rows.forEach(v => {
        if (!votesMap[v.idea_id]) votesMap[v.idea_id] = [];
        votesMap[v.idea_id].push(v.user_name);
      });

      const commentsMap = {};
      commentsRes.rows.forEach(c => {
        if (!commentsMap[c.idea_id]) commentsMap[c.idea_id] = [];
        commentsMap[c.idea_id].push(c);
      });

      const ideas = ideasRes.rows.map(i => ({
        ...i,
        votes: votesMap[i.id] || [],
        comments: commentsMap[i.id] || [],
      }));

      return json(200, ideas);
    }

    // POST /ideas — create idea
    if (event.httpMethod === "POST" && !id) {
      const { tenant_id, title, description, category, created_by } = JSON.parse(event.body || "{}");
      if (!tenant_id || !title) return json(400, { error: "tenant_id and title required" });
      const result = await pool.query(
        `INSERT INTO ideas (tenant_id, title, description, category, created_by)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [tenant_id, title, description || null, category || "activity", created_by]
      );
      return json(201, { ...result.rows[0], votes: [], comments: [] });
    }

    // POST /ideas/:id/vote — toggle vote
    if (event.httpMethod === "POST" && id && sub === "vote") {
      const { user_name } = JSON.parse(event.body || "{}");
      if (!user_name) return json(400, { error: "user_name required" });

      const exists = await pool.query(
        "SELECT 1 FROM idea_votes WHERE idea_id=$1 AND user_name=$2",
        [id, user_name]
      );
      if (exists.rows.length > 0) {
        await pool.query("DELETE FROM idea_votes WHERE idea_id=$1 AND user_name=$2", [id, user_name]);
        return json(200, { voted: false });
      } else {
        await pool.query("INSERT INTO idea_votes (idea_id, user_name) VALUES ($1,$2)", [id, user_name]);
        return json(200, { voted: true });
      }
    }

    // POST /ideas/:id/comments — add comment
    if (event.httpMethod === "POST" && id && sub === "comments") {
      const { author, text } = JSON.parse(event.body || "{}");
      if (!author || !text) return json(400, { error: "author and text required" });
      const result = await pool.query(
        "INSERT INTO idea_comments (idea_id, author, text) VALUES ($1,$2,$3) RETURNING *",
        [id, author, text]
      );
      return json(201, result.rows[0]);
    }

    // DELETE /ideas/:id
    if (event.httpMethod === "DELETE" && id && !sub) {
      await pool.query("DELETE FROM ideas WHERE id=$1", [id]);
      return json(200, { deleted: true });
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("ideas error:", err);
    return json(500, { error: err.message });
  }
};
