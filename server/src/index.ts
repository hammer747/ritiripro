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

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
app.use("/uploads", express.static(uploadsPath));

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
  const message = err instanceof Error ? err.message : "Errore interno del server";
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
