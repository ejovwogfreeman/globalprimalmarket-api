const express = require("express");
const { protect } = require("../middlewares/auth");
const { getAllBots, getBot } = require("../controllers/bots");

const router = express.Router();

router.get("/", protect, getAllBots);
router.get("/:id", protect, getBot);

module.exports = router;
