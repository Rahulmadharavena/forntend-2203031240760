const express = require("express");
const router = express.Router();
const {
  shortenUrl,
  redirectUrl,
  getAnalytics,
} = require("../controllers/urlController");

router.post("/shorten", shortenUrl);
router.get("/analytics/:shortId", getAnalytics);
router.get("/:shortId", redirectUrl);

module.exports = router;
