import { Request, Response } from "express";
import { listClients, upsertClient, deleteClient } from "../services/clients.service";
import { findUserByEmail } from "../services/users.service";
import "../middleware/auth.middleware";

async function resolveOwner(req: Request, res: Response): Promise<string | null> {
  const email = req.auth?.email ?? null;
  if (!email) { res.status(401).json({ message: "Login richiesto." }); return null; }
  const user = await findUserByEmail(email);
  if (!user) { res.status(401).json({ message: "Utente non trovato." }); return null; }
  return user.role === "admin" ? email : (user.parentAdminEmail ?? email);
}

export async function listClientsController(req: Request, res: Response): Promise<void> {
  const ownerEmail = await resolveOwner(req, res);
  if (!ownerEmail) return;
  const search = typeof req.query.q === "string" ? req.query.q : undefined;
  const clients = await listClients(ownerEmail, search);
  res.json(clients);
}

export async function deleteClientController(req: Request, res: Response): Promise<void> {
  const ownerEmail = await resolveOwner(req, res);
  if (!ownerEmail) return;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) { res.status(400).json({ message: "ID non valido." }); return; }
  const deleted = await deleteClient(id, ownerEmail);
  if (!deleted) { res.status(404).json({ message: "Cliente non trovato." }); return; }
  res.status(204).send();
}
