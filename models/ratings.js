const { default: mongoose } = require("mongoose");

const ratingSchema = new mongoose.Schema({
  garage: String,
  user: String,
  star: Number,
  comment: String
});

const ratingModel = mongoose.model("ratings", ratingSchema);
exports.ratingModel = ratingModel;