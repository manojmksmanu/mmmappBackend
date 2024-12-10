const mongoose = require("mongoose");
const messageReportSchema = new mongoose.Schema({
  reporterId: { type: String, required: true }, // ID of the user who reports
  reportedMessageId: { type: String, required: true }, // ID of the message being reported
  reason: { type: String, required: true }, // Reason for the report
  createdAt: { type: Date, default: Date.now },
});

const MessageReport = mongoose.model("MessageReport", messageReportSchema);
module.exports = MessageReport;
