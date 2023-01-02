const { default: mongoose } = require("mongoose");

const garageSchema = new mongoose.Schema({
  name: String,
  imgPath: String,
  car: [String],
});

const garageModel = mongoose.model("garages", garageSchema);
exports.garageModel = garageModel;
