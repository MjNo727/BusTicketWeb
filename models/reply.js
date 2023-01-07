const { default: mongoose } = require("mongoose");

const replySchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: Number,
  reply: String
});

const replyModel = mongoose.model("reply", replySchema);
exports.replyModel = replyModel;