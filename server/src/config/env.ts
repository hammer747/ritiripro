import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 4000),
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || "ritiri_user",
  DB_PASSWORD: process.env.DB_PASSWORD || "Jordan4663",
  DB_NAME: process.env.DB_NAME || "ritiri_facili",
  JWT_SECRET: process.env.JWT_SECRET || "change_this_jwt_secret",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
};
