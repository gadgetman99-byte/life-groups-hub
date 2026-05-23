-- ─────────────────────────────────────────────────────────────────────────────
-- Life Groups Hub — Supabase Schema
-- Run this once in your Supabase SQL editor (supabase.com → SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- Tenants (one per life group)
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  date        TEXT NOT NULL,
  time        TEXT,
  location    TEXT,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#6c8eff',
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_tenant_idx ON events(tenant_id);

-- Ideas
CREATE TABLE IF NOT EXISTS ideas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL DEFAULT 'activity',
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ideas_tenant_idx ON ideas(tenant_id);

-- Idea votes (one row per user per idea)
CREATE TABLE IF NOT EXISTS idea_votes (
  idea_id     UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_name   TEXT NOT NULL,
  PRIMARY KEY (idea_id, user_name)
);

-- Idea comments
CREATE TABLE IF NOT EXISTS idea_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id     UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  author      TEXT NOT NULL,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  author      TEXT NOT NULL,
  avatar_idx  INTEGER NOT NULL DEFAULT 0,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_tenant_idx ON messages(tenant_id);

-- Communications
CREATE TABLE IF NOT EXISTS comms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'announcement',
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  author      TEXT NOT NULL,
  avatar_idx  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comms_tenant_idx ON comms(tenant_id);

-- Comms reactions (emoji reactions per user)
CREATE TABLE IF NOT EXISTS comms_reactions (
  comm_id     UUID NOT NULL REFERENCES comms(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  user_name   TEXT NOT NULL,
  PRIMARY KEY (comm_id, emoji, user_name)
);
