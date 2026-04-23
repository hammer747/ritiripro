import fs from "fs";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import ritiriRoutes from "./routes/ritiri.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import { initRitiriTable } from "./services/ritiri.service";
import { initUsersTable } from "./services/users.service";
import { initLogsTable } from "./services/logs.service";
import { authMiddleware } from "./middleware/auth.middleware";

const app = express();

// In production the frontend is served from the same origin — no CORS needed.
// In development allow the Vite dev server.
const isDev = process.env.NODE_ENV !== "production";
const allowedOrigin = env.ALLOWED_ORIGIN || (isDev ? "http://localhost:5173" : "");
app.use(cors({
  origin: allowedOrigin || false,
  credentials: true,
}));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files only to authenticated users via proxy endpoint
const uploadsPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
app.get("/api/uploads/:filename", authMiddleware, (req, res) => {
  const filename = path.basename(req.params.filename as string);
  const filepath = path.join(uploadsPath, filename);
  if (!fs.existsSync(filepath)) { res.status(404).json({ message: "File non trovato." }); return; }
  res.sendFile(filepath);
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ritiripro-api" });
});

app.use("/api/ritiri", ritiriRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

const distPath = path.resolve(__dirname, "../../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const message = isDev && err instanceof Error ? err.message : "Errore interno del server.";
  res.status(500).json({ message });
});

async function bootstrap() {
  await initUsersTable();
  await initRitiriTable();
  await initLogsTable();
  app.listen(env.PORT, () => {
    console.log(`API in ascolto su http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Errore avvio server:", err);
  process.exit(1);
});
