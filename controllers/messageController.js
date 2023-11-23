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
					message.sender.toString() === to
				) {
					messages[index].messageStatus = "read";

					unreadMessages.push(message._id);
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
			const date = Date.now();
			let fileName = "uploads/recordings/" + date + req.file.originalname;

			renameSync(req.file.path, fileName);
			const {from, to} = req.query;

			const getUser = onlineUsers.get(to);
			const newMessage = await messageModel.create({
				message: fileName,
				sender: from,
				receiver: to,
				messageStatus: getUser ? "delivered" : "sent",
				type: "audio",
			});
			return res
				.status(201)
				.json({msg: "Success", status: true, message: newMessage});
		}
	} catch (error) {
		console.log("error", error);
		return res.status(500).json({msg: "Failed", status: false});
	}
};

const getInitialContactsWithMessages = async (req, res) => {
	try {
		const userId = req.params.from;
		console.log("userId", userId);

		const messages = await messageModel.aggregate([
			{
				$match: {
					$or: [
						{
							sender: mongoose.Types.ObjectId(userId),
						},
						{
							receiver: mongoose.Types.ObjectId(userId),
						},
					],
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "sender",
					foreignField: "_id",
					as: "sender",
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "receiver",
					foreignField: "_id",
					as: "receiver",
				},
			},
			{
				$unwind: {
					path: "$sender",
				},
			},
			{
				$unwind: {
					path: "$receiver",
				},
			},
			{
				$sort: {
					createdAt: -1,
				},
			},
		]);

		const users = new Map();
		const messageStatusChange = [];
		messages.forEach((msg) => {
			const isSender = msg.sender?._id.toString() === userId;

			const calculatedId = isSender ? msg.receiver?._id : msg.sender?._id;

			if (msg.messageStatus === "sent") {
				messageStatusChange.push(msg._id);
			}
			const {_id, type, message, messageStatus, createdAt, sender, receiver} =
				msg;

			if (!users.get(calculatedId.toString())) {
				let user = {
					messageId: _id,
					type,
					message,
					messageStatus,
					createdAt,
					sender,
					receiver,
				};
				if (isSender) {
					user = {
						...user,
						...msg.receiver,
						totalUnreadMessages: 0,
					};
				} else {
					user = {
						...user,
						...msg.sender,
						totalUnreadMessages: messageStatus !== "read" ? 1 : 0,
					};
				}
				users.set(calculatedId.toString(), {
					...user,
				});
			} else if (messageStatus !== "read" && !isSender) {
				const user = users.get(calculatedId.toString());
				users.set(calculatedId.toString(), {
					...user,
					totalUnreadMessages: user.totalUnreadMessages + 1,
				});
			}
		});
		if (messageStatusChange.length) {
			await messageModel.updateMany(
				{
					_id: {
						$in: messageStatusChange,
					},
				},
				{
					messageStatus: "delivered",
				}
			);
		}

		return res.status(200).json({
			users: Array.from(users.values()),
			onlineUsers: Array.from(onlineUsers.keys()),
		});
	} catch (error) {
		// next(error);
	}
};

export {
	getMessages,
	addMessage,
	addImageMessage,
	addAudioMessage,
	getInitialContactsWithMessages,
};
