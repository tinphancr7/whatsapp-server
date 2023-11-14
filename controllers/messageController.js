import messageModel from "../models/messageModel.js";
import mongoose from "mongoose";
import {renameSync} from "fs";
import userModel from "../models/userModel.js";

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

const getInitialContactsWithMessages = async (req, res) => {
	try {
		const userId = req.params.from;
		const user = await userModel
			.findByUserId(userId)
			.populate("sender")
			.populate("receiver");

		// const user = await prisma.users.findUnique({
		// 	where: {
		// 		id: userId,
		// 	},
		// 	include: {
		// 		sentMessages: {
		// 			include: {
		// 				reciever: true,
		// 				sender: true,
		// 			},
		// 			orderBy: {
		// 				createdAt: "desc",
		// 			},
		// 		},
		// 		recievedMessages: {
		// 			include: {
		// 				reciever: true,
		// 				sender: true,
		// 			},
		// 			orderBy: {
		// 				createdAt: "desc",
		// 			},
		// 		},
		// 	},
		// });

		const messages = [...user.sentMessages, ...user.recievedMess];
		messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		const users = new Map();
		const messageStatusChange = [];
		messages.forEach((msg) => {
			const isSender = msg.senderId === userId;
			const calculatedId = isSender ? msg.recievedId : msg.senderId;
			if (msg.messageStatus === "sent") {
				messageStatusChange.push(msg.id);
			}
			if (!user.get(calculatedId)) {
				const {
					id,
					type,
					message,
					messageStatus,
					createdAt,
					senderId,
					recieverId,
				} = msg;
				let user = {
					messageId: id,
					type,
					message,
					messageStatus,
					createdAt,
					senderId,
					recieverId,
				};
				if (isSender) {
					user = {
						...user,
						...msg.reciever,
						totalUnreadMessages: 0,
					};
				} else {
					user = {
						...user,
						...msg.sender,
						totalUnreadMessages: messageStatus !== "read" ? 1 : 0,
					};
				}
				users.set(calculatedId, {
					...user,
				});
			} else if (messageStatus !== "read" && !isSender) {
				const user = users.get(calculatedId);
				user.set(calculatedId, {
					...user,
					totalUnreadMessages: user.totalUnreadMessages + 1,
				});
			}
		});
		if (messageStatusChange.length) {
			await prisma.messages.updateMany({
				where: {
					id: {in: messageStatusChange},
				},
				data: {
					messageStatus: "delivered",
				},
			});
		}

		return res.status(200).json({
			user: Array.from(users.values()),
			onlineUsers: Array.from(onlineUsers.keys()),
		});
	} catch (error) {
		next(error);
	}
};

export {
	getMessages,
	addMessage,
	addImageMessage,
	addAudioMessage,
	getInitialContactsWithMessages,
};
