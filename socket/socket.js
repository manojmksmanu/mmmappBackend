const { Server } = require("socket.io");
const Message = require("../models/MessageModel/messageModel");
const {
  sendMessage,
  sendDocument,
} = require("../controllers/MessageController/messageController");

let io;
let onlineUsers = [];
console.log(onlineUsers);
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust this to match your frontend URL in production
    },
  });
  console.log("Socket.io initialized");
  io.on("connection", (socket) => {
    console.log(onlineUsers, "connection");
    socket.on("userOnline", (userId) => {
      if (!onlineUsers.some((user) => user.userId === userId)) {
        onlineUsers.push({ userId, socketId: socket.id });
      }
      console.log(onlineUsers, "online");
      io.emit("getOnlineUsers", onlineUsers);
    });

    socket.on("joinRoom", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined room ${chatId}`);
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
      console.log(messageId);
      const newMessage = new Message({
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
      try {
        await sendMessage(messageData);
        io.to(chatId).emit("receiveMessage", newMessage);

        // Emit message to the specific room
        console.log("Message emitted to chatId:", chatId);
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
        status: "sent",
      });
      try {
        await sendDocument(messageData); // Persist message to DB
        io.to(chatId).emit("receiveDocument", newMessage);
        console.log("Document emitted to chatId:", chatId);
      } catch (err) {
        console.error("Error sending document:", err);
        // Optionally handle resending logic here
      }
    });

    socket.on("fetch", async (data) => {
      console.log(data);
      try {
        io.emit("fetchAgain", data);
        console.log("inside try");
      } catch {
        console.log("inside catch");
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
              return newMessage;
            })
          );
          console.log(newMessages, "socketworking");
          // Emit event to other clients
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
