import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";

interface UserRow extends RowDataPacket {
  nome: string;
  cognome: string;
  cel: string | null;
  email: string;
  password_hash: string;
}

export interface UserRecord {
  nome: string;
  cognome: string;
  cel: string | null;
  email: string;
  passwordHash: string;
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
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT nome, cognome, cel, email, password_hash FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  const row = rows[0];
  if (!row) return null;
  return { nome: row.nome, cognome: row.cognome, cel: row.cel, email: row.email, passwordHash: row.password_hash };
}

export async function createUser(nome: string, cognome: string, cel: string | null, email: string, password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 10);
  await pool.execute(
    "INSERT INTO users (nome, cognome, cel, email, password_hash) VALUES (?, ?, ?, ?, ?)",
    [nome, cognome, cel, email, hash]
  );
}

export async function updateUser(email: string, nome: string, cognome: string, cel: string | null, newPassword?: string): Promise<void> {
  if (newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      "UPDATE users SET nome = ?, cognome = ?, cel = ?, password_hash = ? WHERE email = ?",
      [nome, cognome, cel, hash, email]
    );
  } else {
    await pool.execute(
      "UPDATE users SET nome = ?, cognome = ?, cel = ? WHERE email = ?",
      [nome, cognome, cel, email]
    );
  }
}
