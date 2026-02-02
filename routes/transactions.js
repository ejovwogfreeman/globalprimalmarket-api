const express = require("express");
const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const controller = require("../controllers/transaction.controller");

const router = express.Router();

router.post("/deposit", auth, upload.single("proof"), controller.createDeposit);
router.post(
  "/withdrawal",
  auth,
  upload.single("proof"),
  controller.createWithdrawal,
);
router.post("/investment", auth, controller.createInvestment);

router.get("/me", auth, controller.getMyTransactions);
router.get("/", auth, admin, controller.getAllTransactions);

router.patch("/:id/status", auth, admin, controller.updateTransactionStatus);

module.exports = router;
