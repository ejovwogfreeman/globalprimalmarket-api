const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  location: { type: String },
  password: { type: String, required: true },
  verificationCode: { type: Number, default: false },
  isVerified: { type: Boolean, default: false },
  balance: { type: Number, default: 0 },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  profilePicture: String,
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", UserSchema);
