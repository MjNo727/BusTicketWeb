const express = require("express");
const session = require("express-session");
// const { userModel } = require("../models/users");

const { ticketModel } = require("../models/tickets.js");
const { tripModel } = require("../models/trip.js");
const { garageModel } = require("../models/garage.js");
const { carModel } = require("../models/car.js");
const { orderModel } = require("../models/orders.js");
const { userModel } = require("../models/users.js");
const { ratingModel } = require("../models/ratings.js");
const { replyModel } = require("../models/reply.js");
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ceblekingt@gmail.com',
    pass: 'blsjuyzyaborqgbd'
  }
});

const router = express.Router();

//trip list
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

  // // Pagination
  // const number_ticket_display = 5;
  // const total_page = Math.ceil(newTicketList.length / number_ticket_display);

  // const current_page = req.query.page || 1;
  // const paginationList = newTicketList.slice((current_page - 1) * number_ticket_display, current_page * number_ticket_display);

  // const pagesList = [];
  // // console.log(current_page);
  // for (let i = 1; i <= total_page; i++) {
  //   pagesList[i - 1] = i;
  // }

  res.render("ticket_list", {
    ticketList: newTicketList,
    ticketListJSON: JSON.stringify(newTicketList),
    title: "Danh sách chuyến đi",
  });
};

router.get("/ticket_list", async (req, res) => {
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
  // console.log(current_page);
  for (let i = 1; i <= total_page; i++) {
    pagesList[i - 1] = i;
  }
  // console.log(current_page);

  // GET all garage name
  const garagesObj = await garageModel.find().lean();

  const garage_name = [];
  for (let i = 0; i < garagesObj.length; i++) {
    garage_name[i] = garagesObj[i].name;
    // console.log(garagesObj[i].name);
  }

  res.render("ticket_list", {
    garage_option: garage_name,
    current_page: current_page,
    pagesList: pagesList,
    ticketList: paginationList,
    title: "Danh sách chuyến đi",
    ticketListJSON: JSON.stringify(newTicketList),
  });
});

router.post("/ticket_list", handleSearch);


//trip info
router.get("/ticket_info", async (req, res) => {
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


// ************************ BOOKING FUNCTION ***************

router.get("/booking", async (req, res) => {
  if (!req.session.auth) {
    return res.redirect(`/login?login=true`)//&redirect=${req.originalUrl}`);
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
  const email = req.body.email;
  const number = req.body.number;

  const ticketId = req.query.ticket; // lay id ticket dang đặt
  const ticket = await ticketModel.findOne({ _id: ticketId });
  const trip = await tripModel.findOne({ _id: ticket.trip });
  ticket.limit -= number;
  ticket.save();

  // res.locals.successMessageBooking = "Đặt vé thành công!";
  const order = await orderModel.create({
    user: id_user,
    ticket: ticketId,
    number: number,
    phone4order: phone,
    email4order: email,
    status: "Vừa đặt"
  });

  var mailContain = 'Chào ' + name +
    '.\nCảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi trong suốt thời gian qua.' +
    '\nChúng tôi đã nhận được yêu cầu đặt vé của bạn và muốn thông báo đến bạn yêu cầu đặt vé đã thành công.' +
    '\nVui lòng kiểm tra lại thông tin và thanh toán trước giờ lên xe.' +
    '\n         Họ và tên: ' + name +
    '\n         Số điện thoại: ' + phone +
    '\n         Email: ' + email +
    '\n         Mã đơn hàng: ' + order.id +
    '\n         Chuyến đi: ' + trip.name +
    '\n         Thời gian khởi hành: ' + trip.departure_time + ' ' + trip.departure_date +
    '\n         Số ghế: ' + number +
    '\n         Tổng tiền: ' + number * ticket.price +
    '\n         Lên xe tại: ' + trip.departure_place +
    '\nĐược phục vụ quý khách là niềm vinh hạnh của chúng tôi.\nThân ái!';

  var mailOptions = {
    from: 'doctor strange',
    to: email,
    subject: 'Xác nhận đặt thành công vé xe',
    text: mailContain,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  res.redirect("/history");
};

router.post("/booking", bookingFunction);


//***************************** HISTORY REVIEW Vé *************************************/
router.get("/history", async (req, res) => {
  if (!req.session.auth) {
    return res.redirect(`/login?login=true&redirect=${req.originalUrl}`);
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

  res.render("history", {
    order_details: order_details.reverse(),
    order_detailsJSON: JSON.stringify(order_details),
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

router.post("/history", destroyOrderFunction);


// ***********************************************************************************
//promotion
router.get("/promotion", (req, res) => {
  res.render("promotion", { title: "Khuyến mãi" });
});


//new details
router.get("/news_details", (req, res) => {
  res.render("news_details", { title: "Tin tức" });
});


// parner -  RATING FEATURES 
router.get("/partner_info", async (req, res) => {
  // if (!req.session.auth) {
  //   return res.redirect(`/login?login=true`); // &redirect=${req.originalUrl}`);
    
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
  // if (req.query.login)
  //   return;
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
  // console.log("t")
  res.redirect("/partner_info");
}

router.post("/partner_info", ratingFunction);


//user info
router.get("/user_info", async (req, res) => {
  if (!req.session.auth) {
    return res.redirect(`/login?login=true&redirect=${req.originalUrl}`);
  }
  const userId = req.query.userId;
  if (res.locals.authUser["id"] != userId) {
    console.log("wrong user");
    return res.redirect("/");
  }
  const user = await userModel.findOne({ _id: userId }).lean();
  // console.log(user.imgPath);
  res.render("user_info", {
    user: user,
    title: "Thông tin cá nhân",
  });
});

router.post("/user_info", async (req, res) => {
  const userId = req.query.userId;
  const user_update = await userModel.findOne({ _id: userId })
  user_update.fullname = req.body.user_fullname
  user_update.email = req.body.user_email
  user_update.phoneNumber = req.body.user_phoneNumber
  user_update.save()


  return res.redirect("/user_info");
  //load qua cham
  // const user = await userModel.findOne({ _id: userId }).lean();
  // res.render("user_info", {
  //   user: user,
  //   title: "Thông tin cá nhân",
  // });
});


//about us
router.get("/about_us", (req, res) => {
  res.render("about_us", { title: "Về chúng tôi" });
});


//contact
router.get("/contact", async (req, res) => {
  if (!req.session.auth) {
    return res.redirect(`/?login=true`)//&redirect=${req.originalUrl}`);
  }

  const userId = res.locals.authUser["id"];
  const user = await userModel.findOne({ _id: userId }).lean();
  res.render("contact", {
    user: user,
    title: "Liên hệ",
  })
});

router.post("/contact", async (req, res) => { // for update
  //have some problem with database, note by !
  const trip_new = await replyModel.create({
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    reply: req.body.reply,
  });


  return res.redirect("/contact");
  // const userId = res.locals.authUser["id"];
  // const user = await userModel.findOne({ _id: userId }).lean();

  // res.render("contact", {
  //   // !
  //   user: user,
  //   title: "Liên hệ",
  // });
});



exports.router = router;

