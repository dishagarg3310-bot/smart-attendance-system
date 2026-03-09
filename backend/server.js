const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/session");
const attendanceRoutes = require("./routes/attendance");
const notificationRoutes = require("./routes/notification");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server started on port ${PORT}`));