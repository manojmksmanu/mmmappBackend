const Admin = require("../models/AdminModel/adminModel");
const NewChat = require("../models/NewChatModel/newChatModel");
const Student = require("../models/StudentModel/studentModel");
const Tutor = require("../models/TutorModel/tutorModel");

const getAllUserIds = async () => {
  const admins = await Admin.find({}).select("_id");
  const tutors = await Tutor.find({}).select("_id");
  const students = await Student.find({}).select("_id");

  return [
    ...admins.map((admin) => admin._id.toString()),
    ...tutors.map((tutor) => tutor._id.toString()),
    ...students.map((student) => student._id.toString()),
  ];
};

exports.deleteChatsForDeletedUsers = async () => {
  try {
    // Get all user IDs from the database
    const currentUserIds = await getAllUserIds();

    // Find all chats
    const chats = await NewChat.find({});

    // Loop through each chat
    for (const chat of chats) {
      // Check if any user in the chat is no longer in the current user IDs
      const usersInChat = chat.users.map((u) => u.user.toString());
      const usersToDelete = usersInChat.filter(
        (userId) => !currentUserIds.includes(userId)
      );

      // If there are users to delete, remove the chat
      if (usersToDelete.length > 0) {
        await NewChat.deleteOne({ _id: chat._id });
        console.log(`Deleted chat with ID: ${chat._id} due to deleted users.`);
      }
    }
  } catch (error) {
    console.error("Error deleting chats for deleted users:", error);
  }
};
