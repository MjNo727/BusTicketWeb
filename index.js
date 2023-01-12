const express = require("express");
const app = express();
const expressHbs = require("express-handlebars");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userRouter = require("./routes/userRouter.js");
const adminRouter = require("./routes/adminRouter.js");
const session = require("express-session");

const { userModel } = require("./models/users.js");
const helper = require("./helper/helper.js");
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ceblekingt@gmail.com',
    pass: 'blsjuyzyaborqgbd'
  }
});

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

// app.get("/", (req, res) => {
//   if (req.query.login)
//     res.locals.login_errorMessage = "Please login to continue";

//   res.render("index", { title: "Trang chủ" },);
// });

app.use("/", userRouter.router);



//from here

const handleRegister = async function (req, res) {
  const name = req.body.name;
  const password = req.body.password;
  const phone_number = req.body.phone_number;
  const email = req.body.email;
  const confirm_password = req.body.confirm_password;

  const isExisted = await userModel
    .find({
      $or: [{ phoneNumber: phone_number }, { email: email }],
    })
    .lean();

  if (isExisted.length > 0)
    return res.render("signup", {
      title: "Đăng ký",
      errorMessage: "Tài khoản đã tồn tại!",
    });

  if (!name || !phone_number || !email || !password || !confirm_password) {
    return res.render("signup", {
      title: "Đăng ký",
      errorMessage: "Vui lòng nhập đầy đủ thông tin",
    });
  }

  if (password != confirm_password) {
    return res.render("signup", {
      title: "Đăng ký",
      errorMessage: "Mật khẩu không trùng khớp",
    });
  }

  const email_re = /\S+@\S+\.\S+/;
  if (!email_re.test(email)) {
    return res.render("signup", {
      title: "Đăng ký",
      errorMessage: "Email không hợp lệ",
    });
  }

  const hash_pw = await bcrypt.hash(password, 12); // size: 12
  try {
    await userModel.create({
      fullname: name,
      password: hash_pw,
      phoneNumber: phone_number,
      email: email,
    });

    res.render(req.query.redirect.slice(1) || "index", {
      title: "Ok bạn nhé",
      successMessage: "Đăng ký thành công",
    });
  } catch (error) {
    res.render("signup", {
      title: "Đăng ký",
      errorMessage: "Hệ thống đang xảy ra lỗi! Đăng ký không thành công",
    });
  }
};

const handleLogin = async function (req, res) {
  // const prev_url = req.headers.referer;
  // console.log(prev_url);
  const { phone_mail, password  } = req.body;
  // var redirect = req.query.redirect
  const isExisted = await userModel.find({
    $or: [{ phoneNumber: phone_mail }, { email: phone_mail }],
  });

  if (isExisted.length) {
    const user = isExisted[0];
    const matchingPassword = await bcrypt.compare(password, user.password);
    if (matchingPassword) {
      req.session.auth = true;
      req.session.authUser = {
        fullname: user.fullname,
        phoneNumber: user.phoneNumber,
        email: user.email,
        id: user._id,
        role: user.role,
      };
      // return res.redirect(req.query.redirect || "/");
      return res.render("login", {
        // redirect,
        title: "Đăng nhập",
        login_successMessage: "Đăng nhập thành công",
      });
    }
  }

  res.render("login", {
    // redirect,
    title: "Đăng nhập",
    login_errorMessage: "Tài khoản hoặc mật khẩu không chính xác",
  });
};


const handleResetPass = async function (req, res) {
  // const prev_url = req.headers.referer;
  // console.log(prev_url);
  const { phone_mail, password } = req.body;

  const isExisted = await userModel.find({
    $or: [{ phoneNumber: phone_mail }, { email: phone_mail }],
  });
  if (!isExisted.length) {
    return res.render("login", {
      title: "Đăng nhập",
      resetpass_Message: "Tài khoản không chính xác",
    });
  }
  else {
    const user = isExisted[0];
    var randomstring = Math.random().toString(36).slice(-8);
    // var check = false;
    var hash_pw = await bcrypt.hash(randomstring, 12);
    user.password = hash_pw;
    user.save();

    var mailContain = 'Chào ' + user.fullname +
      '.\nChúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn tới trang web v.exe.' +
      '\nMật khẩu mới của bạn là: ' + randomstring +
      '.\nVui lòng không cung cấp thông tin này cho bất kì ai.\nChúc bạn có những trải nghiệm tốt nhất với dịch vụ của chúng tôi';
    var mailOptions = {
      from: 'doctor strange',
      to: user.email,
      subject: 'Đặt lại mật khẩu!',
      text: mailContain,
    };
    try {
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          return res.redirect("login");
        } else {
          return res.render("login", {
            title: "Đăng nhập",
            resetpass_Message: "Mật khẩu mới đã được gửi tới email của bạn.",
          });
        }
      });
    } catch (error) {
      return res.redirect("login");
    }
  }
};

//home page
app.get("/", function (req, res) {
  res.render("index", { title: "Trang chủ" });
})


//log in
app.get("/login", (req, res) => {
  if (req.query.login)
    res.locals.login_errorMessage = "Đăng nhập để tiếp tục";
  // var redirect = req.query.redirect //|| "index"
  res.render("login", ({
    // redirect,
    title: "Đăng nhập",
  }))
});

app.post("/login", function (req, res, next) {
  const { submit } = req.body;
  if (submit === "login") handleLogin(req, res);
  else if (submit === "resetpass") handleResetPass(req, res);
  else res.redirect("index");
});


//sign up
app.get("/signup", (req, res) => {
  res.render("signup", ({
    title: "Đăng ký"
  }))
});

app.post("/signup", function (req, res, next) {
  handleRegister(req, res);
});

// LOG OUT
app.get("/logout", (req, res) => {
  req.session.auth = null;
  req.session.authUser = null;
  res.redirect("/");
})


// app.post("/", function (req, res, next) {
//   const { submit } = req.body;
//   if (submit === "register") handleRegister(req, res);
//   else if (submit === "login") handleLogin(req, res);
//   else if (submit === "resetpass") handleResetPass(req, res);
//   else res.redirect(req.query.redirect || "/");
// });



app.use("/", adminRouter.router);


app.set("port", process.env.PORT || 5000);
app.listen(app.get("port"), () => {
  console.log("server id listening on port " + app.get("port"));
});