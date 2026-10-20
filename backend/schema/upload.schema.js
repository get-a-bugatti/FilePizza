import {z} from "zod";
import { ALLOWED_MIME_TYPES, maxFileMb } from "../constants";

export const uploadSchema = z.object({
    files: z.object({
        fieldname: z.string(),
        originalname: z.string(),
        mimetype: z.string().refine(
            (type) => ALLOWED_MIME_TYPES.includes(type),
            {
                message: 'Invalid file type. Only JPEG, PNG and PDF aer allowed.'
            }
        ),
        size: z.number().max(maxFileMb * 1024 * 1024, `File size must be under ${maxFileMb}MB.`)
    })
});

