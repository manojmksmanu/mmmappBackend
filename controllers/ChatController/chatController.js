const Admin = require("../../models/AdminModel/adminModel");
const NewChat = require("../../models/NewChatModel/newChatModel");
const Message = require("../../models/MessageModel/messageModel");
const Student = require("../../models/StudentModel/studentModel");
const Tutor = require("../../models/TutorModel/tutorModel");
const { createChatId } = require("../../misc/misc");
const { deleteChatsForDeletedUsers } = require("../../misc/deleteChat");
const crypto = require("crypto");
const chatPermissions = {
  Admin: ["Super-Admin", "Sub-Admin", "Co-Admin", "Student", "Tutor"],
  "Super-Admin": ["Admin", "Sub-Admin", "Co-Admin", "Student", "Tutor"],
  "Sub-Admin": ["Super-Admin", "Admin", "Student"],
  "Co-Admin": ["Super-Admin", "Admin", "Tutor"],
  Tutor: ["Super-Admin", "Admin", "Co-Admin"],
  Student: ["Super-Admin", "Admin", "Sub-Admin"],
};

getAllUsersForChatCreation = async () => {
  const admins = await Admin.find({});
  const tutors = await Tutor.find({ isIpaApproved: true });
  const students = await Student.find({});

  return [
    ...admins.map((admin) => ({
      _id: admin._id,
      userType: admin.userType,
    })),
    ...tutors.map((tutor) => ({
      _id: tutor._id,
      userType: tutor.userType,
    })),
    ...students.map((student) => ({
      _id: student._id,
      userType: student.userType,
    })),
  ];
};

exports.createChatsForAllUsers = async () => {
  try {
    const users = await getAllUsersForChatCreation();
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const user1 = users[i];
        const user2 = users[j];

        // Check if user1 is allowed to chat with user2
        if (chatPermissions[user1.userType]?.includes(user2.userType)) {
          // Check if a chat already exists between these users
          const existingChat = await NewChat.findOne({
            $and: [{ "users.user": user1._id }, { "users.user": user2._id }],
          });

          const chatId = createChatId(user1, user2);

          const refModel1 = [
            "Admin",
            "Super-Admin",
            "Sub-Admin",
            "Co-Admin",
          ].includes(user1.userType)
            ? "Admin"
            : user1.userType;
          const refModel2 = [
            "Admin",
            "Super-Admin",
            "Sub-Admin",
            "Co-Admin",
          ].includes(user2.userType)
            ? "Admin"
            : user2.userType;

          // If no existing chat, create a new one
          if (!existingChat) {
            const chatBetween = `Created chat between ${user1.userType} (${user1.name}) and ${user2.userType} (${user2.name})`;
            const newChat = new NewChat({
              chatId: chatId,
              chatType: "one-to-one",
              users: [
                {
                  user: user1._id,
                  userType: user1.userType, // Assign userType for user1
                  // refModel: refModel1, // Assign refModel for user1
                  refModel: refModel1, // Assign refModel for user1
                },
                {
                  user: user2._id,
                  userType: user2.userType, // Assign userType for user2
                  // refModel: refModel2, // Assign refModel for user2
                  refModel: refModel2, // Assign refModel for user2
                },
              ],
            });

            await newChat.save();
            console.log(
              `Created chat between ${user1.userType} (${user1._id}) and ${user2.userType} (${user2._id})`
            );
          } else {
            console.log(
              `Chat already exists between ${user1.userType} (${user1._id}) and ${user2.userType} (${user2._id})`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error creating chats:", error);
  }
};

exports.createChatsForLoggedUser = async () => {
  try {
    const users = await getAllUsersForChatCreation();

    for (let j = i + 1; j < users.length; j++) {
      const user1 = users[i];
      const user2 = users[j];

      // Check if user1 is allowed to chat with user2
      if (chatPermissions[user1.userType]?.includes(user2.userType)) {
        // Check if a chat already exists between these users
        const existingChat = await NewChat.findOne({
          $and: [{ "users.user": user1._id }, { "users.user": user2._id }],
        });

        const chatId = createChatId(user1, user2);

        const refModel1 = [
          "Admin",
          "Super-Admin",
          "Sub-Admin",
          "Co-Admin",
        ].includes(user1.userType)
          ? "Admin"
          : user1.userType;
        const refModel2 = [
          "Admin",
          "Super-Admin",
          "Sub-Admin",
          "Co-Admin",
        ].includes(user2.userType)
          ? "Admin"
          : user2.userType;

        // If no existing chat, create a new one
        if (!existingChat) {
          const chatBetween = `Created chat between ${user1.userType} ${user1.name} and ${user2.userType} ${user2.name}`;
          const newChat = new NewChat({
            chatId: chatId,
            chatType: "one-to-one",
            users: [
              {
                user: user1._id,
                userType: user1.userType, // Assign userType for user1
                // refModel: refModel1, // Assign refModel for user1
                refModel: refModel1, // Assign refModel for user1
              },
              {
                user: user2._id,
                userType: user2.userType, // Assign userType for user2
                // refModel: refModel2, // Assign refModel for user2
                refModel: refModel2, // Assign refModel for user2
              },
            ],
          });

          await newChat.save();
          console.log(
            `Created chat between ${user1.userType} (${user1._id}) and ${user2.userType} (${user2._id})`
          );
        } else {
          console.log(
            `Chat already exists between ${user1.userType} (${user1._id}) and ${user2.userType} (${user2._id})`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error creating chats:", error);
  }
};

exports.getChatsForUser = async (userId) => {
  try {
    const chats = await NewChat.find({ "users.user": userId })
      .populate({
        path: "users.user",
        select: "-password",
      })
      .populate({
        path: "latestMessage",
        model: "Message",
      })
      .sort({ updatedAt: -1 });
    console.log("updated");

    await deleteChatsForDeletedUsers();
    return chats;
  } catch (error) {
    console.error("Error fetching chats for user:", error);
    throw error;
  }
};

function createChatIdByDateTime() {
  const dateTime = new Date().toISOString();
  console.log(dateTime, "dateTime");
  return crypto.createHash("md5").update(dateTime).digest("hex");
}

exports.createGroupChat = async (req, res) => {
  console.log("hitcreategroup");
  const { users, groupName } = req.body;
  console.log(users, "users", groupName);
  if (!users || users.length < 2) {
    return res.status(400).json({
      message: "Minimum of 2 users are required to create a group chat",
    });
  }

  try {
    // Check if group name already exists
    // const existingGroupChat = await NewChat.findOne({ groupName });
    // if (existingGroupChat) {
    //   return res.status(400).json({
    //     message: "Group name already exists. Please choose a different name.",
    //   });
    // }

    const newGroupChat = new NewChat({
      chatId: createChatIdByDateTime(),
      chatType: "group",
      groupName: groupName,
      users: users.map((user) => ({
        user: user._id,
        userType: user.userType,
        refModel: ["Admin", "Super-Admin", "Sub-Admin", "Co-Admin"].includes(
          user.userType
        )
          ? "Admin"
          : user.userType,
      })),
    });

    await newGroupChat.save();
    console.log(`Created group chat: ${groupName}`);

    res.status(201).json({
      message: "Group chat created successfully",
      chat: newGroupChat,
    });
  } catch (error) {
    console.error("Error creating group chat:", error);
    res.status(500).json({
      message: "Error creating group chat",
      error: error.message,
    });
  }
};

//   const { users, groupName } = req.body;
//   console.log(users, groupName);
//   try {
//     const newGroupChat = new NewChat({
//       chatId: createChatIdByDateTime(),
//       chatType: "group",
//       groupName: groupName,
//       users: users.map((user) => ({
//         user: user._id,
//         userType: user.userType,
//         refModel: ["Admin", "Super-Admin", "Sub-Admin", "Co-Admin"].includes(
//           user.userType
//         )
//           ? "Admin"
//           : user.userType,
//       })),
//     });

//     console.log("hello world");
//     await newGroupChat.save();
//     console.log(`Created group chat: ${groupName} `);

//     // Send a success response with the newly created group chat
//     res.status(201).json({
//       message: "Group chat created successfully",
//       chat: newGroupChat,
//     });
//   } catch (error) {
//     console.error("Error creating group chat:", error);

//     // Send an error response
//     res.status(500).json({
//       message: "Error creating group chat",
//       error: error.message,
//     });
//   }
// };
exports.addUserToGroupChat = async (req, res) => {
  const { chatId, users } = req.body;
  console.log(users, chatId);
  try {
    const groupChat = await NewChat.findById(chatId);

    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    const alreadyInGroup = [];
    for (const user of users) {
      const userExists = groupChat.users.some(
        (u) => u.user.toString() === user._id.toString()
      );
      if (userExists) {
        alreadyInGroup.push(`User ${user._id} is already in the group`);
        return res.status(404).json({ message: "User is already in group" });
      } else {
        groupChat.users.push({
          user: user._id,
          userType: user.userType,
          refModel: ["Admin", "Super-Admin", "Sub-Admin", "Co-Admin"].includes(
            user.userType
          )
            ? "Admin"
            : user.userType,
        });
      }
    }
    await groupChat.save();
    await groupChat.populate("users.user");
    res.status(200).json({
      message: "Users added to group chat successfully",
      alreadyInGroup,
      chat: groupChat,
    });
  } catch (error) {
    console.error("Error adding user to group chat:", error);
    res.status(500).json({
      message: "Error adding user to group chat",
      error: error.message,
    });
  }
};

exports.removeUserFromGroupChat = async (req, res) => {
  const { chatId, userId } = req.body;
  console.log(chatId, userId);
  try {
    const groupChat = await NewChat.findById(chatId);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Check if removing this user would leave the group empty
    if (groupChat.users.length <= 1) {
      return res.status(400).json({
        message: "Group chat cannot be empty. At least one user must remain.",
      });
    }

    const userIndex = groupChat.users.findIndex(
      (u) => u.user.toString() === userId
    );
    if (userIndex === -1) {
      console.log("User not found in the group");
      return res.status(400).json({ message: "User not found in the group" });
    }

    groupChat.users.splice(userIndex, 1);
    await groupChat.save();
    await groupChat.populate("users.user");
    res.status(200).json({
      message: "User removed from group chat successfully",
      chat: groupChat,
    });
  } catch (error) {
    console.error("Error removing user from group chat:", error);
    res.status(500).json({
      message: "Error removing user from group chat",
      error: error.message,
    });
  }
};

exports.deleteGroupChat = async (req, res) => {
  const { chatId } = req.body;

  try {
    const groupChat = await NewChat.findById(chatId);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }
    await NewChat.deleteOne({ _id: chatId });
    await Message.deleteMany({ chatId: chatId });
    res.status(200).json({
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({
      message: "Error deleting chat",
      error: error.message,
    });
  }
};
exports.renameGroupChat = async (req, res) => {
  console.log("hitRenameGroup");

  const { chatId, newGroupName } = req.body;
  console.log(chatId, newGroupName);

  if (!chatId || !newGroupName) {
    return res.status(400).json({
      message: "Chat ID and new group name are required",
    });
  }

  try {
    // Check if group exists
    const groupChat = await NewChat.findOne({ _id: chatId });
    if (!groupChat) {
      console.log("Group chat not found");
      return res.status(404).json({
        message: "Group chat not found",
      });
    }

    // Log before updating
    console.log(
      `Renaming group chat from ${groupChat.groupName} to ${newGroupName}`
    );

    // Update the group name
    groupChat.groupName = newGroupName;
    await groupChat.save();
    await groupChat.populate("users.user");

    res.status(200).json({
      message: "Group chat renamed successfully",
      chat: groupChat,
    });
  } catch (error) {
    console.error("Error renaming group chat:", error);
    res.status(500).json({
      message: "Error renaming group chat",
      error: error.message,
    });
  }
};
