const express = require("express");
const { autocomplete, reverseGeocode } = require("../controllers/location.controller");

const router = express.Router();

router.get("/autocomplete", autocomplete);
router.get("/reverse-geocode", reverseGeocode);

module.exports = router;
