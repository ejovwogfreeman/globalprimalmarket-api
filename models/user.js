// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const UserSchema = new mongoose.Schema({
//   fullName: { type: String, required: true },
//   userName: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   phoneNumber: { type: String },
//   country: { type: String },
//   countryFlag: { type: String },
//   password: { type: String, required: true },
//   verificationCode: { type: Number },
//   verificationCodeOld: { type: Number },
//   isVerified: { type: Boolean, default: false },
//   balance: { type: Number, default: 0 },
//   role: { type: String, enum: ["user", "admin"], default: "user" },
//   profilePicture: [{ type: String, required: true }],
//   createdAt: { type: Date, default: Date.now },
// });

// UserSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// UserSchema.methods.comparePassword = function (candidate) {
//   return bcrypt.compare(candidate, this.password);
// };

// module.exports = mongoose.model("User", UserSchema);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  country: { type: String },
  countryFlag: { type: String },
  password: { type: String, required: true },
  verificationCode: { type: Number },
  verificationCodeOld: { type: Number },
  isVerified: { type: Boolean, default: false },
  balance: {
    btc: { type: Number, default: 0 },
    eth: { type: Number, default: 0 },
    sol: { type: Number, default: 0 },
    trx: { type: Number, default: 0 },
    bnb: { type: Number, default: 0 },
    xrp: { type: Number, default: 0 },
  },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  profilePicture: [{ type: String, required: true }],
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
