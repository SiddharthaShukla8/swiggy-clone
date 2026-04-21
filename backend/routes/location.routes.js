const express = require("express");
const { autocomplete, reverseGeocode, detectCurrentLocation } = require("../controllers/location.controller");

const router = express.Router();

router.get("/autocomplete", autocomplete);
router.get("/reverse-geocode", reverseGeocode);
router.get("/current", detectCurrentLocation);

module.exports = router;
