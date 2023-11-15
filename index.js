import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import userRoutes from "./routes/users.js";
const app = express();
import {Server} from "socket.io";
import dotenv from "dotenv";
dotenv.config();
app.use("/uploads/recordings", express.static("uploads/recordings"));
app.use("/uploads/images", express.static("uploads/images"));
app.use(cors());
app.use(express.json());

mongoose
	.connect(process.env.MONGO_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log("DB Connection Successful");
	})
	.catch((err) => {
		console.log(err.message);
	});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

const server = app.listen(process.env.PORT, () =>
	console.log(`Server started on ${process.env.PORT}`)
);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
	console.log("User Connected", socket.id);
	global.chatSocket = socket;
	socket.on("add-user", (userId) => {
		onlineUsers.set(userId, socket.id);
	});
	socket.on("send-msg", (data) => {
		const sendUserSocket = onlineUsers.get(data?.to);
		console.log("sendUserSocket", sendUserSocket);

		if (sendUserSocket) {
			socket.to(sendUserSocket).emit("msg-receive", {
				message: data?.message,
				from: data?.from,
			});
		}
	});

	socket.on("outgoing-voice-call", (data) => {
		const sendUserSocket = onlineUsers.get(data?.to);
		if (sendUserSocket) {
			socket.to(sendUserSocket).emit("incoming-voice-call", {
				from: data?.from,
				roomId: data?.roomId,
				callType: data?.callType,
			});
		}
	});
	socket.on("outgoing-video-call", (data) => {
		const sendUserSocket = onlineUsers.get(data?.to);
		if (sendUserSocket) {
			socket.to(sendUserSocket).emit("incoming-video-call", {
				from: data?.from,
				roomId: data?.roomId,
				callType: data?.callType,
			});
		}
	});
	socket.on("reject-voice-call", (data) => {
		const sendUserSocket = onlineUsers.get(data?.to);
		if (sendUserSocket) {
			socket.to(sendUserSocket).emit("voice-call-reject");
		}
	});
	socket.on("reject-video-call", (data) => {
		const sendUserSocket = onlineUsers.get(data?.to);
		if (sendUserSocket) {
			socket.to(sendUserSocket).emit("video-call-reject");
		}
	});
	socket.on("accept-incoming-call", ({id}) => {
		const sendUserSocket = onlineUsers.get(id);
		if (sendUserSocket) {
			socket.to(sendUserSocket).emit("accept-call");
		}
	});

	socket.on("disconnect", () => {
		onlineUsers.forEach((userId, socketId) => {
			if (socketId === socket.id) {
				onlineUsers.delete(userId);
			}
		});
	});
});
