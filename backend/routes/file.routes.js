import express from "express";
import {uploadFiles} from "../middlewares/multer.middleware.js";
import { maxFileCount } from "../constants.js";
import { fileController } from "../controllers/file.controller.js";
import { uploadSchema } from "../schema/upload.schema.js";
import { downloadSchema } from "../schema/download.schema.js";
import {validate} from "../middlewares/validation.middleware.js";

const router = express.Router();


router.post("/upload", uploadFiles("files", maxFileCount), validate(uploadSchema), fileController.upload)
router.get("/download/:id", validate(downloadSchema), fileController.download);

export { router } ;