const express = require("express");
const connectDB = require("./config/db");
const http = require("http");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/MessageRoutes");
const chatRoutes = require("./routes/chatRoutes");
const countryRoutes = require("./routes/countryRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
const { initSocket } = require("./socket/socket");
const { deleteChatsForDeletedUsers } = require("./misc/deleteChat");
const {
  createChatsForAllUsers,
} = require("./controllers/ChatController/chatController");
require("dotenv").config();
connectDB();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

const server = http.createServer(app);
initSocket(server);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api", messageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/country", countryRoutes);
app.use("/api/subject", subjectRoutes);
app.use("/api", userRoutes);

const getData = async () => {
  await deleteChatsForDeletedUsers();
  // const data = await createChatsForAllUsers();
};
console.log("on indexpage");
getData();

server.listen(5000, () => {
  console.log("Socket.IO running on port 5000");
});
