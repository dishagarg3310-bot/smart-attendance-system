const express = require("express");
const router = express.Router();
const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

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

// ✅ Student apna subscription save kare
router.post("/subscribe", auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.id;

    // Purani subscription replace karo
    await PushSubscription.findOneAndUpdate(
      { userId },
      { userId, subscription },
      { upsert: true, new: true }
    );

    res.json({ message: "Subscribed!" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Teacher session start kare toh notify karo
router.post("/session-started", auth, async (req, res) => {
  try {
    const { subject, className, sessionId } = req.body;

    // Is class ke saare students dhundho
    const students = await User.find({
      role: "student",
      className: { $regex: new RegExp(`^${className}$`, "i") }
    }).select("_id").lean();

    const studentIds = students.map(s => s._id);

    // Unki subscriptions lo
    const subscriptions = await PushSubscription.find({
      userId: { $in: studentIds }
    }).lean();

    // Sabko notification bhejo
    const payload = JSON.stringify({
      title: "📢 Class Shuru Ho Gayi!",
      body: `${subject} — ${className} ki attendance le rahe hain!`,
      sessionId
    });

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        sent++;
      } catch (err) {
        // Expired subscription delete karo
        if (err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }

    res.json({ message: `${sent} students ko notification bheja!` });
  } catch (err) {
    console.error("NOTIFY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ In-app notifications fetch
router.get("/my-notifications", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await require("../models/Notification")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// Mark all notifications as read
router.post("/mark-read", auth, async (req, res) => {
  try {
    await require("../models/Notification").updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;