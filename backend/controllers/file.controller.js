import { fileService } from "../services/file.service.js";
import { randomUUID } from "crypto";
import fs from "fs";
import { join } from "path";
import { UPLOADS_DIR } from "../constants.js";
import { ZipArchive } from "archiver";
import repository from "../repositories/file.repository.js";
import { AppError, BadRequestError, NotFoundError } from "../utils/errorHandlers.js";

class FileController {
  async upload(req, res, next) {

    console.log("Req.files :", req.files);
    if (!req.files || req.files.length === 0) {
      throw new BadRequestError("No files uploaded.");
    }

    const fileId = randomUUID();
    const fileAlias = `upload-${fileId}.zip`;
    const destination = join(UPLOADS_DIR, fileAlias); // final location; multer's raw parts land in uploads/tmp first

    const archive = new ZipArchive({ zlib: { level: 6 } }); // archiver@8: ctor takes only options; the format is fixed by the class
    const writeStream = fs.createWriteStream(destination);

    archive.pipe(writeStream);

    for (const f of req.files) {
        archive.append(fs.createReadStream(f.path), {
            name: f.originalname // multer's field is `originalname` (lowercase n)
        })
    }

    archive.finalize();

    // Todo: Cleanup code for errors (writeStream errors, archive errors)
    await new Promise((resolve, reject) => {
        writeStream.on('close', resolve);
        writeStream.on('error', reject);
        archive.on('error', reject);
    })
    .catch(error => {

        for (const f of req.files){
            fs.unlink(f.path,  () => {});
        }

        fs.unlink(destination, () => {});

        if (!res.headersSent) {
            throw new AppError("Upload failed.")
        }

        return res.destroy(error);
    })

    const stats = await fs.promises.stat(destination); // was missing `await` → size was undefined

    const record = {
      id: fileId,
      filename: fileAlias,
      size: stats.size,
      mimetype: "application/zip",
      createdAt: new Date().toISOString(),
    };

    repository.save(record);

    for (const f of req.files) fs.unlink(f.path, () => {});

    res.status(200).json({
        success: true,
        id: fileId,
        message: "File uploaded successfully."
    })
   
  }

  async download(req, res) {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ success: false, error: "Invalid id." });
    }

    let file;
    try {
      file = fileService.getFileStream(id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({ success: false, error: err.message });
      }
      return res.status(500).json({ success: false, error: "Internal error." });
    }

    const filepath = join(UPLOADS_DIR, file.filename);

    let stats;
    try {
      stats = await fs.promises.stat(filepath);
    } catch {
      file.stream.destroy();
      return res
        .status(404)
        .json({ success: false, error: "File not found on disk." });
    }

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`,
    );
    res.setHeader("Content-Length", stats.size);

    file.stream.on("error", (err) => {
      console.error(`[download] ${id}: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Failed to read file." });
      } else {
        res.destroy(err);
      }
    });

    res.once("close", () => {
      if (!res.writableEnded) file.stream.destroy();
    });

    file.stream.pipe(res);
  }
}

export const fileController = new FileController();
