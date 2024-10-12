const mongoose = require("mongoose")
const countrySchema = new mongoose.Schema(
  {
    country: { type: String, required: true },
    countryCode: { type: String, required: true },
    phoneCode: { type: String, required: true },
    countryFlag: { type: String, trim: true, default: null },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    projectRate: {
      type:  mongoose.Schema.Types.ObjectId,
      ref: "ProjectRate",
      default: null,
      require: false,
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Country",countrySchema)



