//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodParser.urlencoded({extended: true}));

//sessions are used to store cookies when user visits site
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

//intialize passport to start authentication 
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

//need to create a new mongoose.Schema when using encryption
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//use plugin to salt and hash psswds. Save users to mongoDB
userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);

//use encrypt plugin and only encrypt password
//make sure that encryptedfields matches the same name in schema fields
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);   

//create local login strategy
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user){
        done(err, user);
    })
});

//authenticates users using a Google account and OAuth 2.0 tokens
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    console.log("hellooooo");
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
});

//authenticate user with google strategy and grab user profile
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

//authorized redirect uri from google cloud
app.get("/auth/google/secrets", 
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    //if user is authenticated then render secrets page
    if(req.isAuthenticated()){
        res.render("secrets");
    } else{
        //otherwise prompt user to login
        res.redirect("/login");
    }
});

//when user logs out then the cookie will be cleared and user will have to login again if they want to view secrets page
app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            //if err redirect user to register again
            res.redirect("/register");
        } else{
            //if user is still logged in and is able to be authenticated then redirect them to secrets page
            //tell browser to save a cookie
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    })
    
});

app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    //check if user login credentials are valid 
    req.login(user, function(err){
        if(err){
            console.log(err);
        } else{
            //tell browser to save a cookie
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});