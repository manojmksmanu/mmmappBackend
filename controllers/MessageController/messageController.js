const Message = require("../../models/MessageModel/messageModel");
const NewChat = require("../../models/NewChatModel/newChatModel");
// Send message
exports.sendMessage = async (messageData) => {
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
  console.log(sender);
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

  const updatedChat = await NewChat.findOneAndUpdate(
    { _id: chatId },
    {
      latestMessage: newMessage,
      updatedAt: Date.now(),
    },
    { new: true }
  ).populate("latestMessage");
  return updatedChat;
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
    status: "sent",
  });
  console.log(newMessage);
  // Update the latest message in the chat and ensure updatedAt is set
  const updatedChat = await NewChat.findOneAndUpdate(
    { _id: chatId },
    {
      latestMessage: newMessage,
      updatedAt: Date.now(), // Ensure updatedAt is manually set
    },
    { new: true }
  ).populate("latestMessage");

  //   res
  //     .status(201)
  //     .json({ message: "Message created successfully", newMessage });
  // } catch (error) {
  //   console.error("Error creating message:", error);
  //   res.status(500).json({ message: "Server Error" });
  // }
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

  // Validate input
  if (!chatId || !userId) {
    return res.status(400).send("chatId and userId are required");
  }

  try {
    const messages = await Message.find({ chatId });

    // Check if messages were found
    if (!messages.length) {
      console.log(`No messages found for chatId: ${chatId}`);
      return res.status(404).send("No messages found");
    }

    const updates = messages.map(async (message) => {
      // Check if user has already read the message
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        message.status = "read";
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
    console.error("Error marking messages as read:", error.message || error);
    return res.status(500).send("Unable to mark messages as read");
  }
};

