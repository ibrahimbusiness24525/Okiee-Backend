const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
},
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['superadmin','admin', 'employee'],
    default: 'employee',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
});

module.exports = mongoose.model("User", UserSchema);
