const express = require("express");
const app = express();
const expressHbs = require("express-handlebars");
const mongoose = require("mongoose");
const userRouter = require("./routes/userRouter.js");
const session = require("express-session");
const { ticketModel } = require("./models/tickets.js");
const { tripModel } = require("./models/trip.js");
const { garageModel } = require("./models/garage.js");
const { carModel } = require("./models/car.js");
mongoose
  .connect("mongodb+srv://phong:123@cluster0.l1qxx8r.mongodb.net/busticket")
  .then(function () {
    console.log("connected to db successfully");
  });

app.engine(
  "hbs",
  expressHbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layouts",
    partialsDir: __dirname + "views/partials",
  })
);

app.set("view engine", "hbs");

app.use(express.static(__dirname + "/public"));
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.set("trust proxy", 1);
app.use(
  session({
    secret: "MY_SESSION_SECRET",
    resave: false,
    saveUninitialized: true,
    cookie: {},
  })
);
app.use(function (req, res, next) {
  if (req.session.auth) {
    res.locals.auth = true;
    res.locals.authUser = req.session.authUser;
  } else {
    res.locals.auth = false;
  }
  next();
});
app.get("/createTables", (req, res) => {
  let models = require("./models");
  models.sequelize.sync().then(() => {
    res.send("table created");
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

// SEARCH FUNCTION
const handleSearch = async function (req, res) {
  const departure_place = req.body.departure_place;
  const arrive_place = req.body.arrive_place;
  const depature_date = req.body.depature_date;
  const car_type = req.body.car_type;

  if (!departure_place || !arrive_place || !depature_date || !car_type) {
    return res.render("ticket_list.hbs", {
      ticketErrorMessage: "Vui lòng nhập đủ thông tin!",
    });
  }

  // FIND ID của loại xe
  const car_id = await carModel.find({ name: car_type }, { _id: 1 }).lean();
  const carIdList = car_id.map((ele, index) => ele._id.toString());

  // SEARCH NƠI ĐẾN, NƠI ĐI, THỜI GIAN
  const result = departure_place + " - " + arrive_place;
  const resultTrip = await tripModel
    .find({
      name: result,
      departure_date: depature_date,
      car: {
        $in: carIdList,
      },
    })
    .lean();
  const newTicketList = [];
  for (let i = 0; i < resultTrip.length; i++) {
    const ticket = await ticketModel
      .findOne({ trip: resultTrip[i]._id.toString() })
      .lean();
    ticket.tripInfor = resultTrip[i];
    ticket.garageInfor = await garageModel
      .findById(resultTrip[i].garage)
      .lean();
    ticket.carInfor = await carModel.findById(resultTrip[i].car).lean();
    newTicketList.push(ticket);
  }

  res.render("ticket_list", {
    ticketList: newTicketList,
    ticketListJSON: JSON.stringify(newTicketList),
  });
};

app.get("/ticket_list", async (req, res) => {
  const ticketList = await ticketModel.find().lean();
  const newTicketList = [];

  for (let i = 0; i < ticketList.length; ++i) {
    const ele = ticketList[i];
    const ticket = { ...ele };
    const tripId = ele.trip;
    const trip = await tripModel.findById(tripId).lean();
    ticket.tripInfor = trip;
    ticket.garageInfor = await garageModel.findById(trip.garage).lean();
    ticket.carInfor = await carModel.findById(trip.car).lean();
    newTicketList.push(ticket);
  }

  res.render("ticket_list", {
    ticketList: newTicketList,
    ticketListJSON: JSON.stringify(newTicketList),
  });
});

app.post("/ticket_list", handleSearch);

app.get("/ticket_info", async (req, res) => {
  const id = req.query.ticket;
  const ticketInfor = await ticketModel.findById(id).lean();

  const ele = ticketInfor;
  const ticket = { ...ele };
  const tripId = ele.trip;
  const trip = await tripModel.findById(tripId).lean();
  ticket.tripInfor = trip;
  ticket.garageInfor = await garageModel.findById(trip.garage).lean();
  ticket.carInfor = await carModel.findById(trip.car).lean();

  console.log(ticket);
  res.render("ticket_info", {
    ticketInfor: ticket,
  });
});

app.get("/booking", (req, res) => {
  res.render("booking");
});

app.get("/history", (req, res) => {
  res.render("history");
});

app.get("/promotion", (req, res) => {
  res.render("promotion");
  // console.log('lmao');
});

app.get("/news_details", (req, res) => {
  res.render("news_details");
});

app.get("/partner_info", (req, res) => {
  // console.log('h')
  res.render("partner_info");
});

app.get("/user_info", (req, res) => {
  res.render("user_info");
});

app.get("/about_us", (req, res) => {
  res.render("about_us");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.use("/", userRouter.router);

app.set("port", process.env.PORT || 5000);
app.listen(app.get("port"), () => {
  console.log("server id listening on port " + app.get("port"));
});
