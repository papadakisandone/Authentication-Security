//jshint esversion:6
require("dotenv").config(); // enviroment variables
const ejs = require("ejs");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const findOrCreate = require ("mongoose-findorcreate");
const session = require("express-session");
const passport = require ("passport");
const passportLocalMongoose = require ("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

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
  password: String,
  googleId: String,
  secret: String
});

// user Schema add pluins
userSchema.plugin(passportLocalMongoose); // encryption
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err, user);
  });
});

//Google auth
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
// TODO: facebook authentication

//------Routes-----
app.route("/")
  .get(function(req, res) {
    res.render("home");
  });
  //-------------Google auth user---------------
app.route("/auth/google") // we check is that user have google account and redirect
.get(passport.authenticate("google",{scope:["profile"]})
);
//here to check for validation
app.route("/auth/google/secrets")
.get(passport.authenticate("google", {failureRedirect: "/login"}), function(req, res){
  // successful authentication, redirect to page that i want
  res.redirect("/secrets")
})
//--------------------------------

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
  // if (req.isAuthenticated()){
  //   res.render("secrets");
  // }else{
  //   res.redirect("/login");
  // }
  //find all secrets that they have value (ne-> not equal)
  User.find({"secret": {$ne:null}}, function(err, foundUsers){
    if(err){
      console.log(err);
    }else{
      if (foundUsers){
        res.render("secrets",{usersWithSecrets:foundUsers});
      }
    }
  });
});
app.route("/submit")
.get(function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
})
.post(function(req, res){
  const submitedSecret = req.body.secret;
  //console.log(req.user);
  User.findById(req.user.id, function(err, foundUser){
    if (err){
      console.log(err);
    }else{
      if (foundUser){
        foundUser.secret = submitedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  }); // findById
});// post

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
