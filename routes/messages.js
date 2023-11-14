import express from "express";
import {
	addImageMessage,
	addMessage,
	getInitialContactsWithMessages,
	getMessages,
} from "../controllers/messageController.js";
import multer from "multer";
const router = express.Router();
const uploadImage = multer({dest: "uploads/images"});
router.post("/add-message", addMessage);
router.post("/add-image-message", uploadImage.single("image"), addImageMessage);
router.get("/get-messages/:from/:to", getMessages);
router.get("/get-initial-contacts/:from", getInitialContactsWithMessages);

export default router;
