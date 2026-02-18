const express = require("express");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.get("/bots", protect, getAllBots);
router.get("/bot/:id", protect, getBot);

module.exports = router;
