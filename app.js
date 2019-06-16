const express = require('express'), 
	  app = express(),
	  bodyParser = require('body-parser'),
	  mongoose = require('mongoose'),
	  flash = require('connect-flash'),
	  passport = require('passport'),
	  LocalStrategy = require('passport-local'),
	  User = require('./models/user'),
	  Job = require('./models/job'),
	  expressSanitizer = require('express-sanitizer'),
	  methodOverride = require('method-override'),
	  {check, validationResult} = require('express-validator/check'),
	  _ = require('underscore');

// CONFIG ENV
require('dotenv').config();

// SETUP ROUTES
// =============
const indexRoutes = require('./routes/index'),
	  jobRoutes = require('./routes/jobs'),
	  userRoutes = require('./routes/users');

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(expressSanitizer());
app.use(flash());

app.locals.moment = require('moment');
app.locals._ = _;

// Job.remove({}, (err, job) => {
// });

mongoose.connect("mongodb://localhost:27017/research_connect", {useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true});

// PASSPORT CONFIG
// ==================
app.use(require("express-session")({
	secret: "ResearchConnect",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.currentPath = req.path;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	next();
});

app.use(indexRoutes);
app.use(jobRoutes);
app.use(userRoutes);

// LISTEN 
app.listen(process.env.PORT, () => {
	console.log("ResearchConnected!");
});