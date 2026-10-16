CREATE TABLE IF NOT EXISTS upload_intents (
  public_id TEXT PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES admin_sessions(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS upload_intents_expiry_idx ON upload_intents (expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS events_cloudinary_public_id_unique_idx ON events (cloudinary_public_id)
  WHERE cloudinary_public_id IS NOT NULL;
