const express = require('express'), 
	  app = express(),
	  bodyParser = require('body-parser'),
	  mongoose = require('mongoose'),
	  flash = require('connect-flash'),
	  passport = require('passport'),
	  cookieParser = require("cookie-parser"),
	  LocalStrategy = require('passport-local'),
	  GoogleStrategy = require('passport-google-oauth20').Strategy,
	  User = require('./models/user'),
	  Job = require('./models/job'),
	  expressSanitizer = require('express-sanitizer'),
	  methodOverride = require('method-override'),
	  {check, validationResult} = require('express-validator/check'),
	  _ = require('underscore');

// CONFIG DOTENV
require('dotenv').config();

// REQUIRE ROUTES
// =============
const indexRoutes = require('./routes/index'),
	  jobRoutes = require('./routes/jobs'),
	  userRoutes = require('./routes/users');

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(cookieParser('secret'));
app.use(expressSanitizer());
app.use(flash());

app.locals.moment = require('moment');
app.locals._ = _;

// Job.remove({}, (err, job) => {
// });

Job.find({}, (err, job) => {
	job.status = "public";
});

mongoose.connect(process.env.DB_HOST, {useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true});

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

// CREATE GOOGLE AUTH STRATEGIES
// ===============================

// SETUP GOOGLE AUTH (STUDENT)
passport.use('google-student', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://webdevbootcamp-gplyz.run.goorm.io/auth/google/student/callback'
}, function(accessToken, refreshToken, profile, done) {
    User.findOne({ email: profile.emails[0].value }, (err, user) => {
        if (err) console.log(err);
        else {
            if (user) return done(err, user);
            User.findOne({ googleId: profile.id }, function(err, user) {
                if (err) {
                    console.log(err);
                }
                if (!user) {
                    var newUser = new User({
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        firstName: profile.name.givenName,
                        middleName: '',
                        lastName: profile.name.familyName,
                        isEmployer: false,
                        isVerified: true,
                        isNewUser: true
                    });
                    newUser.save(err => {
                        if (err) {
                            console.log(err);
                        }
                        return done(err, newUser);
                    });
                } else {
                    return done(err, user);
                }
            });
        }
    });
}));

// SETUP GOOGLE AUTH (EMPLOYER)
passport.use('google-employer', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://webdevbootcamp-gplyz.run.goorm.io/auth/google/employer/callback'
}, function(accessToken, refreshToken, profile, done) {
    User.findOne({ email: profile.emails[0].value }, (err, user) => {
        if (err) console.log(err);
        else {
            if (user) return done(err, user);
            User.findOne({ googleId: profile.id }, function(err, user) {
                if (err) {
                    console.log(err);
                }
                if (!user) {
                    var newUser = new User({
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        firstName: profile.name.givenName,
                        middleName: '',
                        lastName: profile.name.familyName,
                        isEmployer: true,
                        isVerified: true,
                        isNewUser: true
                    });
                    newUser.save(err => {
                        if (err) {
                            console.log(err);
                        }
                        return done(err, newUser);
                    });
                } else {
                    return done(err, user);
                }
            });
        }
    });
}));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async (req, res, next) => {
	res.locals.currentUser = req.user;
	if(req.user) {
		try {
			let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
			res.locals.notifications = user.notifications.reverse();
		} catch(err) {
		  console.log(err.message);
		}
    }
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