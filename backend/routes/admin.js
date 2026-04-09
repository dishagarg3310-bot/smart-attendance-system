const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Class = require("../models/Class");

// Admin auth middleware
const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ message: "Admin access only" });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Admin Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(400).json({ message: "Invalid admin credentials" });
    }
    const token = jwt.sign({ id: "admin", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, role: "admin", name: "Admin" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all classes
router.get("/classes", adminAuth, async (req, res) => {
  try {
    const classes = await Class.find().sort({ className: 1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Add class
router.post("/classes", adminAuth, async (req, res) => {
  try {
    const { className, subjects } = req.body;
    const exists = await Class.findOne({ className });
    if (exists) return res.status(400).json({ message: "Class already exists" });
    const newClass = await Class.create({ className, subjects: subjects || [] });
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update class subjects
router.put("/classes/:id", adminAuth, async (req, res) => {
  try {
    const { subjects, className } = req.body;
    const updated = await Class.findByIdAndUpdate(req.params.id, { subjects, className }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete class
router.delete("/classes/:id", adminAuth, async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: "Class deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Register teacher
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password?.trim();
    
    if (email !== process.env.ADMIN_EMAIL.toLowerCase().trim() || 
        password !== process.env.ADMIN_PASSWORD.trim()) {
      return res.status(400).json({ message: "Invalid admin credentials" });
    }
    
    const token = jwt.sign({ id: "admin", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, role: "admin", name: "Admin" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all teachers
router.get("/teachers", adminAuth, async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("-password");
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete teacher
router.delete("/teachers/:id", adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Teacher deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all students
router.get("/students", adminAuth, async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete student
router.delete("/students/:id", adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Public - get classes for dropdowns
router.get("/public/classes", async (req, res) => {
  try {
    const classes = await Class.find().sort({ className: 1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;