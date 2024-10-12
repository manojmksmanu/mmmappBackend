const Admin = require("../../models/AdminModel/adminModel");
const Student = require("../../models/StudentModel/studentModel");
const Tutor = require("../../models/TutorModel/tutorModel");

const chatPermissions = {
  Admin: ["Super-Admin", "Sub-Admin", "Co-Admin", "Student", "Tutor"],
  "Super-Admin": ["Admin", "Sub-Admin", "Co-Admin", "Student", "Tutor"],
  "Sub-Admin": ["Super-Admin", "Admin", "Student"],
  "Co-Admin": ["Super-Admin", "Admin", "Tutor"],
  Tutor: ["Super-Admin", "Admin", "Co-Admin"],
  Student: ["Super-Admin", "Admin", "Sub-Admin"],
};

// Fetch all users and categorize them based on userType
const getAllUsersForChatCreation = async () => {
  try {
    const admins = await Admin.find({ isVerified: true }).select("-password");
    const tutors = await Tutor.find({
      isVerified: true,
      isIpaApproved: true,
    }).select("-password");
    const students = await Student.find({ isVerified: true }).select(
      "-password"
    );

    return [
      ...admins.map((admin) => ({
        ...admin._doc,
      })),
      ...tutors.map((tutor) => ({
        ...tutor._doc,
      })),
      ...students.map((student) => ({
        ...student._doc,
      })),
    ];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Function to get the list of users allowed to chat with the current user type
exports.getUsersForChat = async (req, res) => {
  console.log("hello");
  try {
    console.log("hitapi");
    const { currentUserType } = req.query;
    if (!currentUserType) {
      return res.status(400).json({ error: "currentUserType is required" });
    }
    const allUsers = await getAllUsersForChatCreation();
    const allowedUserTypes = chatPermissions[currentUserType];
    if (!allowedUserTypes) {
      return res
        .status(400)
        .json({ error: `Invalid user type: ${currentUserType}` });
    }
    const usersAllowedToChat = allUsers.filter((user) =>
      allowedUserTypes.includes(user.userType)
    );
    return res.json(usersAllowedToChat);
  } catch (error) {
    console.error("Error getting users for chat:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
