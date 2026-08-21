import { db } from './db';
import { DAILY_LIMIT, WINDOW_MS } from './config';

export async function checkAndIncrementRateLimit(ipHash: string) {
  const now = Date.now();

  // Atomic update: only increment if under limit and within window
  const updateResult = await db.execute({
    sql: `UPDATE ip_usage 
          SET usage_count = usage_count + 1, last_used = ?
          WHERE ip_hash = ? AND usage_count < ? AND ? < (window_start + ?)`,
    args: [now, ipHash, DAILY_LIMIT, now, WINDOW_MS]
  });

  if (updateResult.rowsAffected === 0) {
    // Either doesn't exist, limit reached, or window expired
    const row = await db.execute({ sql: `SELECT * FROM ip_usage WHERE ip_hash = ?`, args: [ipHash] });
    
    if (row.rows.length === 0) {
      // Insert new
      await db.execute({
        sql: `INSERT INTO ip_usage (ip_hash, usage_count, window_start, last_used, created_at) VALUES (?, 1, ?, ?, ?)`,
        args: [ipHash, now, now, now]
      });
      return { used: 1, remaining: DAILY_LIMIT - 1, limit: DAILY_LIMIT, resetAt: new Date(now + WINDOW_MS).toISOString() };
    } else {
      const data = row.rows[0];
      const windowStart = data.window_start as number;
      
      if (now >= windowStart + WINDOW_MS) {
        // Window expired, reset
        await db.execute({
          sql: `UPDATE ip_usage SET usage_count = 1, window_start = ?, last_used = ? WHERE ip_hash = ?`,
          args: [now, now, ipHash]
        });
        return { used: 1, remaining: DAILY_LIMIT - 1, limit: DAILY_LIMIT, resetAt: new Date(now + WINDOW_MS).toISOString() };
      } else {
        // Limit reached
        return { used: DAILY_LIMIT, remaining: 0, limit: DAILY_LIMIT, resetAt: new Date(windowStart + WINDOW_MS).toISOString(), limitReached: true };
      }
    }
  }

  // Success, fetch updated data
  const finalRow = await db.execute({ sql: `SELECT * FROM ip_usage WHERE ip_hash = ?`, args: [ipHash] });
  const windowStart = finalRow.rows[0].window_start as number;
  const used = finalRow.rows[0].usage_count as number;
  
  return { used, remaining: DAILY_LIMIT - used, limit: DAILY_LIMIT, resetAt: new Date(windowStart + WINDOW_MS).toISOString() };
}

export async function getUsage(ipHash: string) {
  const now = Date.now();
  const row = await db.execute({ sql: `SELECT * FROM ip_usage WHERE ip_hash = ?`, args: [ipHash] });
  
  if (row.rows.length === 0) {
    return { used: 0, remaining: DAILY_LIMIT, limit: DAILY_LIMIT, resetAt: new Date(now + WINDOW_MS).toISOString() };
  }

  const data = row.rows[0];
  const windowStart = data.window_start as number;
  
  if (now >= windowStart + WINDOW_MS) {
    return { used: 0, remaining: DAILY_LIMIT, limit: DAILY_LIMIT, resetAt: new Date(now + WINDOW_MS).toISOString() };
  }

  return { 
    used: data.usage_count as number, 
    remaining: DAILY_LIMIT - (data.usage_count as number), 
    limit: DAILY_LIMIT, 
    resetAt: new Date(windowStart + WINDOW_MS).toISOString() 
  };
}
