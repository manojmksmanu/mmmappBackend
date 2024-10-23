const express = require("express");
const {
  sendMessage,
  getMessages,
  forwardMessages,
  markMessagesAsRead,
} = require("../controllers/MessageController/messageController");
const { protect } = require("../middleware/AuthMiddleWare/authMiddleware");
const router = express.Router();

// Send message (protected)
router.post("/message", protect, sendMessage);
router.post("/message-mark-read", protect, markMessagesAsRead);

// Get messages (protected)
router.get("/messages/:chatId", protect, getMessages);

router.post("/forwardMessages", protect, forwardMessages);
module.exports = router;
