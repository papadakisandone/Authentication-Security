//jshint esversion:6
require("dotenv").config(); // enviroment variables
const ejs = require("ejs");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require ("passport");
const passportLocalMongoose = require ("passport-local-mongoose");

//const encrypt = require("mongoose-encryption");
//const md5 = require("md5"); //  encryption
// const bcrypt = require ("bcrypt"); //  encryption
// const saltrounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

//config senssion
app.use(session({
  secret: "our little secret.",
  resave: false,
  saveUninitialized: false
}));
// init passport package
app.use(passport.initialize());
// use passport to manage session
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");
//mongoose.set("useCreateIndex",true);

//----DB-----
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// user Schema
userSchema.plugin(passportLocalMongoose); // encryption

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//------Routes-----
app.route("/")
  .get(function(req, res) {
    res.render("home");
  });

app.route("/login")
  .get(function(req, res) {
    res.render("login");
  })
  .post(function(req, res){
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
    // authenticate the user with passport to login, use also cookies
    req.login(user, function(err){
      if (err){
        console.log(err);
      }else{
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
        })
      }
    })
  })

app.route("/register")
  .get(function(req, res) {
    res.render("register");
  })
  .post(function(req, res) {
    User.register({username: req.body.username}, req.body.password, function(err, user){
      if (err){
        console.log(err);
        res.redirect("/register");
      }else{
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
        });
      }
    })//register

  }); //post
app.route("/secrets")
.get(function(req, res){
  if (req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
})

app.route("/logout")
.get(function(req, res){
  req.logout();
  res.redirect('/');
})


//server
app.listen(3000, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Server start on port 3000.");
  }
});
