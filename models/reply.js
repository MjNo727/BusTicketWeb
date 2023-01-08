const { default: mongoose } = require("mongoose");

const replySchema = new mongoose.Schema({
  name: String,
  phone: Number,
  email: String,
  reply: String
});

const replyModel = mongoose.model("replies", replySchema);
exports.replyModel = replyModel;