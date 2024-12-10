const sendPushNotification = require("../../misc/expoPushNotification");
const Message = require("../../models/MessageModel/messageModel");
const NewChat = require("../../models/NewChatModel/newChatModel");

exports.sendMessage = async (messageData) => {
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
      readBy: [sender], // Mark the sender as having read the message
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
          const chat = await NewChat.findOne({ _id: chatId });

          // Check if the user has already read the message
          const alreadyRead = chat.readBy?.some(
            (readUser) => readUser.toString() === user.user._id.toString()
          );

          // If the user has not read the message, increment their unread count
          if (!alreadyRead) {
            await NewChat.findOneAndUpdate(
              { _id: chatId },
              {
                $inc: { [`unreadCounts.${user.user._id}`]: 1 },
              },
              { new: true }
            );
          }

          // Prepare and send the notification
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
            status: "sent",
          };

          const expoPushToken = user.user.expoPushToken;
          if (expoPushToken) {
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
        const messageBody = `${message}`; // Customize the message as needed
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

exports.forwardMessages = async (req, res) => {
  const { chatId, messages, loggedUserId, loggedUserName } = req.body;
  console.log(messages, chatId);
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

exports.markMessagesAsRead = async (req, res) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    return res.status(400).send("chatId and userId are required");
  }
  try {
    const updatingChat = await NewChat.findById(chatId);
    if (!updatingChat) {
      return res.status(404).send("Chat not found");
    }

    if (updatingChat.unreadCounts.has(userId)) {
      updatingChat.unreadCounts.set(userId, 0);
    }
    await updatingChat.save({ timestamps: false });
    const messages = await Message.find({ chatId });
    if (!messages.length) {
      return res.status(200).send("No messages found");
    }
    const chat = await NewChat.findById(chatId).populate("users.user");
    if (!chat) {
      return res.status(404).send("Chat not found");
    }
    const allUserIds = chat.users.map((user) => user.user._id.toString());
    const updates = messages.map(async (message) => {
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        const allRead = allUserIds.every((id) => message.readBy.includes(id));
        message.status = allRead ? "read" : "sent";
        return await message.save();
      }
    });
    await Promise.all(updates);
    res.status(200).send("Messages marked as read successfully");
  } catch (error) {
    console.error(
      "Error marking messages as read:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).send("Unable to mark messages as read");
  }
};
