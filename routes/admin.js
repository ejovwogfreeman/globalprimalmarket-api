const express = require("express");
const router = express.Router();

// Controllers
const {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  fundUser,
  getAllTransactions,
  getSingleTransaction,
  updateTransactionStatus,
  deleteTransaction,
  getAllBots,
  getSingleBot,
  createBot,
  updateBot,
  toggleBotStatus,
  deleteBot,
} = require("../controllers/admin");

// Middlewares
const { protect, authorize } = require("../middlewares/auth");

// Users
router.get("/all-users", protect, authorize("admin"), getAllUsers);
router.get("/user/:id", protect, authorize("admin"), getSingleUser);

// Use PATCH for updates
router.patch("/user/update/:id", protect, authorize("admin"), updateUser);
router.patch("/user/fund/:id", protect, authorize("admin"), fundUser);

// Use DELETE for deletion
router.delete("/user/delete/:id", protect, authorize("admin"), deleteUser);

// Transactions
router.get(
  "/all-transactions",
  protect,
  authorize("admin"),
  getAllTransactions,
);
router.get(
  "/transaction/:id",
  protect,
  authorize("admin"),
  getSingleTransaction,
);

// Use PATCH for transaction status updates
router.patch(
  "/transaction/update/:id",
  protect,
  authorize("admin"),
  updateTransactionStatus,
);

// Use DELETE for transaction deletion
router.delete(
  "/transaction/delete/:id",
  protect,
  authorize("admin"),
  deleteTransaction,
);

router.get("/all-bots", protect, authorize("admin"), getAllBots);
router.get("/bot/:id", protect, authorize("admin"), getSingleBot);
router.post("/bot/create", protect, authorize("admin"), createBot);
router.patch("/bot/update/:id", protect, authorize("admin"), updateBot);

router.patch(
  "/bot/toggle-status/:id",
  protect,
  authorize("admin"),
  toggleBotStatus,
);
router.delete("/bot/delete/:id", protect, authorize("admin"), deleteBot);

module.exports = router;
