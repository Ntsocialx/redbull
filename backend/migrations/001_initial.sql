CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_sessions_active_idx ON admin_sessions (admin_id, expires_at)
  WHERE revoked_at IS NULL;

INSERT INTO campuses (name, slug) VALUES
  ('TUT Soshanguve South', 'soshanguve-south'),
  ('TUT Soshanguve North', 'soshanguve-north'),
  ('Ga-Rankuwa Campus', 'ga-rankuwa'),
  ('Pretoria Main Campus', 'pretoria-main'),
  ('Arcadia Campus', 'arcadia')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  poster_url TEXT,
  cloudinary_public_id TEXT,
  campus_id UUID NOT NULL REFERENCES campuses(id),
  venue TEXT NOT NULL,
  category TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
  organizer_name TEXT,
  organizer_contact TEXT,
  registration_url TEXT,
  external_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'archived')),
  created_by UUID REFERENCES admins(id),
  updated_by UUID REFERENCES admins(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT events_valid_window CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS events_public_start_idx ON events (start_at) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS events_campus_start_idx ON events (campus_id, start_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS events_category_start_idx ON events (category, start_at) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS events_status_updated_idx ON events (status, updated_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  campus_id UUID REFERENCES campuses(id),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  external_url TEXT,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES admins(id),
  updated_by UUID REFERENCES admins(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT announcements_valid_window CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS announcements_active_idx ON announcements (priority, published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
