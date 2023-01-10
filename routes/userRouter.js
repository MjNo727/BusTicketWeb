const express = require("express");
const bcrypt = require("bcrypt");
const { userModel } = require("../models/users");
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ceblekingt@gmail.com',
    pass: 'blsjuyzyaborqgbd'
  }
});

const router = express.Router();

router.get("/", function (req, res) {
  if (req.query.login)
    res.locals.login_errorMessage = "Please login to continue";
  res.render("index",{ title: "Trang chủ"});
})

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
    return res.render("index.hbs", {
      errorMessage: "Tài khoản đã tồn tại!",
    });

  if (!name || !phone_number || !email || !password || !confirm_password) {
    return res.render("index.hbs", {
      errorMessage: "Vui lòng nhập đầy đủ thông tin",
    });
  }

  if (password != confirm_password) {
    return res.render("index.hbs", {
      errorMessage: "Mật khẩu không trùng khớp",
    });
  }

  const email_re = /\S+@\S+\.\S+/;
  if (!email_re.test(email)) {
    return res.render("index.hbs", {
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
    res.render("index.hbs", {
      errorMessage: "Hệ thống đang xảy ra lỗi! Đăng ký không thành công",
    });
  }
};

const handleLogin = async function (req, res) {
  // const prev_url = req.headers.referer;
  // console.log(prev_url);
  const { phone_mail, password } = req.body;

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
      return res.render("index", {
        login_successMessage: "Đăng nhập thành công",
      });
    }
  }

  res.render("index.hbs", {
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
    return res.render("index.hbs", {
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
          return res.redirect("index.hbs", { title: "Trang chủ" },);
        } else {
          return res.render( "index", {
            resetpass_Message: "Mật khẩu mới đã được gửi tới email của bạn.",
          });
        }
      });
    } catch(error){
      return res.redirect("index.hbs", { title: "Trang chủ" }, );
    } 
  }
};

router.post("/", function (req, res, next) {
  const { submit } = req.body;
  if (submit === "register") handleRegister(req, res);
  else if (submit === "login") handleLogin(req, res);
  else if (submit === "resetpass") handleResetPass(req, res);
  else res.redirect(req.query.redirect || "/");
});


// //trick fix when log in or sign up at promotion // how better?
router.post("/promotion", function (req, res, next) {
  const { submit } = req.body;
  if (submit === "register") handleRegister(req, res);
  else if (submit === "login") handleLogin(req, res);
  else if (submit === "resetpass") handleResetPass(req, res);
  else res.redirect(req.query.redirect || "/");
});


//trick fix when log in or sign up at new detail // how better?
router.post("/news_details", function (req, res, next) {
  const { submit } = req.body;
  if (submit === "register") handleRegister(req, res);
  else if (submit === "login") handleLogin(req, res);
  else if (submit === "resetpass") handleResetPass(req, res);
  else res.redirect(req.query.redirect || "/");
});


exports.router = router;
