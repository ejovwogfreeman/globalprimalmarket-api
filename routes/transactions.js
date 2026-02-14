const express = require("express");
const upload = require("../middlewares/upload");
const { protect, authorize } = require("../middlewares/auth");
const {
  createDeposit,
  createInvestment,
  createWithdrawal,
  getMyTransactions,
  getTransaction,
} = require("../controllers/transactions");
const { uploadTransactionFiles } = require("../middlewares/upload");

const router = express.Router();

router.post("/deposit", protect, uploadTransactionFiles, createDeposit);
router.post("/withdrawal", protect, createWithdrawal);
router.post("/investment", protect, createInvestment);

router.get("/me", protect, getMyTransactions);
router.get("/:id", protect, getTransaction);

module.exports = router;
