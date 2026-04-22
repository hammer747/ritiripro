import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { createUser, findUserByEmail, updateUser } from "../services/users.service";

function ownerEmail(req: Request): string | null {
  const v = req.header("x-user-email");
  return v ? v.trim().toLowerCase() || null : null;
}

function userToJson(user: NonNullable<Awaited<ReturnType<typeof findUserByEmail>>>) {
  return { nome: user.nome, cognome: user.cognome, cel: user.cel, email: user.email, role: user.role, ditta: user.ditta, indirizzo: user.indirizzo, piva: user.piva };
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
  res.status(201).json(userToJson(user!));
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

  res.json(userToJson(user));
}

export async function updateProfileController(req: Request, res: Response): Promise<void> {
  const email = ownerEmail(req);
  if (!email) { res.status(401).json({ message: "Login richiesto." }); return; }

  const { nome, cognome, cel, currentPassword, newPassword, ditta, indirizzo, piva } = req.body as Record<string, string>;

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

  await updateUser(email, nome.trim(), cognome.trim(), cel?.trim() || null, newPassword?.trim() || undefined, ditta?.trim() || null, indirizzo?.trim() || null, piva?.trim() || null);
  const updated = await findUserByEmail(email);
  res.json(userToJson(updated!));
}
