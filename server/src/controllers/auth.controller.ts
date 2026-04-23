import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { createUser, findUserByEmail, updateUser, isRegistrationEnabled } from "../services/users.service";
import { env } from "../config/env";

function userToJson(user: NonNullable<Awaited<ReturnType<typeof findUserByEmail>>>) {
  return { nome: user.nome, cognome: user.cognome, cel: user.cel, email: user.email, role: user.role, ditta: user.ditta, indirizzo: user.indirizzo, piva: user.piva, allowRegistration: user.allowRegistration };
}

function signToken(email: string, role: string): string {
  return jwt.sign({ email, role }, env.JWT_SECRET, { expiresIn: "7d" });
}

export async function registrationStatusController(_req: Request, res: Response): Promise<void> {
  const enabled = await isRegistrationEnabled();
  res.json({ enabled });
}

export async function registerController(req: Request, res: Response): Promise<void> {
  const { nome, cognome, cel, email, password } = req.body as Record<string, string>;

  if (!nome?.trim() || !cognome?.trim() || !email?.trim() || !password?.trim()) {
    res.status(400).json({ message: "Campi obbligatori mancanti." });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    res.status(409).json({ message: "Esiste già un account con questa email." });
    return;
  }

  await createUser(nome.trim(), cognome.trim(), cel?.trim() || null, normalizedEmail, password, "admin", null);
  const user = await findUserByEmail(normalizedEmail);
  const token = signToken(user!.email, user!.role);
  res.status(201).json({ token, ...userToJson(user!) });
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as Record<string, string>;

  if (!email?.trim() || !password?.trim()) {
    res.status(400).json({ message: "Email e password sono obbligatorie." });
    return;
  }

  const user = await findUserByEmail(email.trim().toLowerCase());
  if (!user) {
    res.status(401).json({ message: "Credenziali non valide." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Credenziali non valide." });
    return;
  }

  const token = signToken(user.email, user.role);
  res.json({ token, ...userToJson(user) });
}

export async function updateProfileController(req: Request, res: Response): Promise<void> {
  const email = req.auth?.email ?? null;
  if (!email) { res.status(401).json({ message: "Login richiesto." }); return; }

  const { nome, cognome, cel, currentPassword, newPassword, ditta, indirizzo, piva, allowRegistration } = req.body as Record<string, string>;

  if (!nome?.trim() || !cognome?.trim()) {
    res.status(400).json({ message: "Nome e cognome sono obbligatori." });
    return;
  }

  if (newPassword?.trim()) {
    if (!currentPassword?.trim()) {
      res.status(400).json({ message: "Inserisci la password attuale." });
      return;
    }
    const user = await findUserByEmail(email);
    if (!user) { res.status(404).json({ message: "Utente non trovato." }); return; }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ message: "La password attuale non è corretta." });
      return;
    }
    if (newPassword === currentPassword) {
      res.status(400).json({ message: "La nuova password deve essere diversa da quella attuale." });
      return;
    }
  }

  await updateUser(email, nome.trim(), cognome.trim(), cel?.trim() || null, newPassword?.trim() || undefined, ditta?.trim() || null, indirizzo?.trim() || null, piva?.trim() || null, allowRegistration === "true");
  const updated = await findUserByEmail(email);
  res.json(userToJson(updated!));
}
