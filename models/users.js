const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: String,
  password: String,
  phoneNumber: String,
  email: String,
  role: {
    type: String,
    default: "user",
  },
  imgPath: String
});

const userModel = mongoose.model("users", userSchema);
exports.userModel = userModel;
