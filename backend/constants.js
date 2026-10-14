import path from "path";

export const PROJECT_ROOT = path.resolve(import.meta.dirname, "..", "..");

export const maxFileMb = intFromEnv("MAX_FILE_MB", 1024);
export const maxFileCount = intFromEnv("MAX_FILES", 3);



