const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  className: { type: String, required: true, unique: true },
  subjects: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model("Class", classSchema);