const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // ✅ FIX: sessionId optional rakha — model mein tha hi nahi pehle
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["present", "absent"], default: "present" }
});

module.exports = mongoose.model("Attendance", attendanceSchema);