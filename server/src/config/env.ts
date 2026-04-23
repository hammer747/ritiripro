import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Variabile d'ambiente obbligatoria mancante: ${key}`);
  return val;
}

export const env = {
  PORT: Number(process.env.PORT || 4000),
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || "ritiri_user",
  DB_PASSWORD: required("DB_PASSWORD"),
  DB_NAME: process.env.DB_NAME || "ritiri_facili",
  JWT_SECRET: required("JWT_SECRET"),
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || "",
};
