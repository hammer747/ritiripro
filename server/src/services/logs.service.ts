import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";
function uuidv4(): string { return crypto.randomUUID(); }

interface LogRow extends RowDataPacket {
  id: string;
  user_email: string;
  user_name: string;
  user_role: string;
  action: string;
  ritiro_id: string | null;
  ritiro_codice: string | null;
  details: string | null;
  created_at: string;
}

export interface LogRecord {
  id: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  ritiroId: string | null;
  ritirodice: string | null;
  details: string | null;
  createdAt: string;
}

export async function initLogsTable(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id VARCHAR(64) PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_role VARCHAR(20) NOT NULL,
      action VARCHAR(64) NOT NULL,
      ritiro_id VARCHAR(64) NULL,
      ritiro_codice VARCHAR(50) NULL,
      details TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function createLog(
  userEmail: string,
  userName: string,
  userRole: string,
  action: string,
  ritiroId?: string,
  ritirodice?: string,
  details?: string
): Promise<void> {
  await pool.execute(
    "INSERT INTO activity_logs (id, user_email, user_name, user_role, action, ritiro_id, ritiro_codice, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [uuidv4(), userEmail, userName, userRole, action, ritiroId ?? null, ritirodice ?? null, details ?? null]
  );
}

export async function listLogs(adminEmail: string, limit = 100): Promise<LogRecord[]> {
  const [rows] = await pool.query<LogRow[]>(
    `SELECT l.* FROM activity_logs l
     INNER JOIN ritiri r ON r.id = l.ritiro_id
     WHERE r.owner_email = ?
     ORDER BY l.created_at DESC
     LIMIT ?`,
    [adminEmail, limit]
  );
  return rows.map((row) => ({
    id: row.id,
    userEmail: row.user_email,
    userName: row.user_name,
    userRole: row.user_role,
    action: row.action,
    ritiroId: row.ritiro_id,
    ritirodice: row.ritiro_codice,
    details: row.details,
    createdAt: row.created_at,
  }));
}
