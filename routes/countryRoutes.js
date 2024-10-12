const express = require("express");
const { getAllCountries } = require("../controllers/CountryController/countryController");
const router = express.Router();
router.get("/get-all", getAllCountries);
module.exports = router;
