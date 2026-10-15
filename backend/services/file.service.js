import repository from "../repositories/file.repository.js";
import { NotFoundError } from "../utils/errorHandlers.js";
import { UPLOADS_DIR } from "../constants.js";
import path from "path";
import fs from "fs";

class FileService {

    getFileStream(id) {
        const fileRecord = repository.findById(id);
        if (!fileRecord) throw new NotFoundError('File not found');

        
        const filepath = path.join(UPLOADS_DIR, fileRecord.filename);

        // caller is responsible for checking existence / stat
        return {
            stream: fs.createReadStream(filepath),
            filename: fileRecord.filename,
            // size, mimeType, etc. — whatever the controller needs for headers
        };
    }
}

export const fileService = new FileService();