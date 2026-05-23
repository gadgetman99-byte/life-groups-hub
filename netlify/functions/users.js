import bcrypt from "bcryptjs";
import { getPool, json, options } from "./db.js";

const toUser = (row) => ({
  id: row.id,
  name: row.username,
  username: row.username,
  avatarIdx: row.avatar_idx,
  tenantId: row.tenant_id,
});

const toTenant = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
});

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();

  const pool = getPool();
  const body = event.body ? JSON.parse(event.body) : {};
  const rawPath = event.path || "";
  const segments = rawPath.replace(/.*\/users\/?/, "").split("/").filter(Boolean);
  const seg0 = segments[0]; // "register" | "login" | <user_id>
  const params = event.queryStringParameters || {};

  try {
    // POST /api/users/register — body: { tenant_id, tenant_password, username, password, avatar_idx }
    if (event.httpMethod === "POST" && seg0 === "register") {
      const { tenant_id, tenant_password, username, password, avatar_idx } = body;
      if (!tenant_id || !tenant_password || !username || !password) {
        return json(400, { error: "tenant_id, tenant_password, username and password required" });
      }
      const uname = String(username).trim();
      if (uname.length < 2) return json(400, { error: "Username must be at least 2 characters" });
      if (password.length < 4) return json(400, { error: "Password must be at least 4 characters" });

      const tres = await pool.query(
        "SELECT id, name, slug, password_hash FROM tenants WHERE id=$1",
        [tenant_id]
      );
      if (tres.rows.length === 0) return json(404, { error: "Lifegroup not found" });
      const tenant = tres.rows[0];

      const tenantOk = await bcrypt.compare(tenant_password, tenant.password_hash);
      if (!tenantOk) return json(401, { error: "Incorrect lifegroup password" });

      const exists = await pool.query(
        "SELECT 1 FROM users WHERE tenant_id=$1 AND lower(username)=lower($2)",
        [tenant_id, uname]
      );
      if (exists.rows.length > 0) return json(409, { error: "Username already taken in this lifegroup" });

      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (tenant_id, username, password_hash, avatar_idx)
         VALUES ($1,$2,$3,$4)
         RETURNING id, tenant_id, username, avatar_idx`,
        [tenant_id, uname, hash, avatar_idx ?? 0]
      );
      return json(201, { user: toUser(result.rows[0]), tenant: toTenant(tenant) });
    }

    // POST /api/users/login — body: { username, password } — searches across all tenants
    if (event.httpMethod === "POST" && seg0 === "login") {
      const { username, password } = body;
      if (!username || !password) {
        return json(400, { error: "username and password required" });
      }
      const result = await pool.query(
        `SELECT u.id, u.tenant_id, u.username, u.password_hash, u.avatar_idx,
                t.name AS tenant_name, t.slug AS tenant_slug
         FROM users u
         JOIN tenants t ON t.id = u.tenant_id
         WHERE lower(u.username) = lower($1)`,
        [username.trim()]
      );
      if (result.rows.length === 0) return json(401, { error: "Invalid username or password" });

      const matches = [];
      for (const row of result.rows) {
        const ok = await bcrypt.compare(password, row.password_hash);
        if (ok) {
          matches.push({
            user: toUser(row),
            tenant: { id: row.tenant_id, name: row.tenant_name, slug: row.tenant_slug },
          });
        }
      }
      if (matches.length === 0) return json(401, { error: "Invalid username or password" });
      return json(200, { matches });
    }

    // GET /api/users?tenant_id=xxx — admin lists users in a tenant
    if (event.httpMethod === "GET" && !seg0) {
      const adminPass = event.headers["x-admin-password"];
      if (!adminPass || adminPass !== process.env.ADMIN_PASSWORD) {
        return json(403, { error: "Admin password required" });
      }
      const tenantId = params.tenant_id;
      if (!tenantId) return json(400, { error: "tenant_id required" });
      const result = await pool.query(
        `SELECT id, tenant_id, username, avatar_idx, created_at
         FROM users WHERE tenant_id=$1 ORDER BY username ASC`,
        [tenantId]
      );
      return json(200, result.rows.map(r => ({
        ...toUser(r),
        created_at: r.created_at,
      })));
    }

    // DELETE /api/users/:id — admin (via x-admin-password) OR self (with password in body)
    if (event.httpMethod === "DELETE" && seg0) {
      const userId = seg0;
      const adminPass = event.headers["x-admin-password"];
      const isAdmin = adminPass && adminPass === process.env.ADMIN_PASSWORD;

      if (!isAdmin) {
        // self-delete: must provide own password
        const { password } = body;
        if (!password) return json(400, { error: "password required" });
        const ures = await pool.query(
          "SELECT password_hash FROM users WHERE id=$1",
          [userId]
        );
        if (ures.rows.length === 0) return json(404, { error: "User not found" });
        const ok = await bcrypt.compare(password, ures.rows[0].password_hash);
        if (!ok) return json(401, { error: "Incorrect password" });
      }

      await pool.query("DELETE FROM users WHERE id=$1", [userId]);
      return json(200, { deleted: true });
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("users error:", err);
    return json(500, { error: err.message });
  }
};
