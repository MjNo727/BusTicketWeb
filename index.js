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
const { orderModel } = require("./models/orders.js");
const { userModel } = require("./models/users.js");
const { ratingModel } = require("./models/ratings.js");
const { replyModel } = require("./models/reply.js");
const helper = require("./helper/helper.js");

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
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
    },
    helpers: helper
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
  // console.log(req.session.authUser);
  if (req.session.auth) {
    res.locals.auth = true;
    res.locals.authUser = req.session.authUser;
  } else {
    res.locals.auth = false;
  }
  next();
});
// app.get("/createTables", (req, res) => {
//   let models = require("./models");
//   models.sequelize.sync().then(() => {
//     res.send("table created");
//   });
// });

app.get("/", (req, res) => {
  if (req.query.login)
    res.locals.login_errorMessage = "Please login to continue";

  res.render("index", { title: "Trang chủ" },);
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
      title: "Danh sách chuyến đi",
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
    let ticket = await ticketModel
      .findOne({ trip: resultTrip[i]._id.toString() })
      .lean();
    // console.log(ticket);

    ticket.tripInfor = resultTrip[i];

    ticket.garageInfor = await garageModel
      .findById(resultTrip[i].garage)
      .lean();

    ticket.carInfor = await carModel.findById(resultTrip[i].car).lean();
    if (ticket.limit > 0) newTicketList.push(ticket);
  }

  res.render("ticket_list", {
    ticketList: newTicketList,
    ticketListJSON: JSON.stringify(newTicketList),
    title: "Danh sách chuyến đi",
  });
};

const handleSearchAdmin = async function (req, res) {
  const departure_place = req.body.departure_place;
  const arrive_place = req.body.arrive_place;
  const depature_date = req.body.depature_date;
  const car_type = req.body.car_type;

  if (!departure_place || !arrive_place || !depature_date || !car_type) {
    return res.render("manage_trip_list.hbs", {
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
    let ticket = await ticketModel
      .findOne({ trip: resultTrip[i]._id.toString() })
      .lean();
    // console.log(ticket);

    ticket.tripInfor = resultTrip[i];

    ticket.garageInfor = await garageModel
      .findById(resultTrip[i].garage)
      .lean();

    ticket.carInfor = await carModel.findById(resultTrip[i].car).lean();
    if (ticket.limit > 0) newTicketList.push(ticket);
  }

  res.render("manage_trip_list", {
    ticketList: newTicketList,
    title: "Quản lý chuyến đi",
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
    if (ticket.limit > 0) newTicketList.push(ticket);
  }

  // Pagination
  const number_ticket_display = 6;
  const total_page = Math.ceil(newTicketList.length / number_ticket_display);

  const current_page = req.query.page || 1;
  const paginationList = newTicketList.slice((current_page - 1) * number_ticket_display, current_page * number_ticket_display);

  const pagesList = [];

  for (let i = 1; i <= total_page; i++) {
    pagesList[i - 1] = i;
  }

  res.render("ticket_list", {
    ticketList: paginationList,
    title: "Danh sách chuyến đi",
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

  // console.log(ticket);
  res.render("ticket_info", {
    ticketInfor: ticket,
    title: "Thông tin chuyến đi",
  });
});

//for ad

app.get("/manage_trip_list", async function (req, res) {
  // if (!req.session.auth) {
  //   return res.redirect("/?login=true");
  // }
  // console.log();
  // if (res.locals.authUser["role"] != "admin") {
  //   console.log("wrong role");
  //   return res.redirect("/");
  // }
  //have some problem with database note by !
  const ticketList = await ticketModel.find().lean(); // !
  const newTicketList = []; // !

  for (let i = 0; i < ticketList.length; ++i) { // !
    const ele = ticketList[i]; // !
    const ticket = { ...ele }; // !
    const tripId = ele.trip;
    const trip = await tripModel.findById(tripId).lean();
    ticket.tripInfor = trip;
    ticket.garageInfor = await garageModel.findById(trip.garage).lean();
    ticket.carInfor = await carModel.findById(trip.car).lean();
    newTicketList.push(ticket);
  }

  res.render("manage_trip_list", {
    ticketList: newTicketList, // !
    ticketListJSON: JSON.stringify(newTicketList), // !
    title: "Quản lý chuyến đi",
  });
});

app.post("/manage_trip_list", handleSearchAdmin);


app.get("/manage_contact", async (req, res)  => {
  const contactList = await replyModel.find().lean(); // !
  const newContactList = []; // !

  for (let i = 0; i < contactList.length; ++i) { // !
    const ele = contactList[i]; // !
    const contact = { ...ele }; // !
    newContactList.push(contact);
  }
  // Pagination

  res.render("manage_contact", {
    contactList2: newContactList,
    title: "Nội dung phản hồi",
    contactListJSON: JSON.stringify(newContactList),
  });
});

app.get("/create_trip_info", async (req, res) => {
  // if (!req.session.auth) {
  //   return res.redirect("/?login=true");
  // }
  // if (res.locals.authUser["role"] != "admin") {
  //   console.log("wrong role");
  //   return res.redirect("/");
  // }

  res.render("create_trip_info", {
    title: "Tạo chuyến đi",
  });
});

app.post("/create_trip_info", async (req, res) => { // for update

  //have some problem with database, note by !
  const trip_garage = (await garageModel.findOne({ name: req.body.garage_name }));
  const trip_car = (await carModel.findOne({ name: req.body.car_name }))
  const trip_new = await tripModel.create({
    garage: trip_garage.id,
    car: trip_car.id,
    name: req.body.trip_name,
    departure_place: req.body.trip_departure_place,
    arrive_place: req.body.trip_arrive_place,
    departure_date: req.body.trip_departure_date,
    arrive_date: req.body.trip_arrive_date,
    departure_time: req.body.trip_departure_time,
    arrive_time: req.body.trip_arrive_time,
    total_time: req.body.trip_total_time,
  });
  const ticket_new = await ticketModel.create({
    trip: trip_new.id,
    price: req.body.ticket_price,
    limit: req.body.ticket_limit
  });


  const ticketList = await ticketModel.find().lean(); // !
  const newTicketList = []; // !

  for (let i = 0; i < ticketList.length; ++i) { // !
    const ele = ticketList[i]; // !
    const ticket = { ...ele }; // !
    const tripId = ele.trip;
    const trip = await tripModel.findById(tripId).lean();
    ticket.tripInfor = trip;
    ticket.garageInfor = await garageModel.findById(trip.garage).lean();
    ticket.carInfor = await carModel.findById(trip.car).lean();
    newTicketList.push(ticket);
  }

  res.render("manage_trip_list", {
    ticketList: newTicketList, // !
    ticketListJSON: JSON.stringify(newTicketList), // !
    title: "Tạo chuyến đi",

  });
});




app.get("/delete_trip", async (req, res) => { // not finish
  // if (!req.session.auth) {
  //   return res.redirect("/?login=true");
  // }
  // if (res.locals.authUser["role"] != "admin") {
  //   console.log("wrong role");
  //   return res.redirect("/");
  // }

  const id = req.query.trip;
  const ticket = (await ticketModel.findOne({ _id: id }));
  const trip = (await tripModel.findOne({ _id: ticket.trip }));
  ticket.delete();
  trip.delete();

  const ticketList = await ticketModel.find().lean(); // !
  const newTicketList = []; // !

  for (let i = 0; i < ticketList.length; ++i) { // !
    const ele = ticketList[i]; // !
    const ticket = { ...ele }; // !
    const tripId = ele.trip;
    const trip = await tripModel.findById(tripId).lean();
    if (trip == null)
      continue;
    ticket.tripInfor = trip;
    console.log(trip);
    ticket.garageInfor = await garageModel.findById(trip.garage).lean();
    ticket.carInfor = await carModel.findById(trip.car).lean();
    newTicketList.push(ticket);
  }

  res.render("manage_trip_list", {
    ticketList: newTicketList, // !
    ticketListJSON: JSON.stringify(newTicketList), // !
    title: "Danh sách chuyến đi",
  });

})

app.get("/manage_trip_info", async (req, res) => {
  // if (!req.session.auth) {
  //   return res.redirect("/?login=true");
  // }
  // if (res.locals.authUser["role"] != "admin") {
  //   console.log("wrong role");
  //   return res.redirect("/");
  // }
  //have some problem with database, note by !
  const id = req.query.trip;
  // console.log(typeof id)
  const ticketInfor = await ticketModel.findById(id).lean(); // it should by trip model

  const ele = ticketInfor; // !
  const ticket = { ...ele }; // !
  const tripId = ele.trip;
  const trip = await tripModel.findById(tripId).lean();
  ticket.tripInfor = trip;
  ticket.garageInfor = await garageModel.findById(trip.garage).lean();
  ticket.carInfor = await carModel.findById(trip.car).lean();

  // console.log(ticket);
  res.render("manage_trip_info", {
    ticketInfor: ticket, // !
    title: "Chỉnh sửa chuyến đi",
  });
});

app.post("/manage_trip_info", async (req, res) => { // for update

  //have some problem with database, note by !
  let id = req.query.trip;

  const ticket_update = await ticketModel.findOne({ _id: id });
  ticket_update.price = req.body.ticket_price;
  ticket_update.save();
  const trip_update = await tripModel.findOne({ _id: ticket_update.trip });
  trip_update.garage = (await garageModel.findOne({ name: req.body.garage_name })).id;
  trip_update.car = (await carModel.findOne({ name: req.body.car_name })).id;
  trip_update.name = req.body.trip_name;
  trip_update.departure_place = req.body.trip_departure_place;
  trip_update.arrive_place = req.body.trip_arrive_place;
  trip_update.departure_date = req.body.trip_departure_date;
  trip_update.arrive_date = req.body.trip_arrive_date;
  trip_update.departure_time = req.body.trip_departure_time;
  trip_update.arrive_time = req.body.trip_arrive_time;
  trip_update.total_time = req.body.trip_total_time;
  trip_update.save();

  let ticketInfor = await ticketModel.findById(id).lean(); // it should by trip model

  let ele = ticketInfor; // !
  let ticket = { ...ele }; // !
  let tripId = ele.trip;

  const trip = await tripModel.findById(tripId).lean();
  ticket.tripInfor = trip;
  ticket.garageInfor = await garageModel.findById(trip.garage).lean();
  ticket.carInfor = await carModel.findById(trip.car).lean();

  res.render("manage_trip_info", {
    ticketInfor: ticket, // !
    title: "Chỉnh sửa chuyến đi",
  });
});



app.get("/manage_history", async (req, res) => {
  // if (!req.session.auth) {
  //   return res.redirect("/?login=true");
  // }
  // if (res.locals.authUser["role"] != "admin") {
  //   console.log("wrong role");
  //   return res.redirect("/");
  // }

  const orders = await orderModel.find().lean();
  const order_details = [];

  const addOrder = async () => {
    for (let i = 0; i < orders.length; ++i) {
      const ele = orders[i];

      const userId = ele.ticket;
      const user = await userModel.findOne({ _id: userId }).lean();

      const ticketId = ele.ticket;
      const ticket = await ticketModel.findOne({ _id: ticketId }).lean();

      const tripId = ticket.trip;
      const trip = await tripModel.findOne({ _id: tripId }).lean();

      const garageId = trip.garage;
      const garage = await garageModel.findOne({ _id: garageId }).lean();

      const carId = trip.car;
      const car = await carModel.findOne({ _id: carId }).lean();

      const total_price = parseInt(ele.number) * parseInt(ticket.price);

      // console.log(ele.number + " <> " + ticket.price)
      const order = {
        id: ele._id,
        number: ele.number,
        price: total_price,
        status: ele.status,
        user_infor: user,
        trip_infor: trip,
        ticket_infor: ticket,
        garage_infor: garage,
        car_infor: car
      }
      order_details.push(order);
    }
  }
  await addOrder();
  // console.log(order_details);
  res.render("manage_history", {
    order_details: order_details,
    title: "Quản lý đặt chỗ",
  });
});

app.post("/manage_history", async (req, res) => {
  const order_update = await orderModel.findOne({ _id: req.body.order_id });
  const ticket_update = await ticketModel.findOne({ _id: order_update.ticket });
  ticket_update.limit += (order_update.number - req.body.order_number);
  ticket_update.save();
  order_update.number = req.body.order_number;
  order_update.save();

  //save chua du nhanh
  const orders = await orderModel.find().lean();
  const order_details = [];

  const addOrder = async () => {
    for (let i = 0; i < orders.length; ++i) {
      const ele = orders[i];
      if (ele == null)
        continue;

      const userId = ele.ticket;
      const user = await userModel.findOne({ _id: userId }).lean();

      const ticketId = ele.ticket;
      const ticket = await ticketModel.findOne({ _id: ticketId }).lean();

      const tripId = ticket.trip;
      const trip = await tripModel.findOne({ _id: tripId }).lean();

      const garageId = trip.garage;
      const garage = await garageModel.findOne({ _id: garageId }).lean();

      const carId = trip.car;
      const car = await carModel.findOne({ _id: carId }).lean();

      const total_price = parseInt(ele.number) * parseInt(ticket.price);
      // console.log(ele.number + " <> " + ticket.price)
      const order = {
        id: ele._id,
        number: ele.number,
        price: total_price,
        status: ele.status,
        user_infor: user,
        trip_infor: trip,
        ticket_infor: ticket,
        garage_infor: garage,
        car_infor: car
      }
      order_details.push(order);
    }
  }
  await addOrder();
  // console.log(order_details);
  res.render("manage_history", {
    order_details: order_details,
    title: "Quản lý đặt chỗ",
  });
});

app.get("/manage_parner", async (req, res) => {
  //if (!req.session.auth) {
  //   return res.redirect("/?login=true");
  // }
  // if (res.locals.authUser["role"] != "admin") {
  //   console.log("wrong role");
  //   return res.redirect("/");
  // }
  const garageList = await garageModel.find().lean();
  let commentList = [];
  // for(let i = 0; i < garageList.length; i++){
  //   garageList[i]._id = garageList[i]._id.toString();
  // }
  const ratingItems = await ratingModel.find().lean();
  // console.log(ratingItems.length);
  for (let i = 0; i < ratingItems.length; i++) {
    // console.log(ratingItems[i].user);
    const name_user = await userModel.findOne({ _id: ratingItems[i].user }).lean();
    // console.log(name_user);
    ratingItems[i].userInfor = name_user.fullname;;

  }

  // let starOfGarage = [];
  for (let i = 0; i < garageList.length; i++) {
    let totalStar = 0;
    let totalRating = 0;
    for (let j = 0; j < ratingItems.length; j++) {
      // console.log(ratingItems[j].garage + " = " + garageList[i]._id);
      if (ratingItems[j].garage === garageList[i]._id.toString()) {
        totalRating++;
        totalStar += ratingItems[j].star;
        // console.log(ratingItems[j].star);
      }
    }
    let average = (totalStar / totalRating).toFixed(1);
    garageList[i].avg = average;
  }

  commentList = ratingItems;
  res.render("manage_parner", {
    garageList,
    title: "Quản lý nhà xe",
    commentList,
  });
})

// ************************ BOOKING FUNCTION ***************

app.get("/booking", async (req, res) => {
  if (!req.session.auth) {
    return res.redirect(`/?login=true&redirect=${req.originalUrl}`);
  }
  const id = req.query.ticket;
  const ticketInfor = await ticketModel.findById(id).lean();

  const ele = ticketInfor;
  const ticket = { ...ele };
  const tripId = ele.trip;
  const trip = await tripModel.findById(tripId).lean();
  ticket.tripInfor = trip;
  ticket.garageInfor = await garageModel.findById(trip.garage).lean();
  ticket.carInfor = await carModel.findById(trip.car).lean();

  res.locals.successMessageBooking = "";
  res.render("booking", {
    ticketInfor: ticket,
    title: "Booking",
  });
});

const bookingFunction = async function (req, res) {
  const name = req.body.name;
  const id_user = req.body.id_user;
  const phone = req.body.phone;
  const number = req.body.number;

  const ticketId = req.query.ticket; // lay id ticket dang đặt
  const ticket = await ticketModel.findOne({ _id: ticketId });
  ticket.limit -= number;
  ticket.save();

  // res.locals.successMessageBooking = "Đặt vé thành công!";
  const order = await orderModel.create({
    user: id_user,
    ticket: ticketId,
    number: number,
    status: "Vừa đặt"
  });
  res.redirect("/history");
};

app.post("/booking", bookingFunction);

//***************************** HISTORY REVIEW Vé *************************************/
app.get("/history", async (req, res) => {
  if (!req.session.auth) {
    return res.redirect("/?login=true");
  }
  const orders = await orderModel.find({ user: res.locals.authUser.id }).lean();
  const order_details = [];

  const addOrder = async () => {
    for (let i = 0; i < orders.length; ++i) {
      const ele = orders[i];

      const ticketId = ele.ticket;
      const ticketDetail = await ticketModel.findOne({ _id: ticketId }).lean();

      const tripId = ticketDetail.trip;
      const trip = await tripModel.findOne({ _id: tripId }).lean();

      const garageId = trip.garage;
      const garage = await garageModel.findOne({ _id: garageId }).lean();

      const carId = trip.car;
      const car = await carModel.findOne({ _id: carId }).lean();

      const order_code = ele._id.toString().substring(1, 10).toUpperCase();
      // console.log(order_code);
      const order = {
        order_code: order_code,
        order_id: ele._id.toString(),
        order_status: ele.status,
        number: ele.number,
        trip_infor: trip,
        ticket_infor: ticketDetail,
        garage_infor: garage,
        car_infor: car,
        total_price: ticketDetail.price * ele.number
      }
      order_details.push(order);
      // console.log(garage);
    }
  }
  await addOrder();
  // console.log(order_details);
  res.render("history", {
    order_details: order_details.reverse(),
    title: "Lịch sử đặt vé"
  });
});

// Destroy an order
const destroyOrderFunction = async function (req, res) {
  const ticket_id = req.body.ticket_id;
  const order_id = req.body.order_id;

  const order = await orderModel.findOne({ _id: order_id });
  const ticket = await ticketModel.findOne({ _id: ticket_id });
  ticket.limit += order.number;
  await ticket.save();

  order.status = "Đã hủy";
  await order.save();
  res.redirect("/history");
}


app.post("/history", destroyOrderFunction);

// ***********************************************************************************

app.get("/promotion", (req, res) => {
  res.render("promotion", { title: "Khuyến mãi" });
});

app.get("/manage", (req, res) => {
  // if (!req.session.auth) {
  //   return res.redirect("/?login=true");
  // }
  // if (res.locals.authUser["role"] != "admin") {
  //   console.log("wrong role");
  //   return res.redirect("/");
  // }
  res.render("manage", { title: "Quản lý hệ thống" });
});

app.get("/news_details", (req, res) => {
  res.render("news_details", { title: "Tin tức" });
});

// RATING FEATURES 

app.get("/partner_info", async (req, res) => {
  if (!req.session.auth) {
    return res.redirect(`/?login=true&redirect=${req.originalUrl}`);
  }
  const garageList = await garageModel.find().lean();
  let commentList = [];
  // for(let i = 0; i < garageList.length; i++){
  //   garageList[i]._id = garageList[i]._id.toString();
  // }
  const ratingItems = await ratingModel.find().lean();
  // console.log(ratingItems.length);
  for (let i = 0; i < ratingItems.length; i++) {
    // console.log(ratingItems[i].user);
    const name_user = await userModel.findOne({ _id: ratingItems[i].user }).lean();
    // console.log(name_user);
    ratingItems[i].userInfor = name_user.fullname;;
    ratingItems[i].userAvatar = name_user.imgPath;
  }

  // let starOfGarage = [];
  for (let i = 0; i < garageList.length; i++) {
    let totalStar = 0;
    let totalRating = 0;
    for (let j = 0; j < ratingItems.length; j++) {
      // console.log(ratingItems[j].garage + " = " + garageList[i]._id);
      if (ratingItems[j].garage === garageList[i]._id.toString()) {
        totalRating++;
        totalStar += ratingItems[j].star;
        // console.log(ratingItems[j].star);
      }
    }
    let average = (totalStar / totalRating).toFixed(1);
    garageList[i].avg = average;
  }

  commentList = ratingItems;
  res.render("partner_info", {
    garageList,
    title: "Đối tác",
    commentList,
  });
});

const ratingFunction = async function (req, res) {
  const star = req.body.rate;
  const description = req.body.description;

  const garageID = req.body.garage_id;
  const userID = req.body.user_id;

  const rating = await ratingModel.create({
    garage: garageID,
    user: userID,
    star: star,
    comment: description
  });
  res.redirect("/partner_info");
}

app.post("/partner_info", ratingFunction);

//
app.get("/user_info", async (req, res) => {
  // if (!req.session.auth) {
  //   return res.redirect("/?login=true");
  // }
  const userId = req.query.userId;
  // if (res.locals.authUser["id"] != userId) {
  //   console.log("wrong user");
  //   return res.redirect("/");
  // }
  const user = await userModel.findOne({ _id: userId }).lean();
  console.log(user.email);
  res.render("user_info", { 
    user: user,
    title: "Thông tin cá nhân",
   });
});

app.post("/user_info", async (req, res) => {
  const userId = req.query.userId;
  const user_update = await userModel.findOne({ _id: userId })
  user_update.fullname = req.body.user_fullname
  user_update.email = req.body.user_email
  user_update.phoneNumber = req.body.user_phoneNumber
  user_update.save()

  //load qua cham
  const user = await userModel.findOne({ _id: userId }).lean();
  res.render("user_info", { 
    user: user,
    title: "Thông tin cá nhân",
   });
});

app.get("/about_us", (req, res) => {
  res.render("about_us", { title: "Về chúng tôi" });
});


app.get("/contact", async (req, res) => {
    if (!req.session.auth) {
      return res.redirect(`/?login=true&redirect=${req.originalUrl}`);
    }
    
    const userId = res.locals.authUser["id"];
    const user = await userModel.findOne({ _id: userId }).lean();
  res.render("contact", { 
    user: user, 
    title: "Liên hệ",
   })
});

app.post("/contact", async (req, res) => { // for update
  const userId = res.locals.authUser["id"];
  //have some problem with database, note by !
  const trip_new = await replyModel.create({
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    reply: req.body.reply,
  });
  const user = await userModel.findOne({ _id: userId }).lean();
  
  res.render("contact", {
     // !
    user: user,
    title: "Liên hệ",
  });
});


app.get("/create_partner", async (req, res) => {
  if (!req.session.auth) {
    return res.redirect(`/?login=true&redirect=${req.originalUrl}`);
  }
  
res.render("create_partner", { 
  title: "Thêm đối tác",
 })
});

app.post("/create_partner", async (req, res) => { // for update

//have some problem with database, note by !
const gartage_new = await garageModel.create({
  car: req.body.xz,
  name: req.body.name,
  phone: req.body.phone,
  imgPath: "../img/user_avatar.png",
  
});

res.render("create_partner", {
   // !
  title: "Thêm đối tác",
});
});


app.use("/", userRouter.router);

// LOG OUT
app.get("/logout", (req, res) => {
  req.session.auth = null;
  req.session.authUser = null;
  res.redirect("/");
})

app.set("port", process.env.PORT || 5000);
app.listen(app.get("port"), () => {
  console.log("server id listening on port " + app.get("port"));
});
