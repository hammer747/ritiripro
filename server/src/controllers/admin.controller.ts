import { Request, Response } from "express";
import { findUserByEmail, createUser, deleteUserByEmail, listSubUsers, UserRole } from "../services/users.service";
import { listLogs } from "../services/logs.service";
import "../middleware/auth.middleware";

function requireAdmin(req: Request, res: Response): string | null {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ message: "Login richiesto." }); return null; }
  if (auth.role !== "admin") { res.status(403).json({ message: "Accesso riservato agli amministratori." }); return null; }
  return auth.email;
}

export async function listUsersController(req: Request, res: Response): Promise<void> {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  const users = await listSubUsers(adminEmail);
  res.json(users);
}

export async function createUserController(req: Request, res: Response): Promise<void> {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const { nome, cognome, cel, email, password, role } = req.body as Record<string, string>;
  if (!nome?.trim() || !cognome?.trim() || !email?.trim() || !password?.trim() || !role) {
    res.status(400).json({ message: "Campi obbligatori mancanti." });
    return;
  }
  if (role !== "venditore" && role !== "tecnico") {
    res.status(400).json({ message: "Ruolo non valido. Usa venditore o tecnico." });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    res.status(409).json({ message: "Esiste già un account con questa email." });
    return;
  }
  await createUser(nome.trim(), cognome.trim(), cel?.trim() || null, normalizedEmail, password, role as UserRole, adminEmail);
  res.status(201).json({ nome: nome.trim(), cognome: cognome.trim(), email: normalizedEmail, role });
}

export async function deleteUserController(req: Request, res: Response): Promise<void> {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const rawEmail = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
  const targetEmail = (rawEmail ?? "").trim().toLowerCase();
  if (!targetEmail) { res.status(400).json({ message: "Email non valida." }); return; }

  const target = await findUserByEmail(targetEmail);
  if (!target || target.parentAdminEmail !== adminEmail) {
    res.status(404).json({ message: "Utente non trovato." });
    return;
  }

  const deleted = await deleteUserByEmail(targetEmail);
  if (!deleted) { res.status(404).json({ message: "Utente non trovato o non eliminabile." }); return; }
  res.status(204).send();
}

export async function listLogsController(req: Request, res: Response): Promise<void> {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  const logs = await listLogs(adminEmail);
  res.json(logs);
}
