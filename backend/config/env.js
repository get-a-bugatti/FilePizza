import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
})


export function intFromEnv(name, fallback) {
    const raw = process.env[name];

    const intValue = Number.parseInt(raw ?? '', 10);
    const isUsable = Number.isFinite(intValue) && intValue > 0;
    return isUsable ? intValue: fallback;
}