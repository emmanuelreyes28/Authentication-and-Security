//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
const md5 = require("md5"); //md5 is used to hash strings in this case psswds

const app = express();

console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

//need to create a new mongoose.Schema when using encryption
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


//use encrypt plugin and only encrypt password
//make sure that encryptedfields matches the same name in schema fields
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});


const User = new mongoose.model("User", userSchema);   

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    //create new user doc in userDB
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password) //hash password with md5
    });

    //save user to db and render secrets page if successful
    newUser.save(function(err){
        if(!err){
            res.render("secrets");
        } else{
            console.log(err);
        }
    });
});

app.post("/login", function(req, res){
    //store requested values in variables 
    const username = req.body.username;
    const password = md5(req.body.password); //hash psswd here so it matches the hashed psswd in db

    //find user in db using email
    User.findOne({email: username}, function(err, foundUser){
        if(err){
            console.log(err);
        } else{
            if(foundUser){
                //if user found then check if password matches
                if(foundUser.password === password){
                    //if both username and password match then render secrets page
                    res.render("secrets");
                }
            }
        }
    });
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});