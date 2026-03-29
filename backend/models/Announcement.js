const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  teacherName: { type: String, required: true },
  className: { type: String, required: true },
  message: { type: String, required: true },
  chatEnabled: { type: Boolean, default: false },
  handRaises: [{ 
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    studentName: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Announcement", announcementSchema);