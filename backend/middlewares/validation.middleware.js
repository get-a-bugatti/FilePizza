import fs from "node:fs";
import { AppError, BadRequestError } from "../utils/errorHandlers.js";
import {fileTypeFromFile} from "file-type";
import {ALLOWED_MIME_TYPES} from "../constants.js";

export const validate = (schema) => {
    return async (req, res, next) => {

        // 1. mimetype check for uplaoded files
        if (req.files && Array.isArray(req.files)) {

            for(const file of req.files) {
                const detectedType = await fileTypeFromFile(file);

                if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
                    cleanupTempFiles(req.files);

                    throw new BadRequestError(`Invalid file content for ${file.originalname}. File content does not match allowed types.`);
                }

                file.mimetype = detectedType.mime;
            }
        }

        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            files: req.files
        });

        if (!result.success) {

            cleanupTempFiles(req.files);

            const formattedErrors = result.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));

            throw new AppError('Validation Failed.', {statusCode:400, code:"BAD_REQUEST", errors: formattedErrors})
        }

        

        req.body = result.data.body;
        req.params = result.data.params;
        req.files = result.data.files;
    
        next();
    }
}

function cleanupTempFiles(files) {
    if (files && Array.isArray(files)) {
        for (const file of files) {
            fs.unlink(file.path, () => {});
        }
    }
}