//jshint esversion:6
require("dotenv").config(); // enviroment variables
const ejs = require("ejs");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5"); //  encryption
const bcrypt = require ("bcrypt"); //  encryption
const saltrounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB");

//----DB-----
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
// const secret = process.env.SECRET;
// userSchema.plugin(encrypt,{secret: secret, encryptedFields:["password"]});


const User = new mongoose.model("User", userSchema);

//------Routes-----
app.route("/")
  .get(function(req, res) {
    res.render("home");
  });

app.route("/login")
  .get(function(req, res) {
    res.render("login");
  })
  .post(function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, function(err, foundUser) {
      if (foundUser) { // user exist
        bcrypt.compare(password, foundUser.password, function(err, corectPass){ // check for correct pass
          if (corectPass){
            res.render("secrets");
          } else {
            console.log("User not found, try again.");
          }
        } )// bcrypt



      } else {
        if (err) {
          console.log(err);
        } else {
          console.log("User not found, try again.");
        } //else
      } //else
    }) // findOne
  }) // post

app.route("/register")
  .get(function(req, res) {
    res.render("register");
  })
  .post(function(req, res) {
    bcrypt.hash(req.body.password, saltrounds, function(err, hash){
      // create user
      const newUser = new User({
        email: req.body.username,
        password: hash
      });
      newUser.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          res.render("secrets");
        }
      }) //save
    }) // hash

  }); //post


//server
app.listen(3000, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Server start on port 3000.");
  }
});
