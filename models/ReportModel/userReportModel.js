

const mongoose = require("mongoose");

const userReportSchema = new mongoose.Schema({
  reporterId: { type: String, required: true }, // ID of the user who reports
  reportedUserId: { type: String, required: true }, // ID of the user being reported
  reason: { type: String, required: true }, // Reason for the report
  createdAt: { type: Date, default: Date.now },
});

const UserReport = mongoose.model("UserReport", userReportSchema);
module.exports = UserReport;
