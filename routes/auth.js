const bcrypt = require("bcrypt");
const Users = require("../models/Users");
var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");

router.post("/signUp", async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await Users.findOne({ email });
    if (user) return res.json({ msg: "USER EXISTS" });

    await Users.create({
      ...req.body,
      password: await bcrypt.hash(password, 5),
    });
    console.log('User created')

    return res.json({ msg: "CREATED" });
  } catch (error) {
    res.json({ msg: "ERROR: " + error.message});
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log('login k andar hun ');
    const { email, password } = req.body;

    const user = await Users.findOne({ email });
    if (!user) return res.json({ msg: "USER NOT FOUND" });

    const passwordCheck = await bcrypt.compare(password, user.password);
    if (!passwordCheck) return res.json({ msg: "WRONG PASSWORD" });

    const token = jwt.sign(
      {
        _id: user._id,
        email,
        createdAt: new Date(),
        admin: user.admin,
      },
      "MY_SECRET",
      { expiresIn: "1d" }
    );

    res.json({
      msg: "LOGGED IN",
      token,
    });
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
