import bcrypt from "bcryptjs";
import { getPool, json, options } from "./db.js";

const toUser = (row) => ({
  id: row.id,
  name: row.username,
  username: row.username,
  avatarIdx: row.avatar_idx,
  tenantId: row.tenant_id,
});

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();

  const pool = getPool();
  const body = event.body ? JSON.parse(event.body) : {};
  const rawPath = event.path || "";
  const sub = rawPath.replace(/.*\/users\/?/, "").split("/").filter(Boolean)[0];

  try {
    // POST /api/users/register
    if (event.httpMethod === "POST" && sub === "register") {
      const { tenant_id, username, password, avatar_idx } = body;
      if (!tenant_id || !username || !password) {
        return json(400, { error: "tenant_id, username and password required" });
      }
      const uname = String(username).trim();
      if (uname.length < 2) return json(400, { error: "Username must be at least 2 characters" });
      if (password.length < 4) return json(400, { error: "Password must be at least 4 characters" });

      const exists = await pool.query(
        "SELECT 1 FROM users WHERE tenant_id=$1 AND lower(username)=lower($2)",
        [tenant_id, uname]
      );
      if (exists.rows.length > 0) return json(409, { error: "Username already taken in this group" });

      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (tenant_id, username, password_hash, avatar_idx)
         VALUES ($1,$2,$3,$4)
         RETURNING id, tenant_id, username, avatar_idx`,
        [tenant_id, uname, hash, avatar_idx ?? 0]
      );
      return json(201, toUser(result.rows[0]));
    }

    // POST /api/users/login
    if (event.httpMethod === "POST" && sub === "login") {
      const { tenant_id, username, password } = body;
      if (!tenant_id || !username || !password) {
        return json(400, { error: "tenant_id, username and password required" });
      }
      const result = await pool.query(
        "SELECT id, tenant_id, username, password_hash, avatar_idx FROM users WHERE tenant_id=$1 AND lower(username)=lower($2)",
        [tenant_id, username.trim()]
      );
      if (result.rows.length === 0) return json(401, { error: "Invalid username or password" });

      const row = result.rows[0];
      const match = await bcrypt.compare(password, row.password_hash);
      if (!match) return json(401, { error: "Invalid username or password" });

      return json(200, toUser(row));
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("users error:", err);
    return json(500, { error: err.message });
  }
};
