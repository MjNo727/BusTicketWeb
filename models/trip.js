const { default: mongoose } = require("mongoose");

const tripSchema = new mongoose.Schema({
  name: String,
  garage: String,
  departure_place: String,
  arrive_place: String,
  departure_date: String,
  arrive_date: String,
  departure_time: String,
  arrive_time: String,
  total_time: String,
  car: String,
  description: String,
});

const tripModel = mongoose.model("trips", tripSchema);
exports.tripModel = tripModel;
