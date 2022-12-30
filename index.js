const express = require("express");
const app = express();
const expressHbs = require("express-handlebars");

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

app.get("/createTables", (req, res) => {
  let models = require("./models");
  models.sequelize.sync().then(() => {
    res.send("table created");
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/ticket_list", (req, res) => {
  res.render("ticket_list");
});

app.get("/ticket_info", (req, res) => {
  res.render("ticket_info");
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

app.set("port", process.env.PORT || 5000);
app.listen(app.get("port"), () => {
  console.log("server id listening on port " + app.get("port"));
});
