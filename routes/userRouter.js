const express = require("express");
const bcrypt = require("bcrypt");
const { userModel } = require("../models/users");

const router = express.Router();

router.get("/", function (req, res) {
  if (req.query.login)
    res.locals.login_errorMessage = "Please login to continue";

  res.render("index", { title: "Trang chủ" },);
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

    res.render("index.hbs", {
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
      return res.redirect(req.query.redirect || "/");
      // return res.render("index.hbs", {
      //   login_successMessage: "Đăng nhập thành công",
      // });
    }
  }

  res.render("index.hbs", {
    login_errorMessage: "Tài khoản hoặc mật khẩu không chính xác",
  });
};

router.post("/", function (req, res, next) {
  const { submit } = req.body;
  if (submit === "register") handleRegister(req, res);
  else if (submit === "login") handleLogin(req, res);
  else res.redirect(req.query.redirect || "/");
});

exports.router = router;
