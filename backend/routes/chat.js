const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Announcement = require("../models/Announcement");
const Message = require("../models/Message");
const User = require("../models/User");

// ✅ Teacher — Announcement bhejo
router.post("/announcement", auth, async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    const { message } = req.body;

    const announcement = new Announcement({
      teacherId: req.user.id,
      teacherName: teacher.name,
      className: teacher.className,
      message
    });

    await announcement.save();

    // Socket.io se sab students ko notify karo
    const io = req.app.get("io");
    io.to(teacher.className).emit("newAnnouncement", announcement);

    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Announcements fetch karo (student + teacher)
router.get("/announcements", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const announcements = await Announcement.find({ className: user.className })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Chat toggle (teacher only)
router.put("/announcement/:id/chat", auth, async (req, res) => {
  try {
    const { enabled } = req.body;
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { chatEnabled: enabled },
      { new: true }
    );

    // Socket.io se notify karo
    const io = req.app.get("io");
    io.to(announcement.className).emit("chatToggled", {
      announcementId: announcement._id,
      chatEnabled: enabled
    });

    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Hand raise (student)
router.post("/announcement/:id/handraise", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const announcement = await Announcement.findById(req.params.id);

    // Already raised check
    const alreadyRaised = announcement.handRaises.find(
      h => h.studentId.toString() === req.user.id
    );

    if (alreadyRaised) {
      // Hand down
      announcement.handRaises = announcement.handRaises.filter(
        h => h.studentId.toString() !== req.user.id
      );
    } else {
      // Hand raise
      announcement.handRaises.push({
        studentId: req.user.id,
        studentName: user.name
      });
    }

    await announcement.save();

    // Socket.io se teacher ko notify karo
    const io = req.app.get("io");
    io.to("teachers").emit("handRaiseUpdate", {
      announcementId: announcement._id,
      handRaises: announcement.handRaises,
      studentName: user.name,
      raised: !alreadyRaised
    });

    res.json({ success: true, handRaises: announcement.handRaises });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Message bhejo
router.post("/message", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { announcementId, message } = req.body;

    const announcement = await Announcement.findById(announcementId);

    // Check chat enabled hai ya nahi
    if (!announcement.chatEnabled && user.role === "student") {
      return res.status(403).json({ message: "Chat is disabled!" });
    }

    const newMessage = new Message({
      announcementId,
      senderId: req.user.id,
      senderName: user.name,
      senderRole: user.role,
      message,
      className: user.className
    });

    await newMessage.save();

    // Socket.io se sab ko notify karo
    const io = req.app.get("io");
    io.to(user.className).emit("newMessage", newMessage);
    io.to("teachers").emit("newMessage", newMessage);

    res.json({ success: true, message: newMessage });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Messages fetch karo
router.get("/messages/:announcementId", auth, async (req, res) => {
  try {
    const messages = await Message.find({ announcementId: req.params.announcementId })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;