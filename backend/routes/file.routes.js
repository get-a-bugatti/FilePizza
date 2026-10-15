import express from "express";
import {upload} from "../middlewares/multer.middleware.js";
import { maxFileCount } from "../constants.js";
import { fileController } from "../controllers/file.controller.js";

const router = express.Router();


router.post("/upload", upload.array("files", maxFileCount), fileController.upload)
router.get("/download/:id", fileController.download);

export { router } ;