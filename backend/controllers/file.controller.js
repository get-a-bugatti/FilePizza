import { createGzip } from "zlib";
import { fileService } from "../services/file.service.js";
import { randomUUID } from "crypto";
import {createReadStream, createWriteStream} from "fs";
import { join } from "path";
import {repository} from "../repositories/file.repository.js";
import { createFileAlias } from "../utils/filename.js";

class FileController {
    

    upload(req, res, next) {
        const targetFile = req.headers['x-source-path'] || "unknown.bin";
        
        const fileId = randomUUID();
        
        const readStream  = createReadStream(targetFile);
        const writeStream = createWriteStream(destination)
        
        const fileAlias = createFileAlias({filename, fileId});
        const destination = join("uploads", fileAlias);
        

        const record = {
            id: fileId,
            originalName: basename(targetFile),
            filename: fileAlias,
            size: 0,
            mimetype: req.headers['content-type'] || 'application/octet-stream',
            createdAt: new Date().toISOString(),
        };

        
        
        readStream
        .pipe(createGzip())
        .pipe(writeStream);
        
        
        writeStream.on('finish', () => {
            
            repository.save(record);

            return res.status(200).json({
                message: "File saved successfully."
            })
        })

        readStream.on('error', (err) => {
            console.error('Read stream error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Failed to read source file' });
        });

        writeStream.on('error', (err) => {
            console.error('Write stream error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Failed to write file to disk' });
        });
        
    }

    download(req, res, next) {

        const fileId = req.params.fileId;
        const file = repository.findById(fileId);

        const filepath = path.join("uploads", file.filename);

        const readStream = createReadStream(filepath);

        readStream.on('error', () => {
            console.error(`[download] ${record.id}: ${err.message}`);
            if (res.headersSent) res.destroy(err);
            else res.status(500).json({ success: false, error: 'Failed to read file.'});
        })
        
        res.on('close', () => { // user closes tab
            
            // immediately stop the stream; if res.end() has not been called.
            // i.e., if response has not reached it's end.
            if (!res.writableEnded) readStream.destroy();
            
        })
        
        readStream
            .pipe(res);
    }
}

export const fileController = new FileController();