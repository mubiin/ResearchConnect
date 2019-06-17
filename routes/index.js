const express = require('express'),
	  router = express.Router(),
	  bodyParser = require('body-parser'),
	  passport = require('passport'),
	  LocalStrategy = require('passport-local'),
	  User = require('../models/user'),
	  expressSanitizer = require('express-sanitizer'),
	  {check, validationResult} = require('express-validator/check'),
	  middleware = require('../middleware'),
	  mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_APIKEY, domain: process.env.MAILGUN_DOMAIN}),
	  crypto = require('crypto'),
	  async = require('async');
	  

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
		isVerified: false
	});
		
	User.register(newUser, req.body.password, (err, user) => {
		if(err) {
			req.flash("error", err.message);
			return res.redirect("/register/employer");
		}
		passport.authenticate("local")(req, res, () => {
			crypto.randomBytes(20, (err, buf) => {
				if (err) {
					console.log(err);
					req.flash('error', "Error creating password reset token!");
					return res.redirect("/forgot");
				}
				var token = buf.toString('hex');
				user.verificationToken = token;
				user.save();
				var mailData = {
				  from: 'ResearchConnect <donotreply@researchconnect.com>',
				  to: req.body.email,
				  subject: 'ResearchConnect: Verify Your Email',
				  text:
					'Please verify your email by clicking the following link, or pasting it into your browser:\n\n' +
					'https://' + req.headers.host + '/verify/' + token + '\n'
				};

				mailgun.messages().send(mailData, function (error, body) {
					if (error) 
						console.log(error);
					else {
						req.flash('success', 'Please verify your email to start posting!');
						res.redirect("/verify");
					}
				});
			});
			
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
		isEmployer: true,
		isVerified: false
	});

	User.register(newUser, req.body.password, (err, user) => {
		if(err) {
			req.flash("error", err.message);
			return res.redirect("/register/employer");
		}
		passport.authenticate("local")(req, res, () => {
			crypto.randomBytes(20, (err, buf) => {
				if (err) {
					console.log(err);
					req.flash('error', "Error creating password reset token!");
					return res.redirect("/forgot");
				}
				var token = buf.toString('hex');
				user.verificationToken = token;
				user.save();
				var mailData = {
				  from: 'ResearchConnect <donotreply@researchconnect.com>',
				  to: req.body.email,
				  subject: 'ResearchConnect: Verify Your Email',
				  text: 
					'Please verify your email by clicking the following link, or pasting it into your browser:\n\n' +
					'https://' + req.headers.host + '/verify/' + token + '\n'
				};

				mailgun.messages().send(mailData, function (error, body) {
					if (error) 
						console.log(error);
					else {
						req.flash('success', 'Please verify your email to start posting!');
						res.redirect("/verify");
					}
				});
			});
			
		});
	});
});

// SHOW VERIFY PAGE
router.get("/verify", middleware.isLoggedIn, (req, res) => {
	if (req.user.isVerified === true) {
		req.flash('success', "Your email has already been verified!");
		return res.redirect('back');
	}
	res.render("verify", {user: req.user});
});

// RESEND VERIFICATION 
router.post('/verify/resend', middleware.isLoggedIn, (req, res) => {
    crypto.randomBytes(20, (err, buf) => {
        if (err) {
            console.log(err);
            req.flash('error', 'Error creating password reset token!');
            return res.redirect('/forgot');
        }
        var token = buf.toString('hex');
        req.user.verificationToken = token;
        req.user.save();
        var mailData = {
            from: 'ResearchConnect <donotreply@researchconnect.com>',
            to: req.user.email,
            subject: 'ResearchConnect: Verify Your Email',
            text:
                'Please verify your email by clicking the following link, or pasting it into your browser:\n\n' +
                'https://' + req.headers.host + '/verify/' + token + '\n'
        };

        mailgun.messages().send(mailData, function(error, body) {
            if (error) console.log(error);
            else {
                req.flash('success', 'Verification email sent!');
                res.redirect('back');
            }
        });
    });
});

// HANDLE VERIFICATION REQUEST
router.get("/verify/:token", (req, res) => {
	async.waterfall([
		function(done) {
			User.findOne({verificationToken: req.params.token}, (err, user) => {
				if (err) {
					console.log(err);
					req.flash('error', "Unexpected error encountered.");
					return res.redirect('back');
				}
				if (!user) {
					req.flash('error', "Verification token is invalid.");
					return res.redirect("/");
				}
				if (user.isVerified === true) {
					req.logIn(user, (err) => {
						req.flash('success', "Your email has already been verified!");
						return res.redirect("/profile");
						
					});	
				} else {
					user.isVerified = true;
					user.save((err) => {
						if (err) {
							console.log(err);
							req.flash('error', "Unexpected error encountered.");
							return res.redirect('back');	
						}
						req.logIn(user, (err) => {
							done(err, user);
						});
					});
				}
			});
		}, 
		function(user, done) {
			var mailData = {
			  from: 'ResearchConnect <donotreply@researchconnect.com>',
			  to: user.email,
			  subject: 'ResearchConnect: Your email has been verified!',
			  text: 'Hello, ' + user.firstName + '! \n\n' + 
				'This is a confirmation that your email has been verified! .\n'
			};

			mailgun.messages().send(mailData, function (error, body) {
				if (error) 
					console.log(error);
				else {
					req.flash('success', 'Your email has been successfully verified!');
					done(error);
				}
			});
		}
	], function (error) {
		if (error) {
			console.log(error);
			req.flash('error', "Unexpected error encountered.");
			return res.redirect('back');
		}
		res.redirect("/profile");
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
	failureRedirect: "/login/employer",
	failureFlash: true,
	successFlash: 'Logged in!'
}), (req, res) => {
});

// LOGOUT
router.get("/logout", (req, res) => {
	req.logout();
	req.flash('error', "Logged out!");
	res.redirect("/jobs");
});

// FORGOT PASSWORD FORM
router.get("/forgot", (req, res) => {
	res.render("forgot");
});

// HANDLE FORGOT PASSWORD REQUEST
router.post("/forgot", (req, res) => {
	async.waterfall([
		function(done) {
			crypto.randomBytes(20, (err, buf) => {
				if (err) {
					console.log(err);
					req.flash('error', "Error creating password reset token!");
					return res.redirect("/forgot");
				}
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done) {
			User.findOne({email: req.body.email}, (err, user) => {
				if (err) {
					console.log(err);
					req.flash('error', "Unexpected error occured!");
					return res.redirect("/forgot");
				}
				if(!user) {
					req.flash('error', "No account with that email exists!");
					return res.redirect("/forgot");
				}
				
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
				
				user.save((err) => {
					if (err) {
						console.log(err);
						req.flash('error', "Unexpected error occured!");
						return res.redirect("/forgot");
					}
					done(err, token, user);
				});
				
			});
		},
		function(token, user, done) {
			var mailData = {
			  from: 'ResearchConnect <donotreply@researchconnect.com>',
			  to: user.email,
			  subject: 'ResearchConnect: Reset Your Password',
			  text: 'You are receiving this because you (or someone else) have requested the reset of the password for your ResearchConnect account.\n\n' + 'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
				'https://' + req.headers.host + '/reset/' + token + '\n\n' + 
				'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};

			mailgun.messages().send(mailData, function (error, body) {
				if (error) 
					console.log(error);
				else {
					req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
					done(error);
				}
			});
		}
	], function(error) {
		if (error) {
			console.log(error);
			req.flash("Unexpected error...");
			return res.redirect("/forgot");
		}
		res.redirect("/forgot");
	});
});

// PASSWORD RESET FORM
router.get("/reset/:token", (req, res) => {
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user) => {
		if (err) {
			console.log(err);
			req.flash('error', "Unexpected error encountered.");
			return res.redirect("/");
		}
		if (!user) {
			req.flash('error', "Password reset token is either invalid or has expired. Please try again.");
			return res.redirect("/forgot");
		}
		res.render("reset", {token: req.params.token});
	});
});

// HANDLE PASSWORD RESET REQUEST
router.post("/reset/:token", (req, res) => {
	async.waterfall([
		function(done) {
			User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user) => {
				if (err) {
					console.log(err);
					req.flash('error', "Unexpected error encountered.");
					return res.redirect('back');
				}
				if (!user) {
					req.flash('error', "Password reset token is either invalid or has expired. Please try again.");
					return res.redirect("/forgot");
				}
				if (req.body.password === req.body.confirm) {
					user.setPassword(req.body.password, (err) => {
						if (err) {
							console.log(err);
							req.flash('error', "Unexpected error encountered.");
							return res.redirect('back');	
						}
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;
						
						user.save((err) => {
							if (err) {
								console.log(err);
								req.flash('error', "Unexpected error encountered.");
								return res.redirect('back');	
							}
							req.logIn(user, (err) => {
								done(err, user);
							});
						});
					});
				} else {
					req.flash('error', "Passwords do not match!");
					return res.redirect('back');
				}
			});
		}, 
		function(user, done) {
			var mailData = {
			  from: 'ResearchConnect <donotreply@researchconnect.com>',
			  to: user.email,
			  subject: 'ResearchConnect: Your password has been changed!',
			  text: 'Hello, ' + user.firstName + '! \n\n' + 
				'This is a confirmation that the password for your ResearchConnect account with the email: ' + user.email + 
				' has just been changed.\n'
			};

			mailgun.messages().send(mailData, function (error, body) {
				if (error) 
					console.log(error);
				else {
					req.flash('success', 'Password successfully updated!');
					done(error);
				}
			});
		}
	], function (error) {
		if (error) {
			console.log(error);
			req.flash('error', "Unexpected error encountered.");
			return res.redirect('back');
		}
		res.redirect("/profile");
	});
});

module.exports = router;