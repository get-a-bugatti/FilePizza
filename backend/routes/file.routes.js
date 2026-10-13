import express from "express";
import {upload} from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/upload", upload.array("files", 10), (req, res) => { 
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            error: "No files uploaded."
        })
    } 
})
router.get("/api/download/:id", fileCont);