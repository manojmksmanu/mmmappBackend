const express = require("express");
const { protect } = require("../middleware/AuthMiddleWare/authMiddleware");
const UserReport = require("../models/ReportModel/userReportModel");
const MessageReport = require("../models/ReportModel/messageReportModel");
const router = express.Router();

router.post("/report-user", protect, async (req, res) => {
  const { reporterId, reportedUserId, reason } = req.body;

  if (!reporterId || !reportedUserId || !reason) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const userReport = new UserReport({
      reporterId,
      reportedUserId,
      reason,
    });

    await userReport.save();
    res.status(200).json({
      message:
        "Thank you for helping us maintain a safe community If any inappropriate content is detected, we will take appropriate action to maintain a safe environment.",
    });
  } catch (err) {
    res.status(500).json({ error: "something went wrong" });
  }
});
router.post("/report-messages", protect, async (req, res) => {
  const { reporterId, reports } = req.body;

  if (!reporterId || !Array.isArray(reports) || reports.length === 0) {
    return res
      .status(400)
      .json({ error: "Reporter ID and reports are required" });
  }

  try {
    // Save all reports using bulk write
    const bulkOps = reports.map(({ reportedMessageId, reason }) => ({
      insertOne: {
        document: {
          reporterId,
          reportedMessageId,
          reason,
          reportedAt: new Date(),
        },
      },
    }));

    await MessageReport.bulkWrite(bulkOps);

    res.status(200).json({
      message:
        "Thank you! Your report has been successfully submitted and will be reviewed shortly",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
