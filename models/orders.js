const { default: mongoose } = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: String,
  ticket: String,
  number: Number,
  status: String
});

const orderModel = mongoose.model("orders", orderSchema);
exports.orderModel = orderModel;
