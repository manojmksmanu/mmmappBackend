const { Server } = require("socket.io");
const Message = require("../models/MessageModel/messageModel");
const {
  sendMessage,
  sendDocument,
} = require("../controllers/MessageController/messageController");
const NewChat = require("../models/NewChatModel/newChatModel");

let io;
let onlineUsers = [];
console.log(onlineUsers);
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
  console.log("Socket.io initialized");
  io.on("connection", (socket) => {
    socket.on("userOnline", (userId) => {
      if (!onlineUsers.some((user) => user.userId === userId)) {
        onlineUsers.push({ userId, socketId: socket.id });
      }
      io.emit("getOnlineUsers", onlineUsers);
    });
    socket.on("joinRoom", (chatIds) => {
      chatIds.forEach((chatId) => {
        socket.join(chatId);
      });
    });

    socket.on("markMessageMMKV", ({ userId, chatId }) => {
      io.to(chatId).emit("markMessageToReadRealTimeMMKV", {
        userId: userId,
        chatId: chatId,
      });
    });

    socket.on("sendMessage", async (messageData) => {
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
      const newMessage = {
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
      };
      try {
        await sendMessage(newMessage);
        io.emit("fetchAgain", chatId);
        io.to(chatId).emit("receiveMessage", newMessage);
      } catch (err) {
        console.log(err, "error");
      }
    });

    socket.on("sendDocument", async (messageData) => {
      const {
        chatId,
        sender,
        senderName,
        message,
        fileUrl,
        fileType,
        messageId,
        replyingMessage,
      } = messageData;

      const newMessage = new Message({
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
      try {
        await sendDocument(newMessage);
        io.to(chatId).emit("receiveDocument", newMessage);
      } catch (err) {
        console.error("Error sending document:", err);
      }
    });
    socket.on(
      "forwardMessage",
      async ({ chatId, messages, loggedUserId, loggedUserName }) => {
        console.log(
          chatId,
          "chatId",
          messages,
          "messages",
          loggedUserId,
          "loggedUserId",
          loggedUserName,
          "loggedUsernae"
        );
        try {
          const newMessages = await Promise.all(
            messages.map(async (msg) => {
              const newMessage = new Message({
                chatId: chatId,
                sender: loggedUserId,
                senderName: loggedUserName,
                message: msg.message,
                replyingMessage: "",
                createdAt: new Date(),
              });
              await sendDocument(newMessage);
              return newMessage;
            })
          );
          console.log(newMessages, "socketworking");

          io.to(chatId).emit("forwarMessageReceived", newMessages);
        } catch (error) {
          console.log(error);
        }
      }
    );

    // Handle logout event
    socket.on("logout", (userId) => {
      onlineUsers = onlineUsers.filter((user) => user.userId !== userId);
      console.log(onlineUsers, "👌👌👌👌👌👌👌👌👌👌");
      io.emit("getOnlineUsers", onlineUsers);
    });
    // Handle user disconnect
    socket.on("disconnect", () => {
      const user = onlineUsers.find((user) => user.socketId === socket.id);
      if (user) {
        onlineUsers = onlineUsers.filter(
          (u) => u.userId !== user.userId || u.socketId !== socket.id
        );
        if (!onlineUsers.some((u) => u.userId === user.userId)) {
          io.emit("getOnlineUsers", onlineUsers);
        }
      }
      console.log("A user disconnected:", socket.id);
    });
  });

  return io;
}

function getSocketInstance() {
  if (!io) {
    throw new Error("Socket.io not initialized! Call initSocket first.");
  }
  return io;
}

module.exports = { initSocket, getSocketInstance };
