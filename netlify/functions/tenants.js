import bcrypt from "bcryptjs";
import { getPool, json, options } from "./db.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();

  const pool = getPool();
  const path = event.path.replace(/\/\.netlify\/functions\/tenants\/?/, "");
  const segments = path.split("/").filter(Boolean);

  try {
    // POST /tenants — create a new group
    if (event.httpMethod === "POST" && segments.length === 0) {
      const { name, slug, password } = JSON.parse(event.body || "{}");
      if (!name || !slug || !password) return json(400, { error: "name, slug and password required" });

      const slugClean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      // Check slug available
      const exists = await pool.query("SELECT id FROM tenants WHERE slug=$1", [slugClean]);
      if (exists.rows.length > 0) return json(409, { error: "That group name is already taken" });

      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        "INSERT INTO tenants (name, slug, password_hash) VALUES ($1,$2,$3) RETURNING id, name, slug, created_at",
        [name.trim(), slugClean, hash]
      );
      return json(201, result.rows[0]);
    }

    // POST /tenants/auth — validate group password, return tenant
    if (event.httpMethod === "POST" && segments[0] === "auth") {
      const { slug, password } = JSON.parse(event.body || "{}");
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

    // GET /tenants/slug/:slug — look up tenant by slug (no auth, just existence check)
    if (event.httpMethod === "GET" && segments[0] === "slug" && segments[1]) {
      const result = await pool.query(
        "SELECT id, name, slug, created_at FROM tenants WHERE slug=$1",
        [segments[1].toLowerCase()]
      );
      if (result.rows.length === 0) return json(404, { error: "Group not found" });
      return json(200, result.rows[0]);
    }

    // GET /tenants — admin only: list all tenants
    if (event.httpMethod === "GET" && segments.length === 0) {
      const adminPass = event.headers["x-admin-password"];
      if (adminPass !== process.env.ADMIN_PASSWORD) return json(403, { error: "Forbidden" });

      const result = await pool.query(
        "SELECT id, name, slug, created_at FROM tenants ORDER BY created_at DESC"
      );
      return json(200, result.rows);
    }

    // DELETE /tenants/:id — admin only
    if (event.httpMethod === "DELETE" && segments[0]) {
      const adminPass = event.headers["x-admin-password"];
      if (adminPass !== process.env.ADMIN_PASSWORD) return json(403, { error: "Forbidden" });

      await pool.query("DELETE FROM tenants WHERE id=$1", [segments[0]]);
      return json(200, { deleted: true });
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("tenants error:", err);
    return json(500, { error: err.message });
  }
};
