const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/session");
const attendanceRoutes = require("./routes/attendance");
const notificationRoutes = require("./routes/notification");
const chatRoutes = require("./routes/chat");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

// Socket.io ko routes mein use karne ke liye
app.set("io", io);

// Frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/smart_attendance")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/chat", chatRoutes);

// Socket.io events
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Room join karo (className ke basis pe)
  socket.on("joinRoom", (className) => {
    socket.join(className);
    console.log(`User joined room: ${className}`);
  });

  // Teacher room join
  socket.on("joinTeacher", () => {
    socket.join("teachers");
    console.log("Teacher joined");
  });

  // Hand raise
  socket.on("handRaise", (data) => {
    io.to("teachers").emit("handRaised", data);
  });

  // Hand down
  socket.on("handDown", (data) => {
    io.to("teachers").emit("handLowered", data);
  });

  // Chat message
  socket.on("sendMessage", (data) => {
    io.to(data.room).emit("newMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server started on port ${PORT}`));