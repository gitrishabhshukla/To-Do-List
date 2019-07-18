// jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

///////////////////////////////////////////////////////////////////////

const app = express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret: "This is my tiny dog chulluu",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

///////////////////////////////////////////////////////////////

mongoose.connect("mongodb+srv://admin-rishabhshukla:todolist-v2@cluster0-emm8w.mongodb.net/todolistnewDB" , {useNewUrlParser:true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema ({
   username:String,
   password:String,
   googleId:String,
   facebookId:String
});
const itemSchema = new mongoose.Schema ({
     itemName:String
});
const Item = new mongoose.model("Item",itemSchema);
const listSchema = new mongoose.Schema ({
   username: String,
   listItems: [itemSchema]
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User",userSchema);
const List = mongoose.model("List", listSchema);

////////////////////////////////////////////////////////////
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

////////////////////////////////////////////

const day = date.getDate();

///////////////////////////////////////////////////
app.get("/" , function (req , res){
     res.redirect("/list");
});

app.post("/" , function (req , res){
    console.log("entered new item");
});

///////////////////////////////////////////////////////
app.get("/register", function (req , res){
    res.render("register");
});

app.post("/register", function (req , res){

   User.register({username:req.body.username} , req.body.password , function( err , user) {
       if(err) {
         console.log(err);
         res.redirect("/register");
       } else {
            passport.authenticate("local")(req , res , function (){
              const list1 = new List ({
                username: req.user.username
              });
              list1.save();
              res.redirect("/list");
          });
       }
   });

});
////////////////////////////////////////////////////////
app.get("/login" , function (req , res) {
    res.render("login");
});

app.post("/login" , function (req , res) {
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user , function (err) {
      if(err){
        console.log(err);
      } else {
            passport.authenticate("local")(req , res , function(err){
            res.redirect("/list");
        });
      }
    });
});
//////////////////////////////////////////////////////////
app.get("/list" , function (req , res) {
      if(req.isAuthenticated()){
             var items = [];
             List.findOne({username:req.user.username} , function (err,foundlist){
               if(err){console.log(err);}
               else {
                       if(foundlist) {
                         res.render("list" , { username:req.user.username , listTitle : day, newListItems:foundlist.listItems});
                       } else {
                         var items = [];
                         res.render("list" , { username:req.user.username , listTitle : day, newListItems:items});
                       }

                }
             });
      } else {
        res.redirect("/login");
    }
});
/////////////////////////////////////////////////////////////
app.post("/addItem" , function (req , res) {
    //console.log("1");
     const item1 = new Item ({
           itemName:req.body.newItem
     });
     //console.log("2");
     List.findOne({username:req.user.username} , function (err,foundlist){
       if(err){}
       else {
               if(foundlist){
                 foundlist.listItems.push(item1);
                 foundlist.save();
                 //console.log("3");
                 res.redirect("/list");
               } else {
                  //console.log("4");
                     const list1 = new List ({
                       username: req.user.username,
                       listItem: item1
                     });
                     list1.save();
                     res.redirect("/list");
               }

        }
     });
});
///////////////////////////////////////////////////////////////

app.post("/delete" , function (req,res) {
     const checkedItem = req.body.checkbox;
    // const listName = req.body.listName;

     //console.log(checkedItem);

       List.findOneAndUpdate({username:req.user.username},{$pull :{listItems:{_id:checkedItem }}},function (err, result){
         if(!err){
           console.log("Item deleted successfully");
           res.redirect("/list");
         }
       });

});
///////////////////////////////////////////////////////////////

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
////////////////////////////////////////////////////////////////
app.listen(process.env.PORT || 3000 , function () {
  console.log("server is running");
});
