const express = require("express");
const {
  signup,
  login,
  getLoggedUser,
  verifyEmail,
  forgotPassword,
  confirmOtp,
  resetPassword,
  deleteUser,
  updatePushToken,
  pushtoken,
} = require("../controllers/AuthController/authController");
const { protect } = require("../middleware/AuthMiddleWare/authMiddleware");
const router = express.Router();

router.post("/signup", signup);
router.get("/verify/:token", verifyEmail);
router.post("/login", login);
router.get("/loggeduser", protect, getLoggedUser);
router.post("/forgot-password", forgotPassword);
router.post("/confirm-otp", confirmOtp);
router.post("/reset-password", resetPassword);
router.post("/delete-account", protect, deleteUser);
router.post("/updatePushToken", protect, updatePushToken);
router.post("/pushtoken", pushtoken);
module.exports = router;
