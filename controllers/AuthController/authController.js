const jwt = require("jsonwebtoken");
const Admin = require("../../models/AdminModel/adminModel");
const Student = require("../../models/StudentModel/studentModel");
const Tutor = require("../../models/TutorModel/tutorModel");
const bcrypt = require("bcryptjs");
const { findUserById, deleteChatsForUser } = require("../../misc/misc");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../../misc/emailSendFunction");
const { sendEmail } = require("../../misc/emailSendFunction");
const { getSocketInstance } = require("../../socket/socket");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

exports.signup = async (req, res) => {
  const {
    name,
    email,
    password,
    userType,
    phoneNumber,
    phoneCountry,
    whatsappNumber,
    whatsappCountry,
    subjects,
  } = req.body;
  console.log(req.body);
  try {
    console.log("inside try");
    let existingUser;
    // Check if email exists for Admin
    if (userType === "Admin") {
      existingUser = await Admin.findOne({ email });
    }
    // Check if email exists for Student
    else if (userType === "Student") {
      existingUser = await Student.findOne({ email });
    }
    // Check if email exists for Tutor
    else if (userType === "Tutor") {
      existingUser = await Tutor.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // If email already exists
    if (existingUser) {
      console.log("Email already exists. Please try a different email. ");
      return res.status(400).json({
        message: "Email already exists. Please try a different email.",
      });
    }
    // Create new user
    let user;
    if (userType === "Admin") {
      user = new Admin({
        name,
        email,
        password,
        userType,
        phoneNumber,
        phoneCountry,
        whatsappNumber,
        whatsappCountry,
      });
    } else if (userType === "Student") {
      user = new Student({
        name,
        email,
        password,
        userType,
        phoneNumber,
        phoneCountry,
        whatsappNumber,
        whatsappCountry,
      });
    } else if (userType === "Tutor") {
      user = new Tutor({
        name,
        email,
        password,
        userType,
        phoneNumber,
        phoneCountry,
        whatsappNumber,
        whatsappCountry,
        subjects,
      });
    }

    // Save user in the database
    await user.save();

    // Generate verification link
    const verificationToken = generateToken(user._id);
    const verificationLink = `${process.env.BASE_URL}/api/auth/verify/${verificationToken}`;

    // Send verification email
    await sendVerificationEmail({
      email: user.email,
      verificationLink: verificationLink,
    });

    console.log("success fully messeage received");
    res.status(201).json({
      message:
        "User registered. Please check your email to verify your account.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    // Decode token to get the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    // Find user in the Admin, Student, or Tutor collection
    let user =
      (await Admin.findById(userId)) ||
      (await Student.findById(userId)) ||
      (await Tutor.findById(userId));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Update the `isVerified` field
    user.isVerified = true;
    await user.save();
    res.json({ message: "Email verified successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, userType, password } = req.body;
  // Common logic for checking the userType
  const findUserByType = async (userType) => {
    const emailRegex = new RegExp(`^${email}$`, "i"); // Create case-insensitive regex for email
    if (userType === "Admin") return Admin.findOne({ email: emailRegex });
    if (userType === "Student") return Student.findOne({ email: emailRegex });
    if (userType === "Tutor") return Tutor.findOne({ email: emailRegex });
  };
  try {
    const user = await findUserByType(userType);

    if (!user) {
      return res
        .status(401)
        .json({ message: "User Not Found For This Email....😢😢😢😢" });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "User is not verified please check your email and verify 😊😊 ",
      });
    }

    if (await user.matchPassword(password)) {
      res.json({
        _id: user._id,
        name: user.name,
        isAdmin: user.userType,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Fill Correct Passowrd 👀👀" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getLoggedUser = async (req, res) => {
  try {
    const user = req.user;
    // Use findOne instead of find to get a single user document
    const loggedUser = await findUserById({ userId: user._id }); // Exclude the password field
    if (!loggedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(loggedUser);
  } catch (error) {
    console.error("Error fetching logged user:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const emailRegex = new RegExp(`^${email}$`, "i");
  try {
    let user =
      (await Admin.findOne({ email: emailRegex })) ||
      (await Student.findOne({ email: emailRegex })) ||
      (await Tutor.findOne({ email: emailRegex }));

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email not found." });
    }

    // Generate 4-digit OTP
    const otp = crypto.randomInt(1000, 9999).toString();

    // Set encrypted OTP and expiry
    user.setResetOtp(otp);
    console.log("hello");
    user.resetOtpExpiry = Date.now() + 2 * 60 * 1000; // OTP valid for 2 mins
    await user.save();

    // Send OTP via email
    await sendEmail({
      to: user.email,
      subject: "Your Password Reset OTP",
      text: `Your OTP is: ${otp}`,
    });

    res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: "Server error" });
  }
};

exports.confirmOtp = async (req, res) => {
  const { email, otp } = req.body;
  const emailRegex = new RegExp(`^${email}$`, "i");
  try {
    let user =
      (await Admin.findOne({ email: emailRegex })) ||
      (await Student.findOne({ email: emailRegex })) ||
      (await Tutor.findOne({ email: emailRegex }));

    if (
      !user ||
      !user.verifyResetOtp(otp) ||
      user.resetOtpExpiry < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    res
      .status(200)
      .json({ message: "OTP verified. Proceed to reset password." });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const emailRegex = new RegExp(`^${email}$`, "i");
  try {
    let user =
      (await Admin.findOne({ email: emailRegex })) ||
      (await Student.findOne({ email: emailRegex })) ||
      (await Tutor.findOne({ email: emailRegex }));
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    // Hash the new password and save
    user.password = newPassword;
    user.resetOtp = undefined; // Clear OTP
    user.resetOtpExpiry = undefined; // Clear OTP expiry
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    // Find the user (Admin, Student, or Tutor)
    let user =
      (await Admin.findOne({ email })) ||
      (await Student.findOne({ email })) ||
      (await Tutor.findOne({ email }));

    if (!user) {
      console.log("usernot found");
      return res.status(404).json({ message: "User not found." });
    }

    // Verify the password before deletion
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password." });
    }

    // Save the userId before deleting the user
    const userId = user._id;

    // Delete the user
    const userModel = user.constructor; // Get the model of the user (Admin, Student, or Tutor)
    await userModel.deleteOne({ _id: userId });

    // After user deletion, delete all chats and messages related to this user
    await deleteChatsForUser(userId);
    const io = await getSocketInstance();
    io.emit("userIsDeleted", { message: "user is deleted socket indicate" });
    res
      .status(200)
      .json({ message: "Account and related chats deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error });
  }
};
