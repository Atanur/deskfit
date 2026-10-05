-- One-time upgrade for a database created before the hardening release (D1: wrangler d1 execute deskfit --remote --file=migrations/0002_hardening.sql).
-- Fresh databases get all of this from schema.sql. The SQLite file adapter upgrades itself on start.
ALTER TABLE users ADD COLUMN nick_key TEXT;
UPDATE users SET nick_key = replace(replace(replace(replace(lower(nickname), 'i', 'l'), '1', 'l'), '0', 'o'), '-', '_') WHERE nick_key IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_nick_key ON users(nick_key);
CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, n INTEGER NOT NULL, reset_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS nonces (nonce TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
