import { Request, Response } from "express";
import {
  createRitiro,
  deleteRitiroById,
  getRitiroById,
  listRitiri,
  updateRitiroById,
} from "../services/ritiri.service";
import { SaveRitiroPayload, TipoArticolo } from "../types/ritiro";

function getOwnerEmail(req: Request): string | null {
  const value = req.header("x-user-email");
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
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
  if (
    value === "smartphone" ||
    value === "computer" ||
    value === "console" ||
    value === "camera" ||
    value === "altro"
  ) {
    return value;
  }
  return undefined;
}

function buildPayload(req: Request, ownerEmail: string): { payload?: SaveRitiroPayload; error?: string } {
  const files = req.files as
    | {
        documentoFronte?: Express.Multer.File[];
        documentoRetro?: Express.Multer.File[];
        ricevutaAcquisto?: Express.Multer.File[];
      }
    | undefined;

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
    return {
      error:
        "Campi obbligatori mancanti: nomeCliente, cognomeCliente, tipoDocumento, numeroDocumento, tipoArticolo, prezzo, dataAcquisto",
    };
  }

  const venduto = parseBoolean(req.body.venduto);
  const prezzoVendita = parseNumber(req.body.prezzoVendita);
  const dataVendita = toOptionalString(req.body.dataVendita);

  if (venduto && (prezzoVendita === undefined || !dataVendita)) {
    return {
      error: "Per articoli venduti sono obbligatori prezzoVendita e dataVendita",
    };
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
    note: toOptionalString(req.body.note) || "",
  };

  return { payload };
}

export async function getAllRitiriController(req: Request, res: Response): Promise<void> {
  const ownerEmail = getOwnerEmail(req);
  if (!ownerEmail) {
    res.status(401).json({ message: "Login richiesto" });
    return;
  }

  const ritiri = await listRitiri(ownerEmail);
  res.json(ritiri);
}

export async function getRitiroByIdController(req: Request, res: Response): Promise<void> {
  const ownerEmail = getOwnerEmail(req);
  if (!ownerEmail) {
    res.status(401).json({ message: "Login richiesto" });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ message: "ID non valido" });
    return;
  }
  const ritiro = await getRitiroById(id, ownerEmail);
  if (!ritiro) {
    res.status(404).json({ message: "Ritiro non trovato" });
    return;
  }
  res.json(ritiro);
}

export async function createRitiroController(req: Request, res: Response): Promise<void> {
  const ownerEmail = getOwnerEmail(req);
  if (!ownerEmail) {
    res.status(401).json({ message: "Login richiesto" });
    return;
  }

  const { payload, error } = buildPayload(req, ownerEmail);
  if (!payload) {
    res.status(400).json({ message: error || "Payload non valido" });
    return;
  }

  const id = crypto.randomUUID();
  await createRitiro(payload, id);
  const created = await getRitiroById(id, ownerEmail);
  res.status(201).json(created);
}

export async function updateRitiroController(req: Request, res: Response): Promise<void> {
  const ownerEmail = getOwnerEmail(req);
  if (!ownerEmail) {
    res.status(401).json({ message: "Login richiesto" });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ message: "ID non valido" });
    return;
  }
  const existing = await getRitiroById(id, ownerEmail);
  if (!existing) {
    res.status(404).json({ message: "Ritiro non trovato" });
    return;
  }

  const { payload, error } = buildPayload(req, ownerEmail);
  if (!payload) {
    res.status(400).json({ message: error || "Payload non valido" });
    return;
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    payload.documentoFrontePath = payload.documentoFrontePath ?? existing.documentoFrontePath ?? null;
    payload.documentoFronteNome = payload.documentoFronteNome ?? existing.documentoFronteNome ?? null;
    payload.documentoRetroPath = payload.documentoRetroPath ?? existing.documentoRetroPath ?? null;
    payload.documentoRetroNome = payload.documentoRetroNome ?? existing.documentoRetroNome ?? null;
    payload.ricevutaAcquistoPath = payload.ricevutaAcquistoPath ?? existing.ricevutaAcquistoPath ?? null;
    payload.ricevutaAcquistoNome = payload.ricevutaAcquistoNome ?? existing.ricevutaAcquistoNome ?? null;
  }

  const updated = await updateRitiroById(id, payload);
  if (!updated) {
    res.status(404).json({ message: "Ritiro non trovato" });
    return;
  }

  const record = await getRitiroById(id, ownerEmail);
  res.json(record);
}

export async function deleteRitiroController(req: Request, res: Response): Promise<void> {
  const ownerEmail = getOwnerEmail(req);
  if (!ownerEmail) {
    res.status(401).json({ message: "Login richiesto" });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ message: "ID non valido" });
    return;
  }
  const deleted = await deleteRitiroById(id, ownerEmail);
  if (!deleted) {
    res.status(404).json({ message: "Ritiro non trovato" });
    return;
  }
  res.status(204).send();
}
