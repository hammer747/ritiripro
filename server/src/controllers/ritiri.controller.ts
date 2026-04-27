import { Request, Response } from "express";
import "../middleware/auth.middleware"; // load AuthPayload type augmentation
import {
  createRitiro,
  deleteRitiroById,
  getRitiroById,
  listRitiri,
  updateRitiroById,
} from "../services/ritiri.service";
import { findUserByEmail } from "../services/users.service";
import { createLog } from "../services/logs.service";
import { SaveRitiroPayload, TipoArticolo, EditEntry } from "../types/ritiro";
import { upsertClient } from "../services/clients.service";

async function resolveUser(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  return {
    role: user.role,
    effectiveOwnerEmail: user.role === "admin" ? email : (user.parentAdminEmail ?? email),
    fullName: `${user.nome} ${user.cognome}`,
    email,
  };
}

function getOwnerEmail(req: Request): string | null {
  return req.auth?.email ?? null;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "on";
  }
  return false;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

function parseTipoArticolo(value: unknown): TipoArticolo | undefined {
  if (value === "smartphone" || value === "computer" || value === "console" || value === "camera" || value === "altro") {
    return value;
  }
  return undefined;
}

function buildPayload(req: Request, ownerEmail: string, extra?: { createdByName?: string | undefined; lastEditByName?: string | undefined }): { payload?: SaveRitiroPayload; error?: string } {
  const files = req.files as { documentoFronte?: Express.Multer.File[]; documentoRetro?: Express.Multer.File[]; ricevutaAcquisto?: Express.Multer.File[] } | undefined;

  const documentoFronte = files?.documentoFronte?.[0];
  const documentoRetro = files?.documentoRetro?.[0];
  const ricevutaAcquisto = files?.ricevutaAcquisto?.[0];

  const nomeCliente = toOptionalString(req.body.nomeCliente);
  const cognomeCliente = toOptionalString(req.body.cognomeCliente);
  const tipoDocumento = toOptionalString(req.body.tipoDocumento);
  const numeroDocumento = toOptionalString(req.body.numeroDocumento);
  const tipoArticolo = parseTipoArticolo(req.body.tipoArticolo);
  const prezzo = parseNumber(req.body.prezzo);
  const dataAcquisto = toOptionalString(req.body.dataAcquisto);

  if (!nomeCliente || !cognomeCliente || !tipoDocumento || !numeroDocumento || !tipoArticolo || prezzo === undefined || !dataAcquisto) {
    return { error: "Campi obbligatori mancanti: nomeCliente, cognomeCliente, tipoDocumento, numeroDocumento, tipoArticolo, prezzo, dataAcquisto" };
  }

  const venduto = parseBoolean(req.body.venduto);
  const prezzoVendita = parseNumber(req.body.prezzoVendita);
  const dataVendita = toOptionalString(req.body.dataVendita);
  const speseAggiuntive = (() => {
    const raw = req.body.speseAggiuntive;
    if (!raw) return null;
    try { return JSON.parse(String(raw)) as import("../types/ritiro").SpeseAggiuntiva[]; } catch { return null; }
  })();

  if (venduto && (prezzoVendita === undefined || !dataVendita)) {
    return { error: "Per articoli venduti sono obbligatori prezzoVendita e dataVendita" };
  }

  const payload: SaveRitiroPayload = {
    ownerEmail,
    nomeCliente,
    cognomeCliente,
    codiceFiscale: (toOptionalString(req.body.codiceFiscale) || "").toUpperCase(),
    telefonoCliente: toOptionalString(req.body.telefonoCliente) ?? null,
    tipoDocumento,
    numeroDocumento,
    documentoFrontePath: documentoFronte ? `/uploads/${documentoFronte.filename}` : toOptionalString(req.body.documentoFrontePath) ?? null,
    documentoFronteNome: documentoFronte ? documentoFronte.originalname : toOptionalString(req.body.documentoFronteNome) ?? null,
    documentoRetroPath: documentoRetro ? `/uploads/${documentoRetro.filename}` : toOptionalString(req.body.documentoRetroPath) ?? null,
    documentoRetroNome: documentoRetro ? documentoRetro.originalname : toOptionalString(req.body.documentoRetroNome) ?? null,
    ricevutaAcquistoPath: ricevutaAcquisto ? `/uploads/${ricevutaAcquisto.filename}` : toOptionalString(req.body.ricevutaAcquistoPath) ?? null,
    ricevutaAcquistoNome: ricevutaAcquisto ? ricevutaAcquisto.originalname : toOptionalString(req.body.ricevutaAcquistoNome) ?? null,
    tipoArticolo,
    marcaModello: toOptionalString(req.body.marcaModello) ?? null,
    serialeImei: toOptionalString(req.body.serialeImei) ?? null,
    articolo: toOptionalString(req.body.articolo) || "",
    descrizione: toOptionalString(req.body.descrizione) || "",
    prezzo,
    prezzoVendita: venduto ? (prezzoVendita ?? null) : null,
    venduto,
    dataVendita: venduto ? (dataVendita ?? null) : null,
    pinDispositivo: toOptionalString(req.body.pinDispositivo) ?? null,
    dataAcquisto,
    metodoPagamento: toOptionalString(req.body.metodoPagamento) ?? null,
    iban: toOptionalString(req.body.iban) ?? null,
    note: toOptionalString(req.body.note) || "",
    speseAggiuntive: speseAggiuntive && speseAggiuntive.length > 0 ? speseAggiuntive : null,
    createdByName: extra?.createdByName ?? null,
    lastEditByName: extra?.lastEditByName ?? null,
  };

  return { payload };
}

function buildChangeList(existing: import("../types/ritiro").RitiroRecord, payload: SaveRitiroPayload, editorName: string): string[] {
  const changes: string[] = [];
  const str = (v: string | null | undefined) => (v ?? "").trim();
  const num = (v: number | string | null | undefined) => Math.round(Number(v) * 100);

  if (num(existing.prezzo) !== num(payload.prezzo)) {
    changes.push(`Prezzo cambiato da €${Math.round(Number(existing.prezzo))} a €${Math.round(Number(payload.prezzo))}`);
  }
  if (existing.venduto !== payload.venduto) {
    changes.push(payload.venduto ? "Articolo marcato come venduto" : "Articolo rimarcato in stock");
  }
  if (str(existing.nomeCliente) !== str(payload.nomeCliente)) changes.push("Nome modificato");
  if (str(existing.cognomeCliente) !== str(payload.cognomeCliente)) changes.push("Cognome modificato");
  if (str(existing.codiceFiscale) !== str(payload.codiceFiscale)) changes.push("Codice fiscale modificato");
  if (str(existing.telefonoCliente) !== str(payload.telefonoCliente)) changes.push("Telefono modificato");
  if (str(existing.tipoDocumento) !== str(payload.tipoDocumento)) changes.push("Tipo documento modificato");
  if (str(existing.numeroDocumento) !== str(payload.numeroDocumento)) changes.push("Numero documento modificato");
  if (str(existing.tipoArticolo) !== str(payload.tipoArticolo)) changes.push("Tipo articolo modificato");
  if (str(existing.documentoFrontePath) !== str(payload.documentoFrontePath)) changes.push("Foto fronte documento modificata");
  if (str(existing.documentoRetroPath) !== str(payload.documentoRetroPath)) changes.push("Foto retro documento modificata");
  if (str(existing.marcaModello) !== str(payload.marcaModello)) changes.push("Marca/Modello modificato");
  if (str(existing.serialeImei) !== str(payload.serialeImei)) changes.push("Seriale modificato");
  if (str(existing.pinDispositivo) !== str(payload.pinDispositivo)) changes.push("PIN modificato");
  if (str(existing.articolo) !== str(payload.articolo)) changes.push("Articolo modificato");
  if (str(existing.descrizione) !== str(payload.descrizione)) changes.push("Descrizione modificata");
  if (str(existing.note) !== str(payload.note)) changes.push("Note modificate");
  if (str(existing.dataAcquisto) !== str(payload.dataAcquisto)) changes.push("Data acquisto modificata");
  if (num(existing.prezzoVendita) !== num(payload.prezzoVendita)) changes.push("Prezzo di vendita modificato");
  if (str(existing.metodoPagamento) !== str(payload.metodoPagamento)) {
    const da = existing.metodoPagamento?.trim() || "non specificato";
    const a = payload.metodoPagamento?.trim() || "non specificato";
    changes.push(`Tipo pagamento modificato da ${da} a ${a}`);
  }
  if (str(existing.iban) !== str(payload.iban)) changes.push("IBAN modificato");

  const existingSpese = existing.speseAggiuntive ?? [];
  const newSpese = payload.speseAggiuntive ?? [];
  for (const spesa of newSpese) {
    if (spesa.mode !== "manuale") continue;
    const found = existingSpese.some(
      (e) => e.mode === "manuale" && e.descrizione === spesa.descrizione && num(e.prezzo) === num(spesa.prezzo)
    );
    if (!found) changes.push(`${editorName} ha aggiunto: ${spesa.descrizione} ${Math.round(Number(spesa.prezzo))}€`);
  }
  for (const spesa of existingSpese) {
    if (spesa.mode !== "manuale") continue;
    const found = newSpese.some(
      (e) => e.mode === "manuale" && e.descrizione === spesa.descrizione && num(e.prezzo) === num(spesa.prezzo)
    );
    if (!found) changes.push(`${editorName} ha rimosso: ${spesa.descrizione} ${Math.round(Number(spesa.prezzo))}€`);
  }

  return changes.length > 0 ? changes : ["Modifica effettuata"];
}

function formatCodice(numeroRitiro: number, dataAcquisto: string): string {
  const d = new Date(dataAcquisto);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const nn = String(numeroRitiro).padStart(2, "0");
  return `${dd}${mm}${yy}-${nn}`;
}

export async function getAllRitiriController(req: Request, res: Response): Promise<void> {
  const email = getOwnerEmail(req);
  if (!email) { res.status(401).json({ message: "Login richiesto" }); return; }
  const resolved = await resolveUser(email);
  if (!resolved) { res.status(401).json({ message: "Utente non trovato" }); return; }
  const ritiri = await listRitiri(resolved.effectiveOwnerEmail);
  res.json(ritiri);
}

export async function getRitiroByIdController(req: Request, res: Response): Promise<void> {
  const email = getOwnerEmail(req);
  if (!email) { res.status(401).json({ message: "Login richiesto" }); return; }
  const resolved = await resolveUser(email);
  if (!resolved) { res.status(401).json({ message: "Utente non trovato" }); return; }
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) { res.status(400).json({ message: "ID non valido" }); return; }
  const ritiro = await getRitiroById(id, resolved.effectiveOwnerEmail);
  if (!ritiro) { res.status(404).json({ message: "Ritiro non trovato" }); return; }
  res.json(ritiro);
}

export async function createRitiroController(req: Request, res: Response): Promise<void> {
  const email = getOwnerEmail(req);
  if (!email) { res.status(401).json({ message: "Login richiesto" }); return; }
  const resolved = await resolveUser(email);
  if (!resolved) { res.status(401).json({ message: "Utente non trovato" }); return; }

  const createdByName: string = resolved.fullName;
  const { payload, error } = buildPayload(req, resolved.effectiveOwnerEmail, { createdByName });
  if (!payload) { res.status(400).json({ message: error || "Payload non valido" }); return; }

  const id = crypto.randomUUID();
  await createRitiro(payload, id);
  await upsertClient(resolved.effectiveOwnerEmail, payload.nomeCliente, payload.cognomeCliente, payload.codiceFiscale, payload.telefonoCliente, payload.tipoDocumento, payload.numeroDocumento).catch(() => {});
  const created = await getRitiroById(id, resolved.effectiveOwnerEmail);
  res.status(201).json(created);
}

export async function updateRitiroController(req: Request, res: Response): Promise<void> {
  const email = getOwnerEmail(req);
  if (!email) { res.status(401).json({ message: "Login richiesto" }); return; }
  const resolved = await resolveUser(email);
  if (!resolved) { res.status(401).json({ message: "Utente non trovato" }); return; }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) { res.status(400).json({ message: "ID non valido" }); return; }
  const existing = await getRitiroById(id, resolved.effectiveOwnerEmail);
  if (!existing) { res.status(404).json({ message: "Ritiro non trovato" }); return; }

  const lastEditByName: string = resolved.fullName;
  const { payload, error } = buildPayload(req, resolved.effectiveOwnerEmail, { lastEditByName });
  if (!payload) { res.status(400).json({ message: error || "Payload non valido" }); return; }

  const files = req.files as { documentoFronte?: Express.Multer.File[]; documentoRetro?: Express.Multer.File[]; ricevutaAcquisto?: Express.Multer.File[] } | undefined;
  if (!files?.documentoFronte?.[0]) { payload.documentoFrontePath = existing.documentoFrontePath ?? null; payload.documentoFronteNome = existing.documentoFronteNome ?? null; }
  if (!files?.documentoRetro?.[0]) { payload.documentoRetroPath = existing.documentoRetroPath ?? null; payload.documentoRetroNome = existing.documentoRetroNome ?? null; }
  if (!files?.ricevutaAcquisto?.[0]) { payload.ricevutaAcquistoPath = existing.ricevutaAcquistoPath ?? null; payload.ricevutaAcquistoNome = existing.ricevutaAcquistoNome ?? null; }

  const changeDetails = buildChangeList(existing, payload, lastEditByName);
  const newEntry: EditEntry = { name: lastEditByName, at: new Date().toISOString(), details: changeDetails };
  const existingHistory: EditEntry[] = Array.isArray(existing.lastEditDetails) ? existing.lastEditDetails : [];
  payload.lastEditDetails = [...existingHistory, newEntry];

  const updated = await updateRitiroById(id, payload);
  if (!updated) { res.status(404).json({ message: "Ritiro non trovato" }); return; }

  const record = await getRitiroById(id, resolved.effectiveOwnerEmail);
  if (record) {
    const codice = formatCodice(record.numeroRitiro, record.dataAcquisto);
    await createLog(email, resolved.fullName, resolved.role, "modifica", id, codice, `Modificato da ${resolved.fullName}`);
  }
  res.json(record);
}

export async function deleteRitiroController(req: Request, res: Response): Promise<void> {
  const email = getOwnerEmail(req);
  if (!email) { res.status(401).json({ message: "Login richiesto" }); return; }
  const resolved = await resolveUser(email);
  if (!resolved) { res.status(401).json({ message: "Utente non trovato" }); return; }
  if (resolved.role !== "admin") { res.status(403).json({ message: "Solo gli amministratori possono eliminare ritiri." }); return; }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) { res.status(400).json({ message: "ID non valido" }); return; }
  const deleted = await deleteRitiroById(id, resolved.effectiveOwnerEmail);
  if (!deleted) { res.status(404).json({ message: "Ritiro non trovato" }); return; }
  res.status(204).send();
}
