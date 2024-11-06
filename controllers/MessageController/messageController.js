const sendPushNotification = require("../../misc/expoPushNotification");
const Message = require("../../models/MessageModel/messageModel");
const NewChat = require("../../models/NewChatModel/newChatModel");
const axios = require("axios");
const { Expo } = require("expo-server-sdk");

const expo = new Expo();
// Send message

// exports.sendMessage = async (messageData, onlineUsers) => {
//   try {
//     const {
//       chatId,
//       sender,
//       senderName,
//       message,
//       fileUrl,
//       fileType,
//       messageId,
//       replyingMessage,
//       status,
//     } = messageData;
//     console.log(sender, "sender");
//     const newMessage = await Message.create({
//       chatId,
//       sender,
//       senderName,
//       message,
//       fileUrl,
//       fileType,
//       messageId,
//       replyingMessage,
//       readBy: [sender],
//       status: "sent",
//     });
//     const updatedChat = await NewChat.findOneAndUpdate(
//       { _id: chatId },
//       {
//         latestMessage: newMessage,
//         updatedAt: Date.now(),
//       },
//       { new: true }
//     )
//       .populate({ path: "users.user" })
//       .populate("latestMessage");
//     const otherUsers = updatedChat.users.filter(
//       (user) => user.user && user.user._id.toString() !== sender
//     );

//     console.log(onlineUsers, "onlineusers ");
//     // Filter offline users
//     const offlineUsers = otherUsers.filter(
//       (user) => !onlineUsers.includes(user.user._id.toString()) // Check if the user is not in the onlineUsers array
//     );
//     if (offlineUsers.length > 0) {
//       const sendNotificationToUsers = offlineUsers.map(async (user) => {
//         console.log(user.user, "hello");
//         const messageBody = `${senderName}: ${message}`; // Customize as needed
//         const data = {
//           chatId,
//           sender,
//           senderName,
//           messageId,
//           message,
//           fileUrl,
//           fileType,
//           replyingMessage,
//           status: "sent", // Or use dynamic status
//         };

//         const expoPushToken = user.user.expoPushToken;
//         if (expoPushToken) {
//           return sendPushNotification(expoPushToken, messageBody, data);
//         } else {
//           console.warn(`No Expo push token for user: ${user.user._id}`);
//         }
//       });
//       await Promise.all(sendNotificationToUsers);
//       // You can perform further actions if needed
//     } else {
//       console.log("This user is the only participant in the chat.");
//     }
//     console.log("finish");
//     return updatedChat;
//   } catch (error) {
//     console.error("Error in sendMessage:", error);
//   }
// };
exports.sendMessage = async (messageData, onlineUsers) => {
  try {
    const {
      chatId,
      sender,
      senderName,
      message,
      fileUrl,
      fileType,
      messageId,
      replyingMessage,
      status,
    } = messageData;
    console.log(sender, "sender");

    // Save the new message to the database
    const newMessage = await Message.create({
      chatId,
      sender,
      senderName,
      message,
      fileUrl,
      fileType,
      messageId,
      replyingMessage,
      readBy: [sender],
      status: "sent",
    });

    // Update the chat with the latest message
    const updatedChat = await NewChat.findOneAndUpdate(
      { _id: chatId },
      {
        latestMessage: newMessage,
        updatedAt: Date.now(),
      },
      { new: true }
    )
      .populate({ path: "users.user" })
      .populate("latestMessage");

    // Get all users except the sender
    const otherUsers = updatedChat.users.filter(
      (user) => user.user && user.user._id.toString() !== sender
    );

    if (otherUsers.length > 0) {
      const sendNotificationToUsers = otherUsers.map(async (user) => {
        try {
          console.log(user.user, "Sending notification to offline user");
          const messageBody = ` ${message}`; // Customize the message as needed
          const title = ` ${senderName}`; // Customize the message as needed
          const data = {
            chatId,
            sender,
            senderName,
            messageId,
            message,
            fileUrl,
            fileType,
            replyingMessage,
            readBy: [sender],
            status: "sent", // You can use dynamic status
          };

          const expoPushToken = user.user.expoPushToken;
          if (expoPushToken) {
            // Send push notification
            await sendPushNotification(expoPushToken, title, messageBody, data);
          } else {
            console.warn(`No Expo push token for user: ${user.user._id}`);
          }
        } catch (error) {
          console.error(
            `Error sending notification to ${user.user._id}:`,
            error
          );
        }
      });

      // Await all notification send operations
      await Promise.all(sendNotificationToUsers);
    } else {
      console.log(
        "All users are online or this user is the only participant in the chat."
      );
    }

    console.log("finish");
    return updatedChat;
  } catch (error) {
    console.error("Error in sendMessage:", error);
  }
};

// Send message
exports.sendDocument = async (messageData) => {
  const {
    chatId,
    sender,
    senderName,
    message,
    fileUrl,
    fileType,
    messageId,
    replyingMessage,
    status,
  } = messageData;
  // try {
  // Create the new message
  const newMessage = await Message.create({
    chatId,
    sender,
    senderName,
    message,
    fileUrl,
    fileType,
    messageId,
    replyingMessage,
    readBy: [sender],
    status: "sent",
  });
  // Update the latest message in the chat and ensure updatedAt is set
  const updatedChat = await NewChat.findOneAndUpdate(
    { _id: chatId },
    {
      latestMessage: newMessage,
      updatedAt: Date.now(), // Ensure updatedAt is manually set
    },
    { new: true }
  ).populate("latestMessage");

  // Get all users except the sender
  const otherUsers = updatedChat.users.filter(
    (user) => user.user && user.user._id.toString() !== sender
  );

  if (otherUsers.length > 0) {
    const sendNotificationToUsers = otherUsers.map(async (user) => {
      try {
        const messageBody = ` ${message}`; // Customize the message as needed
        const title = ` ${senderName}`; // Customize the message as needed
        const data = {
          chatId,
          sender,
          senderName,
          messageId,
          message,
          fileUrl,
          fileType,
          replyingMessage,
          readBy: [sender],
          status: "sent", // You can use dynamic status
        };
        const expoPushToken = user.user.expoPushToken;
        if (expoPushToken) {
          await sendPushNotification(expoPushToken, title, messageBody, data);
        } else {
          console.warn(`No Expo push token for user: ${user.user._id}`);
        }
      } catch (error) {
        console.error(`Error sending notification to ${user.user._id}:`, error);
      }
    });

    // Await all notification send operations
    await Promise.all(sendNotificationToUsers);
  } else {
    console.log(
      "All users are online or this user is the only participant in the chat."
    );
  }

  console.log("finish");
  return updatedChat;
};
// Get messages
exports.getMessages = async (req, res) => {
  const { chatId } = req.params;

  try {
    const messages = await Message.find({ chatId: chatId })
      .populate("sender", "name pic email")
      .populate("chatId");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};
// Get All messages related to usre
exports.getAllMessages = async (req, res) => {
  const { userId } = req.params; // Assuming userId is sent in the request parameters
  console.log(userId, "hit this");
  try {
    // Fetch all chats that the user is a part of
    const chats = await NewChat.find({ "users.user": userId }).select("_id"); // Ensure the userId exists in the users array

    // Check if any chats were found
    if (!chats.length) {
      return res.status(404).json({ message: "No chats found for this user" });
    }

    // Get an array of chat IDs
    const chatIds = chats.map((chat) => chat._id);

    // Fetch messages from all chats the user is part of
    const messages = await Message.find({ chatId: { $in: chatIds } })
      .populate("sender", "name pic email")
      .populate("chatId");

    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.forwardMessages = async (req, res) => {
  const { chatId, messages, loggedUserId, loggedUserName } = req.body;
  try {
    const newMessages = await Promise.all(
      messages.map(async (msg) => {
        const newMessage = new Message({
          chatId,
          sender: loggedUserId,
          senderName: loggedUserName,
          message: msg.message,
          replyingMessage: "",
          createdAt: new Date(),
        });
        await newMessage.save();
        return newMessage;
      })
    );
    res
      .status(201)
      .json({ message: "Messages forwarded successfully", newMessages });
  } catch (error) {
    console.error("Failed to forward messages:", error);
    res
      .status(500)
      .json({ error: "Failed to forward messages", details: error.message });
  }
};

// exports.markMessagesAsRead = async (req, res) => {
//   const { chatId, userId } = req.body;

//   // Validate input
//   if (!chatId || !userId) {
//     return res.status(400).send("chatId and userId are required");
//   }

//   try {
//     const messages = await Message.find({ chatId });

//     // Check if messages were found
//     if (!messages.length) {
//       console.log(`No messages found for chatId: ${chatId}`);
//       return res.status(404).send("No messages found");
//     }

//     const updates = messages.map(async (message) => {
//       // Check if user has already read the message
//       if (!message.readBy.includes(userId)) {
//         message.readBy.push(userId);
//         message.status = "read";
//         return await message.save(); // Await here to handle save errors
//       }
//     });

//     // Await all updates
//     await Promise.all(updates);
//     console.log(
//       `Marked messages as read for user: ${userId} in chatId: ${chatId}`
//     );
//     res.status(200).send("Messages marked as read successfully");
//   } catch (error) {
//     console.error("Error marking messages as read:", error.message || error);
//     return res.status(500).send("Unable to mark messages as read");
//   }
// };
exports.markMessagesAsRead = async (req, res) => {
  const { chatId, userId } = req.body;
  console.log("mark", chatId, userId);
  // Validate input
  if (!chatId || !userId) {
    return res.status(400).send("chatId and userId are required");
  }

  console.log("Request Body:", req.body); // Log the request body

  try {
    const messages = await Message.find({ chatId });

    // Check if messages were found
    if (!messages.length) {
      console.log(`No messages found for chatId: ${chatId}`);
      return res.status(200).send("No messages found");
    }

    // Find the chat associated with the chatId
    const chat = await NewChat.findById(chatId).populate("users.user"); // Assuming 'users' references to user models

    if (!chat) {
      console.log(`Chat not found for chatId: ${chatId}`);
      return res.status(404).send("Chat not found");
    }

    const allUserIds = chat.users.map((user) => user.user._id.toString());

    const updates = messages.map(async (message) => {
      // Check if user has already read the message
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        // Check if all users have read the message
        const allRead = allUserIds.every((id) => message.readBy.includes(id));
        message.status = allRead ? "read" : "sent"; // Set status based on readBy array
        return await message.save(); // Await here to handle save errors
      }
    });

    // Await all updates
    await Promise.all(updates);
    console.log(
      `Marked messages as read for user: ${userId} in chatId: ${chatId}`
    );
    res.status(200).send("Messages marked as read successfully");
  } catch (error) {
    console.error(
      "Error marking messages as read:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).send("Unable to mark messages as read");
  }
};
