import { fileService } from "../services/file.service.js";
import { join } from "path";
import { UPLOADS_DIR } from "../constants.js";
import { AppError, BadRequestError } from "../utils/errorHandlers.js";
class FileController {
  async upload(req, res, next) {

    if (!req.files || req.files.length === 0) {
      throw new BadRequestError("No files uploaded.");
    }

    const fileId = await fileService.processAndArchiveFiles(req.files);

    res.status(200).json({
        success: true,
        id: fileId,
        message: "File uploaded successfully."
    })
   
  }

  async download(req, res) {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid Id.");
    }

    let file;
    try {
      file = await fileService.getFileStream(id); // file : {stream, filename}
    } catch (err) {

      console.error("[FileController::error]", err);
      throw err;
    }

    const filepath = join(UPLOADS_DIR, file.filename);

    let stats;
    try {
      stats = await fileService.getFileStats(filepath);
    } catch (error) {

      file.stream.destroy();
      throw error;
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
        throw new AppError("Failed to read file.")
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
