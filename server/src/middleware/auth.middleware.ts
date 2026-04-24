import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthPayload {
  email: string;
  role: string;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthPayload;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Login richiesto." });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ message: "Sessione scaduta. Effettua nuovamente il login." });
  }
}

// Simple in-memory rate limiter — keyed by IP
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 60 * 1000; // 60 min
const MAX_ATTEMPTS = 10;

export function loginRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_ATTEMPTS) {
      res.status(429).json({ message: "Troppi tentativi. Riprova tra 15 minuti." });
      return;
    }
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }
  next();
}
