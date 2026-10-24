import { fileService } from "../services/file.service.js";
import { join } from "path";
import { UPLOADS_DIR } from "../constants.js";
import { AppError, BadRequestError } from "../utils/errorHandlers.js";
class FileController {
  async upload(req, res, next) {

    if (!req.files || req.files.length === 0) {
      throw new BadRequestError("No files uploaded.");
    }


    // TODO: Make it work with backgorund jobs.
    // const fileId = await fileService.processAndArchiveFilesBackground(req.files);

    res.status(200).json({
        success: true,
        id: fileId,
        message: "File uploaded successfully."
    })
   
  }

  async download(req, res, next) {
    const { id } = req.params;

    let fileData;
    try {
      fileData = await fileService.prepareFileDownload(id); // file : {stream, filename}
    } catch (err) {

      console.error("[FileController::download error]", err);
      return next(err);
    }

    const {stream, filename, size} = fileData;


    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );
    res.setHeader("Content-Length", size);


    stream.on("error", async (err) => {
      console.error(`[download] ${id}: ${err.message}`);
      await fileService.handleStreamError(id);

      if (!res.headersSent) {
        next(err);
      } else {
        res.destroy(err);
      }
    });

    stream.on('end', async () => {
      await fileService.handleStreamEnd(id);
    })

    res.once("close", async () => {
      if (!res.writableEnded) {
        stream.destroy();
        await fileService.handleStreamError(id);
      }
    });

    stream.pipe(res);
  }
}

export const fileController = new FileController();
