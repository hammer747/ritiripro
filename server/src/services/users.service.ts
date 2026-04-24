import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";

export type UserRole = "admin" | "venditore";

interface UserRow extends RowDataPacket {
  nome: string;
  cognome: string;
  cel: string | null;
  email: string;
  password_hash: string;
  role: UserRole;
  parent_admin_email: string | null;
  ditta: string | null;
  indirizzo: string | null;
  piva: string | null;
  allow_registration: number;
}

export interface UserRecord {
  nome: string;
  cognome: string;
  cel: string | null;
  email: string;
  passwordHash: string;
  role: UserRole;
  parentAdminEmail: string | null;
  ditta: string | null;
  indirizzo: string | null;
  piva: string | null;
  allowRegistration: boolean;
}

export async function initUsersTable(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      cognome VARCHAR(120) NOT NULL,
      cel VARCHAR(32) NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','venditore') NOT NULL DEFAULT 'admin',
      parent_admin_email VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('admin','venditore') NOT NULL DEFAULT 'admin'`);
  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_admin_email VARCHAR(255) NULL`);
  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ditta VARCHAR(255) NULL`);
  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS indirizzo VARCHAR(255) NULL`);
  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS piva VARCHAR(64) NULL`);
  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_registration TINYINT(1) NOT NULL DEFAULT 1`);
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT nome, cognome, cel, email, password_hash, role, parent_admin_email, ditta, indirizzo, piva, allow_registration FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    nome: row.nome,
    cognome: row.cognome,
    cel: row.cel,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role ?? "admin",
    parentAdminEmail: row.parent_admin_email ?? null,
    ditta: row.ditta ?? null,
    indirizzo: row.indirizzo ?? null,
    piva: row.piva ?? null,
    allowRegistration: row.allow_registration !== 0,
  };
}

export async function isRegistrationEnabled(): Promise<boolean> {
  interface CountRow extends RowDataPacket { cnt: number }
  const [rows] = await pool.query<CountRow[]>("SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'");
  const total = rows[0]?.cnt ?? 0;
  if (total === 0) return true;
  const [enabled] = await pool.query<CountRow[]>("SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin' AND allow_registration = 1");
  return (enabled[0]?.cnt ?? 0) > 0;
}

export async function createUser(
  nome: string,
  cognome: string,
  cel: string | null,
  email: string,
  password: string,
  role: UserRole = "admin",
  parentAdminEmail: string | null = null
): Promise<void> {
  const hash = await bcrypt.hash(password, 10);
  await pool.execute(
    "INSERT INTO users (nome, cognome, cel, email, password_hash, role, parent_admin_email) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [nome, cognome, cel, email, hash, role, parentAdminEmail]
  );
}

export async function updateUser(
  email: string,
  nome: string,
  cognome: string,
  cel: string | null,
  newPassword?: string,
  ditta?: string | null,
  indirizzo?: string | null,
  piva?: string | null,
  allowRegistration?: boolean,
): Promise<void> {
  const ar = allowRegistration === false ? 0 : 1;
  if (newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      "UPDATE users SET nome = ?, cognome = ?, cel = ?, password_hash = ?, ditta = ?, indirizzo = ?, piva = ?, allow_registration = ? WHERE email = ?",
      [nome, cognome, cel, hash, ditta ?? null, indirizzo ?? null, piva ?? null, ar, email]
    );
  } else {
    await pool.execute(
      "UPDATE users SET nome = ?, cognome = ?, cel = ?, ditta = ?, indirizzo = ?, piva = ?, allow_registration = ? WHERE email = ?",
      [nome, cognome, cel, ditta ?? null, indirizzo ?? null, piva ?? null, ar, email]
    );
  }
}

export async function listSubUsers(adminEmail: string): Promise<Omit<UserRecord, "passwordHash">[]> {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT nome, cognome, cel, email, role, parent_admin_email FROM users WHERE parent_admin_email = ? ORDER BY created_at ASC",
    [adminEmail]
  );
  return rows.map((row) => ({
    nome: row.nome,
    cognome: row.cognome,
    cel: row.cel,
    email: row.email,
    role: row.role,
    parentAdminEmail: row.parent_admin_email ?? null,
    ditta: row.ditta ?? null,
    indirizzo: row.indirizzo ?? null,
    piva: row.piva ?? null,
    allowRegistration: row.allow_registration !== 0,
  }));
}

export async function deleteUserByEmail(email: string): Promise<boolean> {
  const [result] = await pool.execute("DELETE FROM users WHERE email = ? AND role != 'admin'", [email]);
  return ((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
}
