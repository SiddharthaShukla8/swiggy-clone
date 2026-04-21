const express = require("express");
const { getSiteContent } = require("../controllers/content.controller");

const router = express.Router();

router.get("/site", getSiteContent);

module.exports = router;
