const { default: mongoose } = require("mongoose");

const ticketSchema = new mongoose.Schema({
  trip: String,
  price: Number,
});

const ticketModel = mongoose.model("tickets", ticketSchema);
exports.ticketModel = ticketModel;
