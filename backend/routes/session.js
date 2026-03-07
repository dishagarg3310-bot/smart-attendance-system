const express = require("express");
const QRCode = require("qrcode");
const Session = require("../models/Session");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
const PushSubscription = require("../models/PushSubscription");
const Notification = require("../models/Notification");
const webpush = require("web-push");

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

webpush.setVapidDetails(
  "mailto:admin@smartattendance.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Session start + QR generate
router.post("/start", auth, async (req, res) => {
  try {
    const { subject, className } = req.body;
    const teacherId = req.user.id;

    if (!subject || !className) {
      return res.status(400).json({ message: "Subject aur Class required hai" });
    }

    // Purani active session band karo
    await Session.updateMany({ teacherId, isActive: true }, { isActive: false });

    const session = new Session({ teacherId, subject, className });
    await session.save();

    const qrData = JSON.stringify({
      sessionId: session._id,
      subject,
      className,
      timestamp: Date.now()
    });

    const qrCode = await QRCode.toDataURL(qrData);

    // ✅ Students ko notify karo
    const students = await User.find({
      role: "student",
      className: { $regex: new RegExp(`^${className}$`, "i") }
    }).select("_id").lean();

    const studentIds = students.map(s => s._id);

    // In-app notifications save karo
    if (studentIds.length > 0) {
      await Notification.insertMany(studentIds.map(id => ({
        userId: id,
        title: "📢 Class Shuru Ho Gayi!",
        body: `${subject} — ${className} ki attendance le rahe hain!`,
        sessionId: session._id.toString()
      })));

      // Push notifications bhejo
      const subscriptions = await PushSubscription.find({
        userId: { $in: studentIds }
      }).lean();

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(sub.subscription, JSON.stringify({
            title: "📢 Class Shuru Ho Gayi!",
            body: `${subject} — ${className} ki attendance le rahe hain!`,
            sessionId: session._id.toString()
          }));
        } catch (err) {
          if (err.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: sub._id });
          }
        }
      }
    }

    return res.status(201).json({ sessionId: session._id, qrCode });

  } catch (error) {
    console.error("SESSION ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// QR Refresh
router.get("/refresh-qr/:sessionId", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session || !session.isActive) {
      return res.status(404).json({ message: "Session not found" });
    }

    const qrData = JSON.stringify({
      sessionId: session._id,
      subject: session.subject,
      className: session.className,
      timestamp: Date.now()
    });

    const qrCode = await QRCode.toDataURL(qrData);
    res.json({ qrCode });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Session stop
router.post("/stop/:sessionId", auth, async (req, res) => {
  try {
    await Session.findByIdAndUpdate(req.params.sessionId, { isActive: false });
    res.json({ message: "Session stopped" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;