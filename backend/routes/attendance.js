const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
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

// ✅ Mark attendance
router.post("/mark", auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const studentId = req.user.id;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student nahi mila!" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session nahi mili! QR invalid hai." });
    if (!session.isActive) return res.status(400).json({ message: "Session band ho gayi hai!" });

    if (student.className && session.className !== student.className) {
      return res.status(400).json({
        message: `Ye session aapki class ke liye nahi hai! Aapki class: ${student.className}`
      });
    }

    const alreadyMarked = await Attendance.findOne({ sessionId, studentId });
    if (alreadyMarked) return res.status(400).json({ message: "Aapki attendance pehle se mark hai!" });

    await new Attendance({
      sessionId,
      studentId,
      teacherId: session.teacherId,
      className: student.className || session.className,
      subject: session.subject,
      status: "present",
      date: new Date()
    }).save();

    res.status(201).json({
      message: `Attendance mark ho gayi! Subject: ${session.subject}, Class: ${student.className || session.className}`
    });
  } catch (err) {
    console.error("MARK ERROR:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ✅ my-history
router.get("/my-history", auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await User.findById(studentId);
    const presentRecords = await Attendance.find({ studentId }).lean();
    const subjects = [...new Set(presentRecords.map(r => r.subject))];

    if (subjects.length === 0) return res.json([]);

    const query = { subject: { $in: subjects } };
    if (student?.className) query.className = student.className;

    const allSessions = await Session.find(query).lean();

    const presentMap = {};
    presentRecords.forEach(r => {
      if (r.sessionId) presentMap[r.sessionId.toString()] = r;
    });

    const fullHistory = allSessions.map(session => {
      const sid = session._id.toString();
      const wasPresent = presentMap[sid];
      return {
        _id: wasPresent ? wasPresent._id : session._id,
        sessionId: session._id,
        subject: session.subject,
        className: session.className,
        date: session.startTime || session.createdAt,
        status: wasPresent ? "present" : "absent"
      };
    });

    fullHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(fullHistory);
  } catch (err) {
    console.error("HISTORY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ student-stats
router.get("/student-stats", auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await User.findById(studentId);
    const presentRecords = await Attendance.find({ studentId });
    const subjects = [...new Set(presentRecords.map(r => r.subject))];

    if (subjects.length === 0) return res.json({ total: 0, present: 0, absent: 0 });

    let totalClasses = 0;
    let totalPresent = 0;

    for (const subject of subjects) {
      const query = { subject };
      if (student?.className) query.className = student.className;
      const sessionsCount = await Session.countDocuments(query);
      totalClasses += sessionsCount;
      const presentCount = await Attendance.countDocuments({ studentId, subject, status: "present" });
      totalPresent += presentCount;
    }

    res.json({ total: totalClasses, present: totalPresent, absent: totalClasses - totalPresent });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ session-count for teacher
router.get("/session-count/:sessionId", auth, async (req, res) => {
  try {
    const count = await Attendance.countDocuments({ sessionId: req.params.sessionId, status: "present" });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Teacher ke liye - class wise all students attendance summary
router.get("/class-summary", auth, async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Teacher ki profile se className lo
    const teacher = await User.findById(teacherId);
    if (!teacher || !teacher.className) {
      return res.json([]);
    }

    const className = teacher.className;

    // Is class ke SAARE students
    const allStudents = await User.find({
      role: "student",
      className: className
    }).select("name email className").lean();

    if (allStudents.length === 0) {
      return res.json([{
        className,
        students: []
      }]);
    }

    // Teacher ke saare sessions
    const sessions = await Session.find({ teacherId }).lean();
    const totalSessions = sessions.length;

    // Har student ka present count
    const studentSummary = await Promise.all(allStudents.map(async (student) => {
      const presentCount = await Attendance.countDocuments({
        studentId: student._id,
        teacherId,
        status: "present"
      });

      const percent = totalSessions > 0
        ? Math.round((presentCount / totalSessions) * 100)
        : 0;

      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        totalClasses: totalSessions,
        present: presentCount,
        absent: totalSessions - presentCount,
        percent
      };
    }));

    res.json([{
      className,
      students: studentSummary
    }]);

  } catch (err) {
    console.error("CLASS SUMMARY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ session-students
router.get("/session-students/:sessionId", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session nahi mili!" });

    const allStudents = await User.find({ role: "student", className: session.className }).select("name email className").lean();
    const presentRecords = await Attendance.find({ sessionId: req.params.sessionId, status: "present" }).lean();
    const presentIds = presentRecords.map(r => r.studentId.toString());

    const students = allStudents.map(s => ({
      _id: s._id, name: s.name, email: s.email, className: s.className,
      status: presentIds.includes(s._id.toString()) ? "present" : "absent"
    }));

    res.json({ subject: session.subject, className: session.className, total: students.length, present: presentIds.length, absent: students.length - presentIds.length, students });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ session-history basic
router.get("/session-history", auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const sessions = await Session.find({ teacherId }).sort({ createdAt: -1 }).lean();

    const history = await Promise.all(sessions.map(async (session) => {
      const presentCount = await Attendance.countDocuments({ sessionId: session._id, status: "present" });
      return { _id: session._id, subject: session.subject, className: session.className, date: session.createdAt, isActive: session.isActive, presentCount };
    }));

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ session-history-detail
router.get("/session-history-detail", auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const sessions = await Session.find({ teacherId }).sort({ createdAt: -1 }).lean();
    if (sessions.length === 0) return res.json([]);

    const history = await Promise.all(sessions.map(async (session) => {
      const presentRecords = await Attendance.find({ sessionId: session._id, status: "present" }).lean();
      const totalStudents = await User.countDocuments({ role: "student", className: session.className });
      const studentIds = presentRecords.map(r => r.studentId);
      const presentUsers = await User.find({ _id: { $in: studentIds } }).select("name").lean();

      const start = new Date(session.createdAt);
      const end = session.isActive ? new Date() : new Date(session.updatedAt);
      const duration = Math.round((end - start) / 60000);

      return {
        _id: session._id,
        subject: session.subject,
        className: session.className,
        date: session.createdAt,
        isActive: session.isActive,
        presentCount: presentRecords.length,
        absentCount: totalStudents - presentRecords.length,
        totalStudents,
        duration,
        presentStudents: presentUsers.map(u => u.name)
      };
    }));

    res.json(history);
  } catch (err) {
    console.error("SESSION HISTORY DETAIL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ session-history-full
router.get("/session-history-full", auth, async (req, res) => {
  try {
    const teacherId = req.user.id;

    const sessions = await Session.find({ teacherId })
      .sort({ createdAt: -1 })
      .lean();

    if (sessions.length === 0) return res.json([]);

    // Teacher ki class ke total students
    const teacher = await User.findById(teacherId);

    const history = await Promise.all(sessions.map(async (session) => {
      // Present records with student names
      const presentRecords = await Attendance.find({
        sessionId: session._id,
        status: "present"
      }).lean();

      const studentIds = presentRecords.map(r => r.studentId);
      const presentUsers = await User.find({ _id: { $in: studentIds } })
        .select("name").lean();

      const presentCount = presentRecords.length;
      const presentStudents = presentUsers.map(r => r.name);

      // Total students in this session's class
      const totalStudents = await User.countDocuments({
        role: "student",
        className: { $regex: new RegExp(`^${session.className}$`, "i") }
      });

      const absentCount = Math.max(0, totalStudents - presentCount);

      // Duration
      const start = new Date(session.createdAt);
      const end = session.isActive ? new Date() : new Date(session.updatedAt);
      const duration = Math.floor((end - start) / 1000);

      return {
        _id: session._id,
        subject: session.subject,
        className: session.className,
        date: session.createdAt,
        isActive: session.isActive,
        presentCount,
        absentCount,
        presentStudents,
        duration
      };
    }));

    res.json(history);
  } catch (err) {
    console.error("SESSION HISTORY FULL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ Student profile for teacher
router.get("/student-profile/:studentId", auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;

    const student = await User.findById(studentId).select("name email className").lean();
    if (!student) return res.status(404).json({ message: "Student nahi mila!" });

    // Teacher ke saare sessions
    const sessions = await Session.find({ teacherId }).lean();

    // Subject-wise attendance
    const subjects = [...new Set(sessions.map(s => s.subject))];

    const subjectStats = await Promise.all(subjects.map(async (subject) => {
      const totalSessions = sessions.filter(s => s.subject === subject).length;
      const presentCount = await Attendance.countDocuments({
        studentId,
        teacherId,
        subject,
        status: "present"
      });
      const percent = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
      return { subject, present: presentCount, total: totalSessions, percent };
    }));

    // Overall stats
    const totalPresent = subjectStats.reduce((sum, s) => sum + s.present, 0);
    const totalClasses = subjectStats.reduce((sum, s) => sum + s.total, 0);
    const totalAbsent = totalClasses - totalPresent;
    const overallPercent = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

    // Last attended
    const lastRecord = await Attendance.findOne({ studentId, teacherId, status: "present" })
      .sort({ date: -1 }).lean();

    const lastAttended = lastRecord
      ? new Date(lastRecord.date).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        })
      : null;

    res.json({
      name: student.name,
      email: student.email,
      className: student.className,
      totalPresent,
      totalAbsent,
      overallPercent,
      lastAttended,
      subjects: subjectStats
    });

  } catch (err) {
    console.error("STUDENT PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;