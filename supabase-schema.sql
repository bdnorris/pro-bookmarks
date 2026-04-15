-- ============================================================
-- Pro Bookmarks — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 2-level category hierarchy (parent_id null = top-level)
CREATE TABLE bookmark_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  parent_id   UUID        REFERENCES bookmark_categories(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Flat tag list; names are unique (lowercased by app convention)
CREATE TABLE bookmark_tags (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Core bookmarks table
CREATE TABLE bookmark_bookmarks (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  url               TEXT        NOT NULL,
  title             TEXT        NOT NULL,
  description       TEXT,
  category_id       UUID        REFERENCES bookmark_categories(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at  TIMESTAMPTZ,
  review_count      INTEGER     DEFAULT 0
);

-- Many-to-many: bookmarks ↔ tags (junction table)
CREATE TABLE bookmark_tag_links (
  bookmark_id  UUID  REFERENCES bookmark_bookmarks(id) ON DELETE CASCADE,
  tag_id       UUID  REFERENCES bookmark_tags(id)      ON DELETE CASCADE,
  PRIMARY KEY (bookmark_id, tag_id)
);

-- Indexes
CREATE INDEX idx_bm_bookmarks_category_id  ON bookmark_bookmarks(category_id);
CREATE INDEX idx_bm_bookmarks_reviewed     ON bookmark_bookmarks(last_reviewed_at NULLS FIRST);
CREATE INDEX idx_bm_tag_links_bookmark     ON bookmark_tag_links(bookmark_id);
CREATE INDEX idx_bm_tag_links_tag          ON bookmark_tag_links(tag_id);
CREATE INDEX idx_bm_categories_parent      ON bookmark_categories(parent_id);

-- ============================================================
-- Row Level Security (RLS)
-- Only authenticated users may read or write any row.
-- This is a single-user app so we don't scope rows per user —
-- any valid Supabase session passes the check.
-- ============================================================
ALTER TABLE bookmark_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_bookmarks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tag_links   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON bookmark_categories
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_all" ON bookmark_tags
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_all" ON bookmark_bookmarks
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_all" ON bookmark_tag_links
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- First-time setup: create your account
-- Run this once in the Supabase Auth dashboard (Authentication
-- → Users → Invite user), or use the SQL below to set a
-- password directly (replace the placeholder values):
--
--   SELECT auth.create_user(
--     email    := 'you@example.com',
--     password := 'your-secure-password'
--   );
-- ============================================================
