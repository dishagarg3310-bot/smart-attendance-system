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

// ✅ FIX 1: CORS - ngrok ke liye sab origins allow karo
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
  credentials: false
}));

// ✅ FIX 2: Preflight OPTIONS requests handle karo (Express v5 syntax)
app.options("/{*path}", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FIX 3: Ngrok browser warning bypass - sab responses pe
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

// Frontend static files serve karo
app.use(express.static(path.join(__dirname, "../frontend")));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/smart_attendance")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);

// Frontend index.html serve karo
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ✅ FIX 4: Global error handler - 500 errors yahan pakde jaayenge
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

app.use("/api/notification", notificationRoutes);
// ✅ FIX 5: 0.0.0.0 pe listen karo - ngrok ke liye zaroori
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server started on port ${PORT}`));
