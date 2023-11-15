import express from "express";
import {
	addAudioMessage,
	addImageMessage,
	addMessage,
	getMessages,
} from "../controllers/messageController.js";
import multer from "multer";
const router = express.Router();
const upload = multer({dest: "uploads/recordings"});
const uploadImage = multer({dest: "uploads/images"});
router.post("/add-message", addMessage);
router.post("/add-image-message", uploadImage.single("image"), addImageMessage);
router.post("/add-audio-message", upload.single("audio"), addAudioMessage);
router.get("/get-messages/:from/:to", getMessages);

export default router;
