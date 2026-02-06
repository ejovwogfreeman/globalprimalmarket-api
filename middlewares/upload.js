const multer = require("multer");
const storage = multer.memoryStorage();

const uploadTransactionFiles = multer({
  storage,
}).fields([{ name: "images", maxCount: 1 }]);

const uploadChatAttachments = multer({
  storage,
}).fields([
  { name: "images", maxCount: 5 },
  { name: "videos", maxCount: 5 },
]);

const uploadProfilePicture = multer({
  storage,
}).fields([{ name: "images", maxCount: 1 }]);

// For routes that use FormData but DO NOT upload files
const uploadNone = multer({ storage }).none();

module.exports = {
  uploadTransactionFiles,
  uploadChatAttachments,
  uploadProfilePicture,
  uploadNone,
};
