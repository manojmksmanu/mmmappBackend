const express = require("express");
const NewChat = require("../models/NewChatModel/newChatModel"); // Import your Chat model
const { protect } = require("../middleware/AuthMiddleWare/authMiddleware");

const router = express.Router();

router.post("/block-user", protect, async (req, res) => {
  const { chatId, reportedUserId } = req.body;

  try {
    // Find the chat by ID
    const chat = await NewChat.findOne({ _id: chatId });

    if (!chat) {
      console.error("Chat not found");
      return res.status(404).json({ error: "Chat not found" });
    }

    // Ensure `blockedUsers` field exists
    if (!chat.blockedUsers) {
      chat.blockedUsers = [];
    }

    // Check if the user is already blocked
    if (!chat.blockedUsers.includes(reportedUserId)) {
      chat.blockedUsers.push(reportedUserId);
      await chat.save();

      // Populate the chat document to include related references
      const updatedChatData = await NewChat.findOne({ _id: chat._id })
        .populate({
          path: "users.user",
          select: "-password",
        })
        .populate({
          path: "latestMessage",
          model: "Message",
        });

      return res.status(200).json({
        message: "User successfully blocked in this chat",
        updatedChatData: updatedChatData,
      });
    } else {
      return res.status(400).json({
        error: "User already blocked in this chat",
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/unblock-user", protect, async (req, res) => {
  const { chatId, reportedUserId } = req.body;

  try {
    const chat = await NewChat.findOne({ _id: chatId });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.blockedUsers.includes(reportedUserId)) {
      chat.blockedUsers = chat.blockedUsers.filter(
        (userId) => userId.toString() !== reportedUserId
      );

      await chat.save();

      const updatedChatData = await NewChat.findOne({ _id: chat._id })
        .populate({
          path: "users.user",
          select: "-password",
        })
        .populate({
          path: "latestMessage",
          model: "Message",
        });

      return res.status(200).json({
        message: "User successfully unblocked",
        updatedChatData: updatedChatData,
      });
    } else {
      return res.status(400).json({
        error: "User is not blocked in this chat",
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
