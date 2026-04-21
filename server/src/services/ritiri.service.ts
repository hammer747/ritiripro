import fs from "fs";
import path from "path";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { env } from "../config/env";
import { RitiroRecord, SaveRitiroPayload } from "../types/ritiro";

interface RitiroRow extends RowDataPacket {
  last_edit_details: string | null;
  id: string;
  numero_ritiro: number;
  nome_cliente: string;
  cognome_cliente: string;
  codice_fiscale: string;
  telefono_cliente: string | null;
  tipo_documento: string;
  numero_documento: string;
  documento_fronte_path: string | null;
  documento_fronte_nome: string | null;
  documento_retro_path: string | null;
  documento_retro_nome: string | null;
  ricevuta_acquisto_path: string | null;
  ricevuta_acquisto_nome: string | null;
  tipo_articolo: "smartphone" | "computer" | "console" | "camera" | "altro";
  marca_modello: string | null;
  seriale_imei: string | null;
  articolo: string;
  descrizione: string;
  prezzo: number;
  prezzo_vendita: number | null;
  venduto: number;
  data_vendita: string | null;
  pin_dispositivo: string | null;
  data_acquisto: string;
  note: string;
  spese_aggiuntive: string | null;
  owner_email: string;
  created_by_name: string | null;
  last_edit_by_name: string | null;
  last_edit_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: RitiroRow): RitiroRecord {
  return {
    id: row.id,
    numeroRitiro: row.numero_ritiro,
    nomeCliente: row.nome_cliente,
    cognomeCliente: row.cognome_cliente,
    codiceFiscale: row.codice_fiscale,
    telefonoCliente: row.telefono_cliente,
    tipoDocumento: row.tipo_documento,
    numeroDocumento: row.numero_documento,
    documentoFrontePath: row.documento_fronte_path,
    documentoFronteNome: row.documento_fronte_nome,
    documentoRetroPath: row.documento_retro_path,
    documentoRetroNome: row.documento_retro_nome,
    ricevutaAcquistoPath: row.ricevuta_acquisto_path,
    ricevutaAcquistoNome: row.ricevuta_acquisto_nome,
    tipoArticolo: row.tipo_articolo,
    marcaModello: row.marca_modello,
    serialeImei: row.seriale_imei,
    articolo: row.articolo,
    descrizione: row.descrizione,
    prezzo: Number(row.prezzo),
    prezzoVendita: row.prezzo_vendita !== null ? Number(row.prezzo_vendita) : null,
    venduto: !!row.venduto,
    dataVendita: row.data_vendita,
    pinDispositivo: row.pin_dispositivo,
    dataAcquisto: row.data_acquisto,
    note: row.note,
    speseAggiuntive: row.spese_aggiuntive ? (() => { try { return JSON.parse(row.spese_aggiuntive as string); } catch { return null; } })() : null,
    ownerEmail: row.owner_email,
    createdByName: row.created_by_name ?? null,
    lastEditByName: row.last_edit_by_name ?? null,
    lastEditAt: row.last_edit_at ?? null,
    lastEditDetails: row.last_edit_details ? (() => { try { return JSON.parse(row.last_edit_details as string) as string[]; } catch { return null; } })() : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function initRitiriTable(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ritiri (
      id VARCHAR(64) PRIMARY KEY,
      nome_cliente VARCHAR(120) NOT NULL,
      cognome_cliente VARCHAR(120) NOT NULL,
      codice_fiscale VARCHAR(32) NOT NULL,
      telefono_cliente VARCHAR(32) NULL,
      tipo_documento VARCHAR(64) NOT NULL,
      numero_documento VARCHAR(128) NOT NULL,
      documento_fronte_path VARCHAR(255) NULL,
      documento_fronte_nome VARCHAR(255) NULL,
      documento_retro_path VARCHAR(255) NULL,
      documento_retro_nome VARCHAR(255) NULL,
      ricevuta_acquisto_path VARCHAR(255) NULL,
      ricevuta_acquisto_nome VARCHAR(255) NULL,
      tipo_articolo ENUM('smartphone','computer','console','camera','altro') NOT NULL,
      marca_modello VARCHAR(255) NULL,
      seriale_imei VARCHAR(255) NULL,
      articolo VARCHAR(255) NOT NULL,
      descrizione TEXT NOT NULL,
      prezzo DECIMAL(10,2) NOT NULL,
      prezzo_vendita DECIMAL(10,2) NULL,
      venduto TINYINT(1) NOT NULL DEFAULT 0,
      data_vendita DATE NULL,
      pin_dispositivo VARCHAR(64) NULL,
      data_acquisto DATE NOT NULL,
      note TEXT NOT NULL,
      owner_email VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ritiri_owner_email (owner_email)
    )
  `);

  await pool.execute(`
    ALTER TABLE ritiri
    ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255) NOT NULL DEFAULT 'legacy@local',
    ADD INDEX IF NOT EXISTS idx_ritiri_owner_email (owner_email)
  `);

  await pool.execute(`
    ALTER TABLE ritiri
    ADD COLUMN IF NOT EXISTS numero_ritiro INT UNSIGNED NOT NULL DEFAULT 0
  `);

  await pool.execute(`
    ALTER TABLE ritiri
    ADD COLUMN IF NOT EXISTS spese_aggiuntive TEXT NULL
  `);

  await pool.execute(`ALTER TABLE ritiri ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255) NULL`);
  await pool.execute(`ALTER TABLE ritiri ADD COLUMN IF NOT EXISTS last_edit_by_name VARCHAR(255) NULL`);
  await pool.execute(`ALTER TABLE ritiri ADD COLUMN IF NOT EXISTS last_edit_at DATETIME NULL`);
  await pool.execute(`ALTER TABLE ritiri ADD COLUMN IF NOT EXISTS last_edit_details TEXT NULL`);
}

export async function listRitiri(ownerEmail: string): Promise<RitiroRecord[]> {
  const [rows] = await pool.query<RitiroRow[]>(
    "SELECT * FROM ritiri WHERE owner_email = ? ORDER BY data_acquisto DESC, created_at DESC",
    [ownerEmail]
  );
  return rows.map(mapRow);
}

export async function getRitiroById(id: string, ownerEmail: string): Promise<RitiroRecord | null> {
  const [rows] = await pool.query<RitiroRow[]>(
    "SELECT * FROM ritiri WHERE id = ? AND owner_email = ? LIMIT 1",
    [id, ownerEmail]
  );
  if (rows.length === 0) return null;
  const firstRow = rows[0];
  if (!firstRow) return null;
  return mapRow(firstRow);
}

export async function createRitiro(payload: SaveRitiroPayload, id: string): Promise<void> {
  interface NextNumRow extends RowDataPacket { next_num: number; }
  const [numRows] = await pool.query<NextNumRow[]>(
    "SELECT COALESCE(MAX(numero_ritiro), 0) + 1 AS next_num FROM ritiri WHERE owner_email = ?",
    [payload.ownerEmail]
  );
  const numeroRitiro = numRows[0]?.next_num ?? 1;

  await pool.execute(
    `INSERT INTO ritiri (
      id, numero_ritiro, nome_cliente, cognome_cliente, codice_fiscale, telefono_cliente, tipo_documento, numero_documento,
      documento_fronte_path, documento_fronte_nome, documento_retro_path, documento_retro_nome,
      ricevuta_acquisto_path, ricevuta_acquisto_nome, tipo_articolo, marca_modello, seriale_imei,
      articolo, descrizione, prezzo, prezzo_vendita, venduto, data_vendita, pin_dispositivo, data_acquisto, note,
      spese_aggiuntive, owner_email, created_by_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      numeroRitiro,
      payload.nomeCliente,
      payload.cognomeCliente,
      payload.codiceFiscale,
      payload.telefonoCliente ?? null,
      payload.tipoDocumento,
      payload.numeroDocumento,
      payload.documentoFrontePath ?? null,
      payload.documentoFronteNome ?? null,
      payload.documentoRetroPath ?? null,
      payload.documentoRetroNome ?? null,
      payload.ricevutaAcquistoPath ?? null,
      payload.ricevutaAcquistoNome ?? null,
      payload.tipoArticolo,
      payload.marcaModello ?? null,
      payload.serialeImei ?? null,
      payload.articolo,
      payload.descrizione,
      payload.prezzo,
      payload.prezzoVendita ?? null,
      payload.venduto ? 1 : 0,
      payload.dataVendita ?? null,
      payload.pinDispositivo ?? null,
      payload.dataAcquisto,
      payload.note,
      payload.speseAggiuntive ? JSON.stringify(payload.speseAggiuntive) : null,
      payload.ownerEmail,
      payload.createdByName ?? null,
    ]
  );
}

export async function updateRitiroById(id: string, payload: SaveRitiroPayload): Promise<boolean> {
  const [result] = await pool.execute(
    `UPDATE ritiri SET
      nome_cliente = ?,
      cognome_cliente = ?,
      codice_fiscale = ?,
      telefono_cliente = ?,
      tipo_documento = ?,
      numero_documento = ?,
      documento_fronte_path = ?,
      documento_fronte_nome = ?,
      documento_retro_path = ?,
      documento_retro_nome = ?,
      ricevuta_acquisto_path = ?,
      ricevuta_acquisto_nome = ?,
      tipo_articolo = ?,
      marca_modello = ?,
      seriale_imei = ?,
      articolo = ?,
      descrizione = ?,
      prezzo = ?,
      prezzo_vendita = ?,
      venduto = ?,
      data_vendita = ?,
      pin_dispositivo = ?,
      data_acquisto = ?,
      note = ?,
      spese_aggiuntive = ?,
      last_edit_by_name = CASE WHEN ? IS NOT NULL THEN ? ELSE last_edit_by_name END,
      last_edit_at = CASE WHEN ? IS NOT NULL THEN NOW() ELSE last_edit_at END,
      last_edit_details = CASE WHEN ? IS NOT NULL THEN ? ELSE last_edit_details END
    WHERE id = ? AND owner_email = ?`,
    [
      payload.nomeCliente,
      payload.cognomeCliente,
      payload.codiceFiscale,
      payload.telefonoCliente ?? null,
      payload.tipoDocumento,
      payload.numeroDocumento,
      payload.documentoFrontePath ?? null,
      payload.documentoFronteNome ?? null,
      payload.documentoRetroPath ?? null,
      payload.documentoRetroNome ?? null,
      payload.ricevutaAcquistoPath ?? null,
      payload.ricevutaAcquistoNome ?? null,
      payload.tipoArticolo,
      payload.marcaModello ?? null,
      payload.serialeImei ?? null,
      payload.articolo,
      payload.descrizione,
      payload.prezzo,
      payload.prezzoVendita ?? null,
      payload.venduto ? 1 : 0,
      payload.dataVendita ?? null,
      payload.pinDispositivo ?? null,
      payload.dataAcquisto,
      payload.note,
      payload.speseAggiuntive ? JSON.stringify(payload.speseAggiuntive) : null,
      payload.lastEditByName ?? null,
      payload.lastEditByName ?? null,
      payload.lastEditByName ?? null,
      payload.lastEditByName ?? null,
      payload.lastEditDetails ? JSON.stringify(payload.lastEditDetails) : null,
      id,
      payload.ownerEmail,
    ]
  );

  const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
  return affectedRows > 0;
}

export async function deleteRitiroById(id: string, ownerEmail: string): Promise<boolean> {
  const record = await getRitiroById(id, ownerEmail);
  if (!record) return false;

  const [result] = await pool.execute("DELETE FROM ritiri WHERE id = ? AND owner_email = ?", [id, ownerEmail]);
  const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
  if (!affectedRows) return false;

  const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
  const filePaths = [record.documentoFrontePath, record.documentoRetroPath, record.ricevutaAcquistoPath];
  for (const filePath of filePaths) {
    if (!filePath) continue;
    const abs = path.join(uploadRoot, path.basename(filePath));
    fs.unlink(abs, () => void 0);
  }

  return true;
}
