const Subject = require("../../models/SubjectModel/subjectModel");

exports.getAllSubjects = async (req, res, next) => {
  try {
    let subjects = await Subject.find({
      isDeleted: false,
      isActive: true,
    }).select(["subjectName", "-_id"]);

    res.json(subjects);
  } catch (err) {
    return next(err);
  }
};
