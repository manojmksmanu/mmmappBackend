const mongoose = require("mongoose");
const subjectSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
