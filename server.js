if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt"); //it is used for bcrypt our password and comparet the passwords in bcrypt form
const passport = require("passport");
const intializePassport = require("./passport-config");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override"); //this gives html form capabality to use delete as method

const server = express();
const users = [];
intializePassport(
  passport,
  (email) => users.find((x) => x.email === email), //function for finding user based on email
  (id) => users.find((x) => x.id == id)
);
server.set("view-engine", "ejs");
server.use("/public", express.static(path.join(__dirname, "public")));
server.use(express.urlencoded({ extended: false })); //do thizs to get the data from form in req.body
server.use(flash());
server.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
server.use(passport.initialize());
server.use(passport.session());
server.use(methodOverride("_method")); //here we use _method as getter from html form

server.get("/", checkAuthanticated, (req, res) => {
  // res.send("Welcome to the login application");//it;s for directly sending the response.
  res.render("index.ejs", { name: req.user.name }); // it is for rendering the file
});

server.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

//below we are using middlewear after the path as we do always
server.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

server.get("/register", (req, res) => {
  res.render("register.ejs");
});

server.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashPassword = await bcrypt.hash(password, 10); //here 10 tells you how many times you wanna generate the password
    users.push({
      id: Date.now().toString(),
      password: hashPassword,
      name,
      email,
    });
    res.redirect("/login");
  } catch (error) {
    res.redirect("/register");
  }
  console.log(users);
});

/**
 * code for logout but here we are using delete method ,
 * In html form we can not use delete as method
 * so we use libraray method-override
 */
server.delete("/logout", (req, res) => {
  req.logOut(); //this logout function is handle by passport it clear the session and logout
  res.redirect("/login");
});

//so that if user try to access home "/" it will navigate to login
function checkAuthanticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

//so that if user try to login when already login he will redirect to "/"
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/");
  } else {
    next();
  }
}

server.listen(5000, () => {
  console.log(`now listening the port 50000`);
});
