const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["teacher", "student", "admin"], required: true },
  subject: { type: String },
  className: { type: String }
});

module.exports = mongoose.model("User", userSchema);