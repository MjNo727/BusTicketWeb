const { default: mongoose } = require("mongoose");

const carSchema = new mongoose.Schema({
  name: String,
  imgPath: String,
  limit: Number,
});

const carModel = mongoose.model("cars", carSchema);
exports.carModel = carModel;
