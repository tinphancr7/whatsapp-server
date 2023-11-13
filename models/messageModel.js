import mongoose from "mongoose";
const DOCUMENT_NAME = "Message";
const COLLECTION_NAME = "messages";

const MessageSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			default: "text",
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		receiver: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		messageStatus: {
			type: String,
			default: "sent",
		},
		message: {
			type: String,
			default: "",
		},
	},
	{
		collection: COLLECTION_NAME,
		timestamps: true,
	}
);

export default mongoose.model(DOCUMENT_NAME, MessageSchema);
