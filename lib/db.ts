import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let initialized = false;

export async function ensureDbInitialized() {
  if (initialized) return;
  
  try {
    // Buat tabel ip_usage jika belum ada
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ip_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_hash TEXT NOT NULL,
        usage_count INTEGER NOT NULL DEFAULT 0,
        window_start INTEGER NOT NULL,
        last_used INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    
    // Buat index unik jika belum ada
    await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_ip_usage_hash ON ip_usage(ip_hash);`);
    
    // Buat tabel download_logs jika belum ada
    await db.execute(`
      CREATE TABLE IF NOT EXISTS download_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_hash TEXT NOT NULL,
        platform TEXT NOT NULL,
        url TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    
    initialized = true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
