//jshint esversion:6
//requiring packages

const express= require("express");
const bodyParser=require("body-parser");
const ejs = require("ejs");//for templating
const session = require("express-session");
const mongoose = require("mongoose");//for database
const passport =require("passport");//for authentication
const passportLocalMongoose =require("passport-local-mongoose");
// const findOrCreate = require('mongoose-find-or-create');


const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static("public"));

app.set('views', __dirname + '/views');
app.set("view engine", "ejs");


app.use(session({
    secret:"OurlittleSecret",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());


//connecting to database
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);


const userSchema= new mongoose.Schema({
    email: String,
    password: String,
    data: [{
        name: String,
        emailAdd: String,
        phone: Number,
    }] 
});


userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

//implementing passport
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//get routes
app.get("/", function(req, res) {
    res.render("home");    
});

app.get("/signup", function(req, res) {
    res.render("signup");
});
app.get("/database/:id", function(req, res) {
    const passedId=req.params.id;
    if(req.isAuthenticated()){
        User.findById(passedId, function(err, foundUser) {
            if (err) {
                console.log(err);
            } else {
                if(foundUser){
                        res.render("database",{user:foundUser}); 
                    }
                }
            });
        }else{
        res.redirect("/");
    }
    
});

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

app.get("/add_user",function(req,res){
    res.render("add_user");
})

app.get("/update/:userId",function(req,res){ 
    res.render("update_user",{
        foundId:req.params.userId
    });
});

//post routes

///////////////////////////////////////////User Login///////////////////////////////////////////////////////
app.post("/home",function(req,res){

const user = new User({
    username: req.body.username,
    password: req.body.password
});

req.login(user, function(err) {
    if (err) {
        console.log(err);
    } else {
        passport.authenticate("local")(req, res, function() {
            res.redirect("/database/"+req.user.id);
        });
    }
});
});


////////////////////////////////////////////User Sign-Up//////////////////////////////////////////////////
app.post("/signup",function(req,res){

    User.register({ username: req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/signup");
        } else {        
            passport.authenticate("local")(req, res, function() {
                res.redirect("/database/"+req.user.id);
            });
        }
    });
    });

// ////////////////////////////////////////////////Database Page////////////////////////////////////////////



// ///////////////////////////////////////////////Add User//////////////////////////////////////////////////
app.post("/add_user",function(req,res){
const userId=req.body.id;
    User.findOne({userId}, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.data.push({
                    name:req.body.fname,
                    emailAdd:req.body.emailadd,
                    phone:req.body.phone
                  });
                foundUser.save(function() {
                    res.redirect("/database/"+foundUser.id);
                });
                
            }
        }
    });
   
});

//////////////////////////////////////////////////Update User//////////////////////////////////////////
app.post("/update_user",function(req,res){

    const reqId=req.body.Id;
    
    User.find({},function(err,foundUsers){
        if(err){
            console.log(err);
        }else{
            if (foundUsers) {
                foundUsers.forEach(foundUser => {
                    for (let i = 0; i < foundUser.data.length; i++) {
                    if(reqId===foundUser.data[i].id){
                        foundUser.data.splice(i,1,{
                            name:req.body.fname,
                            emailAdd:req.body.emailadd,
                            phone:req.body.phone
                        });
                    foundUser.save(function() {
                        res.redirect("/database/"+foundUser.id);
                    });  
                    }
                }          
                });
            }
        }
        });
});


/////////////////////////////////////////////////////Delete User/////////////////////////////////////////////
app.post("/delete",function(req,res){
    const reqId=req.body.del;
    
    User.find({},function(err,foundUsers){
        if(err){
            console.log(err);
        }else{
            if (foundUsers) {
                foundUsers.forEach(foundUser => {
                    for (let i = 0; i < foundUser.data.length; i++) {
                    if(reqId===foundUser.data[i].id){
                        foundUser.data.splice(i,1);
                        foundUser.save(function() {
                        res.redirect("/database/"+foundUser.id);
                    });  
                    }
                }          
                });
            }
        }
        });
})

//to make sure server is running
app.listen(3000, function() {
    console.log("Server started at port 3000");
});