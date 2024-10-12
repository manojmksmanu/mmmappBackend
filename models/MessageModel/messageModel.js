const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  sender: { type: String, required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  messageId: { type: String },
  fileUrl: { type: String, default: null },
  fileType: { type: String, default: "text" },
  createdAt: { type: Date, default: Date.now },
  replyingMessage: {
    type: Object,
  },
  status: { type: String, default: "unsent" },
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
