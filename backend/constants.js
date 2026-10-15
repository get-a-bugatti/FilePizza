import path from "path";
import { intFromEnv } from "./config/env.js";

export const PROJECT_ROOT = path.resolve(import.meta.dirname, "..", "..");

const BACKEND_ROOT = import.meta.dirname;
// Final location for zip artifacts (and parent of multer's staging dir).
export const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(BACKEND_ROOT, "uploads");

export const maxFileMb = intFromEnv("MAX_FILE_MB", 1024);
export const maxFileCount = intFromEnv("MAX_FILES", 3);



