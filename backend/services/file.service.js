// import repository from "../repositories/file.repository.js";
import repository from "../repositories/redis.repository.js";

import { NotFoundError } from "../utils/errorHandlers.js";
import { UPLOADS_DIR } from "../constants.js";
import path from "path";
import fs from "fs";

class FileService {

    async getFileStream(id) { // generate fileStream from FileRepository.
        const filename = await repository.findFilenameById(id);
        if (!filename) throw new NotFoundError('File not found');

        
        const filepath = path.join(UPLOADS_DIR, filename);

        return {
            stream: fs.createReadStream(filepath),
            filename: filename,
            // size, mimeType, etc. — whatever the controller needs for headers
        };
    }
}

export const fileService = new FileService();