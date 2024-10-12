const express = require("express");
const { getAllSubjects } = require("../controllers/SubjectController/subjectController");
const router = express.Router();
router.get("/get-all", getAllSubjects);
module.exports = router;
