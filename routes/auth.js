import express from "express";
import {
	getAllUsers,
	logOut,
	login,
	register,
	setAvatar,
} from "../controllers/userController.js";
const router = express.Router();
router.post("/login", login);
router.post("/register", register);
router.get("/get-contacts/:id", getAllUsers);
router.post("/setavatar/:id", setAvatar);
router.get("/logout/:id", logOut);
router.get("/generate-token/:userId", logOut);

export default router;
