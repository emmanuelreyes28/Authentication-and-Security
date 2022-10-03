//jshint esversion:6
const express = require("express");
const bodParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = {
    email: String,
    password: String
};

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
        password: req.body.password
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
    const password = req.body.password;

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