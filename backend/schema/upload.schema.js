import {z} from "zod";
import { ALLOWED_MIME_TYPES, maxFileCount, maxFileMb } from "../constants.js";

export const uploadSchema = z.object({
    files: z.array(
        z.object({
            fieldname: z.string(),
            originalname: z.string(),
            mimetype: z.string().refine(
                (type) => ALLOWED_MIME_TYPES.includes(type),
                {
                    message: 'Invalid or unallowed file type.'
                }
            ),
            path: z.string(),
            size: z.number().max(maxFileMb * 1024 * 1024, `File size must be under ${maxFileMb}MB.`)
        })
    )
    .min(1, "At least one file must be uploaded.")
    .max(maxFileCount, `Cannot upload more than ${maxFileCount} files.`)
});

