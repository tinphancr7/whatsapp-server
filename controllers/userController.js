import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";
import generateToken04 from "../utils/TokenGenerator.js";

const login = async (req, res, next) => {
	try {
		const {username, password} = req.body;

		const user = await userModel.findOne({username});
		if (!user)
			return res.json({msg: "Incorrect Username or Password", status: false});
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid)
			return res.json({msg: "Incorrect Username or Password", status: false});
		delete user.password;
		return res.json({status: true, user});
	} catch (ex) {
		next(ex);
	}
};

const register = async (req, res, next) => {
	try {
		const {username, email, password} = req.body;
		const usernameCheck = await userModel.findOne({username});
		if (usernameCheck)
			return res.json({msg: "Username already used", status: false});
		const emailCheck = await userModel.findOne({email});
		if (emailCheck) return res.json({msg: "Email already used", status: false});
		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await userModel.create({
			email,
			username,
			password: hashedPassword,
		});
		delete user.password;
		return res.json({status: true, user});
	} catch (ex) {
		next(ex);
	}
};
const getUserById = async (req, res, next) => {
	try {
		const user = await userModel.findById(req.params.id);
		return res.json({msg: "Success", status: true, user});
	} catch (ex) {
		next(ex);
	}
};
const getAllUsers = async (req, res, next) => {
	try {
		const users = await userModel
			.find({_id: {$ne: mongoose.Types.ObjectId(req.params.id)}})
			.select(["email", "username", "avatarImage", "_id"]);

		const usersGroupByInitialLetter = {};
		users.forEach((user) => {
			const initialLetter = user?.username.charAt(0).toUpperCase();
			if (!usersGroupByInitialLetter[initialLetter]) {
				usersGroupByInitialLetter[initialLetter] = [];
			}
			usersGroupByInitialLetter[initialLetter].push(user);
		});
		return res.json({
			msg: "Success",
			status: true,
			users: usersGroupByInitialLetter,
		});
	} catch (ex) {
		next(ex);
	}
};

const setAvatar = async (req, res, next) => {
	try {
		const userId = req.params.id;
		const avatarImage = req.body.image;
		const userData = await userModel.findByIdAndUpdate(
			userId,
			{
				isAvatarImageSet: true,
				avatarImage,
			},
			{new: true}
		);
		return res.json({
			isSet: userData.isAvatarImageSet,
			image: userData.avatarImage,
		});
	} catch (ex) {
		next(ex);
	}
};

const logOut = (req, res, next) => {
	try {
		if (!req.params.id) return res.json({msg: "User id is required "});
		onlineUsers.delete(req.params.id);
		return res.status(200).send();
	} catch (ex) {
		next(ex);
	}
};

const generateToken = (req, res) => {
	const appId = parseInt(process.env.ZEGO_APP_ID);
	const serverSecret = process.env.ZEGO_APP_SECRET;
	const userId = req.params.userId;
	const effectiveTime = 3600;
	const payload = "";
	if (appId && serverSecret && userId) {
		const token = generateToken04(
			appId,
			userId,
			serverSecret,
			effectiveTime,
			payload
		);
		return res.status(200).json({token});
	}
};
export {
	generateToken,
	login,
	register,
	getAllUsers,
	setAvatar,
	logOut,
	getUserById,
};
