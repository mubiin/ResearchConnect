const express = require('express'),
router = express.Router(),
bodyParser = require('body-parser'),
passport = require('passport'),
LocalStrategy = require('passport-local'),
User = require('../models/user'),
expressSanitizer = require('express-sanitizer'),
{check, validationResult} = require('express-validator/check'),
middleware = require('../middleware');

// LANDING
router.get("/", (req, res) => {
	res.render("home");	
});

// AUTH ROUTES
// =============

// REGISTER -- Main
router.get("/register", (req, res) => {
	res.render("register");
});

// REGISTER -- Student
router.get("/register/student", (req, res) => {
	res.render("register-student", {err: false});
});

// REGISTER -- Handle STUDENT Registration
router.post("/register/student", [
	check('email').isEmail(),
	check('password').isLength({min: 5})
	], (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log(errors.array());
			return res.render("register-student", 
			{
				err: true,
				first: req.body.firstName,
				middle: req.body.middleName,
				last: req.body.lastName,
				defEmail: req.body.email,
				defSchool: req.body.school,
				defFaculty: req.body.faculty,
				defMajor: req.body.major,
				defGraduation: req.body.graduation,
				"error": "Invalid " + errors.array()[0].param + "!"
			});
		}

		if (req.body.password !== req.body.confirm) {
			return res.render("register-student", 
			{
				err: true,
				defEmail: req.body.email,
				first: req.body.firstName,
				middle: req.body.middleName,
				last: req.body.lastName,
				defSchool: req.body.school,
				defFaculty: req.body.faculty,
				defMajor: req.body.major,
				defGraduation: req.body.graduation,
				"error": "Passwords do not match!"
			});
		}

		var newUser = new User({
			email: req.body.email, 
			firstName: req.body.firstName,
			middleName: req.body.middleName,
			lastName: req.body.lastName,
			school: req.body.school,
			faculty: req.body.faculty,
			major: req.body.major,
			graduation: req.body.graduation,
			isEmployer: false,
		});

		User.register(newUser, req.body.password, (err, user) => {
			if(err) {
				req.flash("error", err.message);
				return res.redirect("/register/student");
			}
			passport.authenticate("local")(req, res, () => {
				res.redirect("/jobs");
			});
		});
	});

// REGISTER -- Employer
router.get("/register/employer", (req, res) => {
	res.render("register-employer", {err: false});
});

// REGISTER -- Handle EMPLOYER Registration
router.post("/register/employer", [
	check('email').isEmail(),
	check('password').isLength({min: 5})
	], (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log(errors.array());
			return res.render("register-employer", 
			{
				err: true,
				first: req.body.firstName,
				middle: req.body.middleName,
				last: req.body.lastName,
				defEmail: req.body.email,
				defCompany: req.body.company,
				"error": "Invalid " + errors.array()[0].param + "!"
			});
		}

		if (req.body.password !== req.body.confirm) {
			return res.render("register-employer", 
			{
				err: true,
				first: req.body.firstName,
				middle: req.body.middleName,
				last: req.body.lastName,
				defEmail: req.body.email,
				defCompany: req.body.company,
				"error": "Passwords do not match!"
			});
		}

		var newUser = new User({
			email: req.body.email,
			firstName: req.body.firstName,
			middleName: req.body.middleName,
			lastName: req.body.lastName,
			company: req.body.company,
			isEmployer: true
		});

		User.register(newUser, req.body.password, (err, user) => {
			if(err) {
				req.flash("error", err.message);
				return res.redirect("/register/employer");
			}
			passport.authenticate("local")(req, res, () => {
				res.redirect("/jobs");
			});
		});
	});

// LOGIN -- Main
router.get("/login", (req, res) => {
	res.render("login");
});

// LOGIN -- Student
router.get("/login/student", (req, res) => {
	res.render("login-student");
});

// LOGIN -- Handle STUDENT login
router.post("/login/student", middleware.isStudent, passport.authenticate("local", {
	successRedirect: "/jobs", 
	failureRedirect: "/login/student",
	failureFlash: true,
	successFlash: 'Logged in!'
}), (req, res) => {
});

// LOGIN -- Employer
router.get("/login/employer", (req, res) => {
	res.render("login-employer");
});

// LOGIN -- Handle EMPLOYER login
router.post("/login/employer", middleware.isEmployer, passport.authenticate("local", {
	successRedirect: "/jobs", 
	failureRedirect: "/login/employer"
}), (req, res) => {
});

// LOGOUT
router.get("/logout", (req, res) => {
	req.logout();
	req.flash('error', "Logged out!");
	res.redirect("/jobs");
});

module.exports = router;