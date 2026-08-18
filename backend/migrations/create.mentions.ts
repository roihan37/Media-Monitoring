import pool from "../config/connection";

const query = `
CREATE TABLE IF NOT EXISTS mentions (
    id UUID PRIMARY KEY,

    external_id TEXT NOT NULL,

    source TEXT NOT NULL,
    source_key TEXT NOT NULL,

    title TEXT,
    content TEXT,
    url TEXT,
    author TEXT,

    published_at TIMESTAMPTZ,

    engagement INTEGER NOT NULL DEFAULT 0,

    dedupe_key TEXT NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentions_source_key
    ON mentions(source_key);

CREATE INDEX IF NOT EXISTS idx_mentions_published_at
    ON mentions(published_at);

CREATE INDEX IF NOT EXISTS idx_mentions_external_id
    ON mentions(external_id);

CREATE INDEX IF NOT EXISTS idx_mentions_url
    ON mentions(url);
`;

/**
 
 dedupe_key for deduplication
 
 source is value that will be displayed
 source_key = Untuk comparison/filtering.

 Index is being created for finding queries faster
 
 */

async function migrate(): Promise<void> {
  try {
    await pool.query(query);

    console.log(
      "Migration completed successfully."
    );
  } catch (error) {
    console.error(
      "Migration failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();