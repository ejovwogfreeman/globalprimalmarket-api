const express = require("express");
const { protect } = require("../middlewares/auth");
const {
  createDeposit,
  createInvestment,
  createWithdrawal,
  getMyTransactions,
  getTransaction,
  claimBonus,
} = require("../controllers/transactions");
const { uploadTransactionFiles } = require("../middlewares/upload");

const router = express.Router();

router.post("/deposit", protect, uploadTransactionFiles, createDeposit);
router.post("/withdrawal", protect, createWithdrawal);
router.post("/investment", protect, createInvestment);
router.put("/:transactionId/claim-bonus", claimBonus);

router.get("/me", protect, getMyTransactions);
router.get("/:id", protect, getTransaction);

module.exports = router;
