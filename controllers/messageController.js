import messageModel from "../models/messageModel.js";
import mongoose from "mongoose";
import {renameSync} from "fs";

const getMessages = async (req, res, next) => {
	try {
		const {from, to} = req.params;

		if (from && to) {
			const messages = await messageModel
				.find({
					$or: [
						{sender: from, receiver: to},
						{sender: to, receiver: from},
					],
				})
				.sort({createdAt: 1});

			const unreadMessages = [];

			messages.forEach(async (message, index) => {
				if (
					message.messageStatus !== "read" &&
					message.sender === mongoose.Types.ObjectId(to)
				) {
					messages[index].messageStatus = "read";

					unreadMessages.push(message.id);
				}

				await messageModel.updateMany(
					{
						_id: {
							$in: unreadMessages,
						},
					},
					{
						messageStatus: "read",
					}
				);
			});
			return res.json({msg: "Success", status: true, messages});
		}
		return res.json({msg: "Failed", status: false});
	} catch (err) {
		console.log("err", err);
	}
};
const addMessage = async (req, res, next) => {
	try {
		const {message, from, to} = req.body;

		const getUser = onlineUsers.get(to);

		if (message && from && to) {
			const newMessage = await messageModel.create({
				message,
				sender: from,
				receiver: to,
				messageStatus: getUser ? "delivered" : "sent",
			});
			return res.json({msg: "Success", status: true, message: newMessage});
		}
		return res.json({msg: "Failed", status: false});
	} catch (err) {
		console.log("err", err);
	}
};
const addImageMessage = async (req, res, next) => {
	try {
		if (req.file) {
			const date = Date.now();
			let fileName = "uploads/images/" + date + req.file.originalname;

			renameSync(req.file.path, fileName);
			const {from, to} = req.query;

			const getUser = onlineUsers.get(to);
			if (from && to) {
				const newMessage = await messageModel.create({
					message: fileName,
					sender: from,
					receiver: to,
					messageStatus: getUser ? "delivered" : "sent",
					type: "image",
				});
				return res
					.status(201)
					.json({msg: "Success", status: true, message: newMessage});
			}
			return res.status(500).json({msg: "Failed", status: false});
		}
	} catch (error) {}
};
const addAudioMessage = async (req, res, next) => {
	try {
		if (req.file) {
			const date = new Date();
			let fileName =
				"uploads/recordings/" + date.getTime() + req.file.originalname;
			renameSync(req.file.path, fileName);
			const {from, to} = req.body;
			const getUser = onlineUsers.get(to);
			const newMessage = await messageModel.create({
				data: {
					message: fileName,
					sender: from,
					receiver: to,
					messageStatus: getUser ? "delivered" : "sent",
					type: "audio",
				},
			});
			return res
				.status(201)
				.json({msg: "Success", status: true, message: newMessage});
		}
	} catch (error) {}
};
export {getMessages, addMessage, addImageMessage, addAudioMessage};
