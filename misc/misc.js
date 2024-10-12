const Admin = require("../models/AdminModel/adminModel");
const Message = require("../models/MessageModel/messageModel");
const NewChat = require("../models/NewChatModel/newChatModel");
const Student = require("../models/StudentModel/studentModel");
const Tutor = require("../models/TutorModel/tutorModel");
const { deleteChatsForDeletedUsers } = require("./deleteChat");

exports.createChatId = (user1, user2) => {
  // Ensure that the chatId is always the same regardless of the order of the users
  return user1._id < user2._id
    ? `${user1._id}-${user2._id}`
    : `${user2._id}-${user1._id}`;
};

exports.findUserById = async ({ userId }) => {
  let user;

  // Check in Student model
  user = await Student.findById(userId).select("-password");

  if (user) return user;

  // Check in Tutor model
  user = await Tutor.findById(userId).select("-password");
  if (user) return user;

  // Check in Admin model
  user = await Admin.findById(userId).select("-password");
  if (user) return user;

  // If no user found in any of the models
  return null;
};

exports.deleteChatsForUser = async (userId) => {
  try {
    // Find all one-to-one chats where the user is part of the chat
    const chatsToDelete = await NewChat.find({
      chatType: "one-to-one",
      "users.user": userId,
    });

    if (chatsToDelete.length === 0) {
      console.log("No one-to-one chats found for the user.");
      return;
    }

    // Extract chatIds for all found chats
    const chatIdsToDelete = chatsToDelete.map((chat) => chat.chatId);

    // Delete all found chats
    await NewChat.deleteMany({ chatId: { $in: chatIdsToDelete } });
    console.log(`Deleted ${chatsToDelete.length} chats for user: ${userId}`);

    // Delete all messages associated with those chatIds
    await Message.deleteMany({ chatId: { $in: chatIdsToDelete } });
    console.log(
      `Deleted messages for ${chatsToDelete.length} chats associated with user: ${userId}`
    );
  } catch (error) {
    console.error("Error deleting chats and messages for user:", error);
  }
};
