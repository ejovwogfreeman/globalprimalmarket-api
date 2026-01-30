const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  country: { type: String },
  password: { type: String, required: true },
  verificationCode: { type: Number },
  verificationCodeOld: { type: Number },
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
