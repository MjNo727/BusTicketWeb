const express = require("express");
const bcrypt = require("bcrypt");
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


const router = express.Router();


// SEARCH FUNCTION
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

//for ad

router.get("/manage_trip_list", async function (req, res) {
    if (!req.session.auth) {
      return res.redirect(`/login?login=true&redirect=${req.originalUrl}`);
    }
    console.log();
    if (res.locals.authUser["role"] != "admin") {
      console.log("wrong role");
      return res.redirect("/");
    }
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

router.post("/manage_trip_list", handleSearchAdmin);

router.get("/create_trip_info", async (req, res) => {
    if (!req.session.auth) {
      return res.redirect(`/login?login=true&redirect=${req.originalUrl}`);
    }
    if (res.locals.authUser["role"] != "admin") {
      console.log("wrong role");
      return res.redirect("/");
    }
    const garageList = await garageModel.find().lean(); // !
    // const newGarageList = []; // !
    const carList = await carModel.find().lean();
    // for (let i = 0; i < garageList.length; ++i) { // !
    //   const ele = garageList[i]; // !
    //   const garage = { ...ele }; // !
    //   newGarageList.push(garage);
    // }
    // console.log(newGarageList);
    res.render("create_trip_info", {
        gaList: garageList,
        carList: carList,
        title: "Tạo chuyến đi",
    });
});

router.post("/create_trip_info", async (req, res) => { // for update

    //have some problem with database, note by !
    // const trip_garage = (await garageModel.findOne({ name: req.body.garage_name }));
    // const trip_car = (await carModel.findOne({ name: req.body.car_name }))
    const trip_new = await tripModel.create({
        garage: req.body.garage_id,
        car: req.body.car_id,
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

    return res.redirect("/manage_trip_list");

    // const ticketList = await ticketModel.find().lean(); // !
    // const newTicketList = []; // !

    // for (let i = 0; i < ticketList.length; ++i) { // !
    //   const ele = ticketList[i]; // !
    //   const ticket = { ...ele }; // !
    //   const tripId = ele.trip;
    //   const trip = await tripModel.findById(tripId).lean();
    //   ticket.tripInfor = trip;
    //   ticket.garageInfor = await garageModel.findById(trip.garage).lean();
    //   ticket.carInfor = await carModel.findById(trip.car).lean();
    //   newTicketList.push(ticket);
    // }

    // res.render("manage_trip_list", {
    //   ticketList: newTicketList, // !
    //   ticketListJSON: JSON.stringify(newTicketList), // !
    //   title: "Quản lý chuyến đi",

    // });
});

router.get("/delete_trip", async (req, res) => { // not finish
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
    const orders = (await orderModel.find({ ticket: ticket.id }));
    for (var i = 0; i < orders.length; ++i)
        orders[i].delete();
    // console.log(orders[i].status);
    ticket.delete();
    trip.delete();


    return res.redirect("/manage_trip_list");
    // const ticketList = await ticketModel.find().lean(); // !
    // const newTicketList = []; // !

    // for (let i = 0; i < ticketList.length; ++i) { // !
    //   const ele = ticketList[i]; // !
    //   const ticket = { ...ele }; // !
    //   const tripId = ele.trip;
    //   const trip = await tripModel.findById(tripId).lean();
    //   if (trip == null)
    //     continue;
    //   ticket.tripInfor = trip;
    //   // console.log(trip);
    //   ticket.garageInfor = await garageModel.findById(trip.garage).lean();
    //   ticket.carInfor = await carModel.findById(trip.car).lean();
    //   newTicketList.push(ticket);
    // }

    // res.render("manage_trip_list", {
    //   ticketList: newTicketList, // !
    //   ticketListJSON: JSON.stringify(newTicketList), // !
    //   title: "Danh sách chuyến đi",
    // });

})

router.get("/replication_trip", async (req, res) => { // not finish
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
    const trip_replication = await tripModel.create({
        garage: trip.garage,
        car: trip.car,
        name: trip.name,
        departure_place: trip.departure_place,
        arrive_place: trip.arrive_place,
        departure_date: trip.departure_date,
        arrive_date: trip.arrive_date,
        departure_time: trip.departure_time,
        arrive_time: trip.arrive_time,
        total_time: trip.total_time,

    });
    await ticketModel.create({
        trip: trip_replication.id,
        price: ticket.price,
        limit: ticket.limit,
    });

    return res.redirect("/manage_trip_list");
})

router.get("/manage_trip_info", async (req, res) => {
    if (!req.session.auth) {
      return res.redirect(`/login?login=true&redirect=${req.originalUrl}`);
    }
    if (res.locals.authUser["role"] != "admin") {
      console.log("wrong role");
      return res.redirect("/");
    }
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
    // ticket.carInfor = await carModel.findById(trip.car).lean();

    const gaList = await garageModel.find().lean();
    const carList = await carModel.find().lean();
    // console.log(gaList)

    // console.log(ticket);
    res.render("manage_trip_info", {
        gaList: gaList,
        carList: carList,
        ticketInfor: ticket, // !
        title: "Chỉnh sửa chuyến đi",
    });
});

router.post("/manage_trip_info", async (req, res) => { // for update

    //have some problem with database, note by !
    let id = req.query.trip;

    const ticket_update = await ticketModel.findOne({ _id: id });
    ticket_update.price = req.body.ticket_price;
    ticket_update.limit = req.body.ticket_limit;
    ticket_update.save();
    const trip_update = await tripModel.findOne({ _id: ticket_update.trip });
    trip_update.garage = req.body.garage_id;
    trip_update.car = req.body.car_id;
    trip_update.name = req.body.trip_name;
    trip_update.departure_place = req.body.trip_departure_place;
    trip_update.arrive_place = req.body.trip_arrive_place;
    trip_update.departure_date = req.body.trip_departure_date;
    trip_update.arrive_date = req.body.trip_arrive_date;
    trip_update.departure_time = req.body.trip_departure_time;
    trip_update.arrive_time = req.body.trip_arrive_time;
    trip_update.total_time = req.body.trip_total_time;
    trip_update.save();


    return res.redirect("/manage_trip_info?trip=" + id);
    // let ticketInfor = await ticketModel.findById(id).lean(); // it should by trip model

    // let ele = ticketInfor; // !
    // let ticket = { ...ele }; // !
    // let tripId = ele.trip;

    // const trip = await tripModel.findById(tripId).lean();
    // ticket.tripInfor = trip;
    // ticket.garageInfor = await garageModel.findById(trip.garage).lean();
    // ticket.carInfor = await carModel.findById(trip.car).lean();

    // res.render("manage_trip_info", {
    //   ticketInfor: ticket, // !
    //   title: "Chỉnh sửa chuyến đi",
    // });
});



router.get("/manage_history", async (req, res) => {
    if (!req.session.auth) {
      return res.redirect(`/login?login=true&redirect=${req.originalUrl}`);
    }
    if (res.locals.authUser["role"] != "admin") {
      console.log("wrong role");
      return res.redirect("/");
    }

    const orders = await orderModel.find().lean();
    const order_details = [];

    const addOrder = async () => {
        for (let i = 0; i < orders.length; ++i) {
            const ele = orders[i];

            const userId = ele.user;
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

router.post("/manage_history", async (req, res) => {
    const order_update = await orderModel.findOne({ _id: req.body.order_id });
    const ticket_update = await ticketModel.findOne({ _id: order_update.ticket });
    ticket_update.limit += (order_update.number - req.body.order_number);
    ticket_update.save();
    order_update.number = req.body.order_number;
    order_update.save();

    return res.redirect("/manage_history");
    //save chua du nhanh
    // const orders = await orderModel.find().lean();
    // const order_details = [];

    // const addOrder = async () => {
    //   for (let i = 0; i < orders.length; ++i) {
    //     const ele = orders[i];
    //     if (ele == null)
    //       continue;

    //     const userId = ele.user;
    //     const user = await userModel.findOne({ _id: userId }).lean();

    //     console.log(user.fullname)

    //     const ticketId = ele.ticket;
    //     const ticket = await ticketModel.findOne({ _id: ticketId }).lean();

    //     const tripId = ticket.trip;
    //     const trip = await tripModel.findOne({ _id: tripId }).lean();

    //     const garageId = trip.garage;
    //     const garage = await garageModel.findOne({ _id: garageId }).lean();

    //     const carId = trip.car;
    //     const car = await carModel.findOne({ _id: carId }).lean();

    //     const total_price = parseInt(ele.number) * parseInt(ticket.price);
    //     // console.log(ele.number + " <> " + ticket.price)
    //     const order = {
    //       id: ele._id,
    //       number: ele.number,
    //       price: total_price,
    //       status: ele.status,
    //       user_infor: user,
    //       trip_infor: trip,
    //       ticket_infor: ticket,
    //       garage_infor: garage,
    //       car_infor: car
    //     }
    //     order_details.push(order);
    //   }
    // }
    // await addOrder();
    // // console.log(order_details);
    // res.render("manage_history", {
    //   order_details: order_details,
    //   title: "Quản lý đặt chỗ",
    // });
});



router.get("/manage_partner", async (req, res) => {
    if (!req.session.auth) {
      return res.redirect(`/login?login=true&redirect=${req.originalUrl}`);
    }
    if (res.locals.authUser["role"] != "admin") {
      console.log("wrong role");
      return res.redirect("/");
    }
    const garageList = await garageModel.find().lean();
    const ratingItems = await ratingModel.find().lean();

    for (let i = 0; i < garageList.length; i++) {
        let totalStar = 0;
        let totalRating = 0;
        for (let j = 0; j < ratingItems.length; j++) {
            if (ratingItems[j].garage === garageList[i]._id.toString()) {
                totalRating++;
                totalStar += ratingItems[j].star;
            }
        }
        let average = (totalStar / totalRating).toFixed(1);
        garageList[i].average = average;
        garageList[i].total = totalRating;
        // console.log(garageList[i].name)
    }

    res.render("manage_partner", {
        garageList,
        title: "Quản lý nhà xe",
    });
})

router.post("/manage_partner", async (req, res) => {

    const gararge_update = await garageModel.findOne({ _id: req.body.garage_id });
    gararge_update.name = req.body.garage_name;
    gararge_update.phone = req.body.garage_phone;
    gararge_update.save();
    // console.log(req.body.garage_name)

    return res.redirect("/manage_partner"); //speed is good now!!
    // const garageList = await garageModel.find().lean();  
    // const ratingItems = await ratingModel.find().lean();
    //speed to slow
    // for (let i = 0; i < garageList.length; i++) {
    //   let totalStar = 0;
    //   let totalRating = 0;
    //   for (let j = 0; j < ratingItems.length; j++) {
    //     if (ratingItems[j].garage === garageList[i]._id.toString()) {
    //       totalRating++;
    //       totalStar += ratingItems[j].star;
    //     }
    //   }
    //   let average = (totalStar / totalRating).toFixed(1);
    //   garageList[i].average = average;
    //   garageList[i].total = totalRating;
    //   // console.log(garageList[i].name)
    // }

    // res.render("manage_partner", {
    //   garageList,
    //   title: "Quản lý nhà xe",
    // });
})

router.get("/create_partner", async (req, res) => {
    // if (!req.session.auth) {
    //   return res.redirect(`/?login=true&redirect=${req.originalUrl}`);
    // }
    // if (res.locals.authUser["role"] != "admin") {
    //   console.log("wrong role");
    //   return res.redirect("/");
    // }

    res.render("create_partner", {
        title: "Thêm đối tác",
    })
});

router.post("/create_partner", async (req, res) => { // for update

    //have some problem with database, note by !
    const gartage_new = await garageModel.create({
        car: req.body.xz,
        name: req.body.name,
        phone: req.body.phone,
        imgPath: "../img/user_avatar.png",

    });
    return res.redirect("/manage_partner");
    // const garageList = await garageModel.find().lean();  
    // const ratingItems = await ratingModel.find().lean();

    // for (let i = 0; i < garageList.length; i++) {
    //   let totalStar = 0;
    //   let totalRating = 0;
    //   for (let j = 0; j < ratingItems.length; j++) {
    //     if (ratingItems[j].garage === garageList[i]._id.toString()) {
    //       totalRating++;
    //       totalStar += ratingItems[j].star;
    //     }
    //   }
    //   let average = (totalStar / totalRating).toFixed(1);
    //   garageList[i].avg = average;
    // }

    // res.render("manage_partner", {
    //   garageList,
    //   title: "Quản lý nhà xe",
    // });
});

router.get("/delete_partner", async (req, res) => {
    const garage_id = req.query.garage;
    console.log()
    const trips = await tripModel.find({ garage: garage_id });
    for (var i = 0; i < trips.length; ++i) {
        const tickets = await ticketModel.find({ trip: trips[i].id });
        for (var j = 0; j < tickets.length; ++j) {
            const orders = await orderModel.find({ ticket: tickets[i].id })
            for (var k = 0; k < orders.length; ++k) {
                orders[k].delete();
                // console.log(orders[i].status)
            }
            tickets[j].delete();
            // console.log(tickets[j].price)
        }
        // console.log(trips[i].name)
        trips[i].delete();
    }
    const ratings = await orderModel.find({ garage: garage_id });
    for (var i = 0; i < ratings.length; ++i)
        ratings[i].delete();
    const garage = (await garageModel.findOne({ _id: garage_id }))
    garage.delete();
    // console.log(garage.name);


    return res.redirect("/manage_partner");

    // const garageList = await garageModel.find().lean();  
    // const ratingItems = await ratingModel.find().lean();

    // for (let i = 0; i < garageList.length; i++) {
    //   if (garageList[i] == null)
    //     continue
    //   let totalStar = 0;
    //   let totalRating = 0;
    //   for (let j = 0; j < ratingItems.length; j++) {
    //     if (ratingItems[j].garage === garageList[i]._id.toString()) {
    //       totalRating++;
    //       totalStar += ratingItems[j].star;
    //     }
    //   }
    //   let average = (totalStar / totalRating).toFixed(1);
    //   garageList[i].average = average;
    //   garageList[i].total = totalRating;
    //   // console.log(garageList[i].name)
    // }

    // res.render("manage_partner", {
    //   garageList,
    //   title: "Quản lý nhà xe",
    // });
});


router.get("/manage_contact", async (req, res) => {
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

router.get("/manage", (req, res) => {
    if (!req.session.auth) {
      return res.redirect(`/login?login=true&redirect=${req.originalUrl}`);
    }
    if (res.locals.authUser["role"] != "admin") {
      console.log("wrong role");
      return res.redirect("/");
    }
    res.render("manage", { title: "Quản lý hệ thống" });
});


exports.router = router;
