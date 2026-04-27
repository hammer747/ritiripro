import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";

interface ClientRow extends RowDataPacket {
  id: string;
  nome: string;
  cognome: string;
  codice_fiscale: string;
  telefono: string | null;
  tipo_documento: string;
  numero_documento: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
}

export interface ClientRecord {
  id: string;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  telefono: string | null;
  tipoDocumento: string;
  numeroDocumento: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    nome: row.nome,
    cognome: row.cognome,
    codiceFiscale: row.codice_fiscale,
    telefono: row.telefono,
    tipoDocumento: row.tipo_documento,
    numeroDocumento: row.numero_documento,
    ownerEmail: row.owner_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function initClientsTable(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR(64) PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      cognome VARCHAR(120) NOT NULL,
      codice_fiscale VARCHAR(32) NOT NULL,
      telefono VARCHAR(32) NULL,
      tipo_documento VARCHAR(64) NOT NULL,
      numero_documento VARCHAR(128) NOT NULL,
      owner_email VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_client_cf (codice_fiscale, owner_email),
      INDEX idx_clients_owner (owner_email)
    )
  `);
}

export async function listClients(ownerEmail: string, search?: string): Promise<ClientRecord[]> {
  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    const [rows] = await pool.query<ClientRow[]>(
      `SELECT * FROM clients WHERE owner_email = ? AND (
        nome LIKE ? OR cognome LIKE ? OR codice_fiscale LIKE ? OR numero_documento LIKE ? OR telefono LIKE ?
      ) ORDER BY cognome ASC, nome ASC LIMIT 20`,
      [ownerEmail, q, q, q, q, q]
    );
    return rows.map(mapRow);
  }
  const [rows] = await pool.query<ClientRow[]>(
    "SELECT * FROM clients WHERE owner_email = ? ORDER BY updated_at DESC LIMIT 100",
    [ownerEmail]
  );
  return rows.map(mapRow);
}

export async function upsertClient(
  ownerEmail: string,
  nome: string,
  cognome: string,
  codiceFiscale: string,
  telefono: string | null,
  tipoDocumento: string,
  numeroDocumento: string
): Promise<void> {
  const id = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO clients (id, nome, cognome, codice_fiscale, telefono, tipo_documento, numero_documento, owner_email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       nome = VALUES(nome),
       cognome = VALUES(cognome),
       telefono = VALUES(telefono),
       tipo_documento = VALUES(tipo_documento),
       numero_documento = VALUES(numero_documento),
       updated_at = CURRENT_TIMESTAMP`,
    [id, nome, cognome, codiceFiscale, telefono, tipoDocumento, numeroDocumento, ownerEmail]
  );
}

export async function deleteClient(id: string, ownerEmail: string): Promise<boolean> {
  const [result] = await pool.execute(
    "DELETE FROM clients WHERE id = ? AND owner_email = ?",
    [id, ownerEmail]
  );
  return ((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
}
