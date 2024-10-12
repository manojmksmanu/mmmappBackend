const express = require("express");
const { protect } = require("../middleware/AuthMiddleWare/authMiddleware");
const {
  getUsersForChat,
} = require("../controllers/UserController/userController");
const router = express.Router();

// Get all users (protected, only admin)
router.get("/users", protect, getUsersForChat);

module.exports = router;
