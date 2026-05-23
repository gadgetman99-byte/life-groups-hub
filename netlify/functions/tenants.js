import bcrypt from "bcryptjs";
import { getPool, json, options } from "./db.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();

  const pool = getPool();
  const body = event.body ? JSON.parse(event.body) : {};

  // Parse sub-path: /.netlify/functions/tenants/auth or /auth etc
  const rawPath = event.path || "";
  const subPath = rawPath.replace(/.*\/tenants\/?/, "").split("/").filter(Boolean);
  const sub = subPath[0]; // "auth", "slug", or undefined
  const sub2 = subPath[1]; // slug value when path is /slug/:slug

  console.log("tenants called:", event.httpMethod, rawPath, "sub:", sub, sub2);

  try {
    // POST /api/tenants — create new group (admin only)
    if (event.httpMethod === "POST" && !sub) {
      const adminPass = event.headers["x-admin-password"];
      if (!adminPass || adminPass !== process.env.ADMIN_PASSWORD) return json(403, { error: "Admin password required" });
      const { name, slug, password } = body;
      if (!name || !slug || !password) return json(400, { error: "name, slug and password required" });

      const slugClean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const exists = await pool.query("SELECT id FROM tenants WHERE slug=$1", [slugClean]);
      if (exists.rows.length > 0) return json(409, { error: "That group ID is already taken" });

      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        "INSERT INTO tenants (name, slug, password_hash) VALUES ($1,$2,$3) RETURNING id, name, slug, created_at",
        [name.trim(), slugClean, hash]
      );
      return json(201, result.rows[0]);
    }

    // POST /api/tenants/auth — validate password
    if (event.httpMethod === "POST" && sub === "auth") {
      const { slug, password } = body;
      if (!slug || !password) return json(400, { error: "slug and password required" });

      const result = await pool.query(
        "SELECT id, name, slug, password_hash, created_at FROM tenants WHERE slug=$1",
        [slug.toLowerCase()]
      );
      if (result.rows.length === 0) return json(404, { error: "Group not found" });

      const tenant = result.rows[0];
      const match = await bcrypt.compare(password, tenant.password_hash);
      if (!match) return json(401, { error: "Incorrect password" });

      const { password_hash, ...safe } = tenant;
      return json(200, safe);
    }

    // GET /api/tenants/slug/:slug
    if (event.httpMethod === "GET" && sub === "slug" && sub2) {
      const result = await pool.query(
        "SELECT id, name, slug, created_at FROM tenants WHERE slug=$1",
        [sub2.toLowerCase()]
      );
      if (result.rows.length === 0) return json(404, { error: "Group not found" });
      return json(200, result.rows[0]);
    }

    // GET /api/tenants — admin list
    if (event.httpMethod === "GET" && !sub) {
      const adminPass = event.headers["x-admin-password"];
      if (adminPass !== process.env.ADMIN_PASSWORD) return json(403, { error: "Forbidden" });
      const result = await pool.query(
        "SELECT id, name, slug, created_at FROM tenants ORDER BY created_at DESC"
      );
      return json(200, result.rows);
    }

    // DELETE /api/tenants/:id — admin
    if (event.httpMethod === "DELETE" && sub) {
      const adminPass = event.headers["x-admin-password"];
      if (adminPass !== process.env.ADMIN_PASSWORD) return json(403, { error: "Forbidden" });
      await pool.query("DELETE FROM tenants WHERE id=$1", [sub]);
      return json(200, { deleted: true });
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("tenants error:", err);
    return json(500, { error: err.message });
  }
};
