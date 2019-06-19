const express = require('express'),
	  router = express.Router(),
	  User = require('../models/user'),
	  Job = require('../models/job'),
	  multer = require('multer'),
	  expressSanitizer = require('express-sanitizer'),
	  methodOverride = require('method-override'),
	  middleware = require('../middleware');

// SET STORAGE
var storage = multer.memoryStorage();

var upload = multer({ storage: storage });

// PROFILE
router.get("/profile", middleware.isLoggedIn, (req, res) => {
	if (req.user.isEmployer == true) {
		User.findById(req.user._id).populate("jobsPosted").exec((err, user) => {
			if (err){
				console.log(err);
			} else {
				res.render("users/profile-employer", {user: user});
			}
		});
	}
	else {
		User.findById(req.user._id).populate("jobsSaved").populate("jobsApplied").exec((err, user) => {
			if (err) {
				console.log(err);
				res.redirect('back');
			} else {
				res.render("users/profile-student", {user: user});
			}
		});
		
	}
});

// EDIT PROFILE
router.get("/profile/edit", middleware.isLoggedIn, (req, res) => {
	if (req.user.isEmployer)
		res.render("users/edit-profile-employer", {user: req.user});
	else 
		res.render("users/edit-profile-student", {user: req.user});
});

// HANDLE EDIT PROFILE
router.post("/profile/edit", middleware.isLoggedIn, upload.single('resume'), (req, res) => {
	if (req.file) {
		var resume = {
			contentType: req.file.mimetype, 
			data: req.file.buffer
		};
		req.user.resume = resume;
		if (req.user.isNewUser) {
			req.user.isNewUser = false;
		}
		req.user.save();
	}
	User.findByIdAndUpdate(req.user._id, req.body.user, (err, user) => {
		if (err) {
			console.log(err);
			req.flash('error', "Error updating profile!");
			res.redirect('back');
		} else {
			req.flash('success', "Updated profile!");
			res.redirect("/profile");
		}
	});
});

// LINK TO RESUME
router.get("/profile/resume", middleware.isLoggedIn, middleware.isStudent, (req, res) => {
	if (req.user.resume.data) {
		res.contentType(req.user.resume.contentType);
		res.send(req.user.resume.data);
	} else
		res.send("Oops! Couldn't find file...");
});

module.exports = router;