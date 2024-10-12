const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    chatId: { type: String, unique: true, required: true },
    chatType: { type: String },
    groupName: { type: String },
    users: [
      {
        user: { type: mongoose.Types.ObjectId, required: true },
        userType: {
          type: String,
          required: true,
          refPath: "users.refModel",
        }, // Store the model name here
        refModel: {
          type: String,
          required: true,
          enum: ["Admin", "Student", "Tutor"], // Ensures the value is valid
        },
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message", // Reference to the Message model
    },
  },
  { timestamps: true }
);

// Add the refPath to the schema, referencing the refModel field
chatSchema.path("users.user").options.refPath = "users.refModel";

// Create the Chat model
const NewChat = mongoose.model("NewChat", chatSchema);

module.exports = NewChat;
