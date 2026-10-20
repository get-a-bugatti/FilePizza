// import repository from "../repositories/file.repository.js";
import repository from "../repositories/redis.repository.js";
import crypto from "crypto";
import { AppError, NotFoundError } from "../utils/errorHandlers.js";
import { UPLOADS_DIR } from "../constants.js";
import { ZipArchive } from "archiver";
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

    async processAndArchiveFiles(uploadedFiles) {

        const fileId = crypto.randomUUID();
        const fileAlias = `upload-${fileId}.zip`;
        const destination = path.join(UPLOADS_DIR, fileAlias); // final location; multer's raw parts land in uploads/tmp first

        const archive = new ZipArchive({ zlib: { level: 6 } }); // archiver@8: ctor takes only options; the format is fixed by the class
        const writeStream = fs.createWriteStream(destination);

        archive.pipe(writeStream);

        for (const f of uploadedFiles) {
            archive.append(fs.createReadStream(f.path), {
                name: f.originalname // multer's field is `originalname` (lowercase n)
            })
        }

        archive.finalize();


        try {
            await new Promise((resolve, reject) => {
                writeStream.on('close', resolve);
                writeStream.on('error', reject);
                archive.on('error', reject);
            });

            const stats = await fs.promises.stat(destination); // was missing `await` → size was undefined

            const record = {
                id: fileId,
                filename: fileAlias,
                size: stats.size,
                mimetype: "application/zip",
                createdAt: new Date().toISOString(),
            };

            await repository.save(record);

            return fileId;
            
        } catch (error) {

            // Cleanup zip files on processing failure.
            fs.unlink(destination, () => {});

            console.error("[FileService::error]", "Failed to process files.");

            throw new AppError("Internal error.");

        } finally {

            this.cleanupTempFiles(uploadedFiles);

        }

    }

    cleanupTempFiles(files) {
        for (const f of files) {
            fs.unlink(f.path, () => {});
        }
    }

    async getFileStats(location) {

        try {

            const filedata = await fs.promises.stat(location);
            return filedata;

        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new NotFoundError("File not found on disk.");
            }

            console.error("[FileService::error]", "Failed to read file stats.");

            throw new AppError("Internal error.")
        }
        
    }
}

export const fileService = new FileService();