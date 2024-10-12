const Country = require("../../models/CountryModel/countryModel.js");

exports.getAllCountries = async (req, res) => {
  console.log("hit country route");
  try {
    let countries = await Country.find({
      isDeleted: false,
      isActive: true,
    }).select(["-isDeleted", "-isActive", "-createdAt", "-updatedAt", "-__v"]);
    res.json(countries);
  } catch (err) {
    res.json(err);
  }
};
