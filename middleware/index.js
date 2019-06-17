const User = require('../models/user'),
	  Job = require('../models/job');

var middlewareObj = {};

// Return true if logged in
middlewareObj.isLoggedIn = function(req, res, next) {
	if (req.isAuthenticated())
		return next();
	req.flash("error", "You must be logged in to do that!");
	res.redirect("/login");
};

// Return true if student
middlewareObj.isStudent = function(req, res, next) {
	if (req.user) {
		User.findOne({_id: req.user._id}, (err, user) => {
			if (err) {
				console.log(err);
				res.redirect('back');
			}
			else {
				if (user && user.isEmployer == false) {
					return next(); 
				}
				req.flash("error", "You must be a student do that!");
				res.redirect("back");
			}			
		});	
	} else {
		User.findOne({email: req.body.email}, (err, user) => {
			if (err) {
				console.log(err);
				res.redirect("/login/student");
			}
			else {
				if (user && user.isEmployer == false) {
					return next(); 
				}
				req.flash('error', "Email not found.");
				res.redirect("/login/student");
			}
		});
	}
};

// Return true if employer
middlewareObj.isEmployer = function(req, res, next) {
	if (req.user) {
		User.findOne({_id: req.user._id}, (err, user) => {
			if (err) {
				req.flash('error', err.message);
				res.reidrect("back");
			} else {
				if (user && user.isEmployer === true) {
					return next(); 
				}
				req.flash("error", "You must be an employer to do that!");
				res.redirect('back');
			}
		});
	} else {
		User.findOne({email: req.body.email}, (err, user) => {
			if (err) {
				req.flash('error', err.message);
				res.redirect("/login/employer");
			}
			else {
				if (user && user.isEmployer === true) {
					return next(); 
				}
				req.flash('error', "Email not found.");
				res.redirect("/login/employer");
			}
		});
	}
};

// Check job posting ownership
middlewareObj.checkJobOwnership = function (req, res, next) {
	Job.findById(req.params.id, (err, job) => {
		if (err) {
			console.log(err);
			return res.redirect('back');
		} else {
			if (job && job.owner.equals(req.user._id))
				return next();
		}
		req.flash("error", "You are not authorized to do that!");
		res.redirect("/jobs/" + req.params.id);
	});
};

// Check resume/coverLetter viewing authorization
middlewareObj.checkDocAuthorization = function(req, res, next) {
	if (req.user.isEmployer === true)
		return middlewareObj.checkJobOwnership(req, res, next);

	if (req.params.applicantId == req.user._id) {
		return next();
	} else {
		req.flash("error", "You are not authorized to view that!");
		res.redirect("/jobs/" + req.params.id);
	}
};

middlewareObj.isVerified = function(req, res, next) {
	if (req.user.isVerified)
		return next();
	req.flash('error', "Please verify your email first!");
	res.redirect("back");
};

module.exports = middlewareObj;