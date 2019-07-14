const express = require('express'),
	  router = express.Router(),
	  User = require('../models/user'),
	  Job = require('../models/job'),
	  expressSanitizer = require('express-sanitizer'),
	  methodOverride = require('method-override'),
	  multer = require('multer'),
	  fs = require('fs'),
	  path = require('path'),
	  _ = require('underscore'),
	  escapeRegex = require('escape-string-regexp'),
	  middleware = require('../middleware'),
	  Notification = require('../models/notification'),
	  async = require('async');
	  

// SET STORAGE
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

// INDEX jobs
router.get("/jobs", (req, res) => {
	var lim = 2;
	var page = 0;
	
	if (req.query.search) {
		if (req.query.p) {
			page = req.query.p - 1;
		}
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Job.find({$or: [{company: regex,}, {role: regex}, {description: regex}]}).sort([['createdAt', -1]])
			.skip(lim * page).limit(lim).exec(function(err, jobs) {
			Job.countDocuments({$or: [{company: regex,}, {role: regex}, {description: regex}]}).exec((err, count) => {
				if (err) {
					console.log(err);
				} else {
					return res.render("jobs/index", {
						jobs: jobs,
						search: req.query.search,
						pages: Math.ceil(count / lim),
						currPage: page+1
					});
				}
			});
			
		});
	} else {
		if (req.query.p) {
			page = req.query.p - 1;
		}
		Job.find({}).sort([['createdAt', -1]]).skip(lim * page).limit(lim).exec(function(err, jobs) {
			Job.countDocuments({}).exec((err, count) => {
				if (err) {
					console.log(err);
				} else {
					return res.render("jobs/index", {
						jobs: jobs,
						search: false,
						pages: Math.ceil(count / lim),
						currPage: page+1
					});
				}
			});
			
		});
	}
});

// NEW job form
router.get("/jobs/new", middleware.isLoggedIn, middleware.isEmployer, middleware.isVerified, (req, res) => {
	res.render("jobs/new");
});

// CREATE job
router.post("/jobs", middleware.isLoggedIn, middleware.isEmployer, middleware.isVerified, (req, res) => {
	req.body.job.description = req.sanitize(req.body.job.description);
	var newJob = req.body.job;
	newJob.owner = req.user;
	Job.create(newJob, (err, job) => {
		if (err) {
			console.log(err);
			req.flash('error', "Error creating post!");
			res.redirect('back');
		} else {
			req.user.jobsPosted.push(job);
			req.user.save();
			job.save();
			req.flash('success', "Job posted!");
			res.redirect("/jobs/" + job._id);
		}
	});
});

// SHOW job
router.get("/jobs/:id", (req, res) => {
	Job.findById(req.params.id, (err, job) => {
		if (err) {
			console.log(err);
			req.flash('error', "The page you are looking for doesn't exist!");
			res.redirect('back');
		} else {
			if (!job) {
				req.flash('error', "Error finding post!");
				return res.redirect("/jobs");
			}
			
			var isAuthorized = false, savedAlready = false, appliedAlready = false, status = "";
	
			if (req.user) {
				if (job.owner.equals(req.user._id))
					isAuthorized = true;
				else 
					isAuthorized = false;

				if (req.user.jobsSaved.some(job => job._id == req.params.id))
					savedAlready = true;
				
				if (req.user.jobsApplied.some(job => job._id == req.params.id)) {
					appliedAlready = true;
					status = _.find(job.applicants, (elem) => { return elem.id.equals(req.user._id); }).status;
				}
			}
			res.render("jobs/show", {job: job, isAuthorized: isAuthorized, savedAlready: savedAlready, 
								appliedAlready: appliedAlready, status: status});
		}
	});
});

// EDIT job
router.get("/jobs/:id/edit", middleware.isLoggedIn, middleware.isEmployer, middleware.checkJobOwnership, (req, res) => {
	Job.findById(req.params.id, (err, job) => {
		if (err) {
			req.flash('error', "The post you are attempting to edit cannot be found!");
			res.redirect("/jobs");
		}
		else {
			res.render("jobs/edit", {job: job});
		}
	});
});

// UPDATE job
router.put("/jobs/:id", middleware.isLoggedIn, middleware.isEmployer, middleware.checkJobOwnership, (req, res) => {
	req.body.job.description = req.sanitize(req.body.job.description);
	Job.findByIdAndUpdate(req.params.id, req.body.job, (err, job) => {
		if (err) {
			req.flash('error', "Error updating post!");
			res.redirect("/jobs");
		}
		else {
			req.flash('success', "Updated post!");
			res.redirect("/jobs/" + req.params.id);
		}
	});
});

// DELETE job
router.delete("/jobs/:id", middleware.isLoggedIn, middleware.isEmployer, middleware.checkJobOwnership, (req, res) => {
	Job.findByIdAndRemove(req.params.id, (err) => {
		if (err) {
			req.flash('error', "Error deleting post!");
			res.redirect("back");
		}
		else {
			req.flash('error', "Deleted post!");
			res.redirect("/jobs");
		}
	});
});


// SAVE job
router.get("/jobs/:id/save", middleware.isLoggedIn, middleware.isStudent, (req, res) => {
	Job.findById(req.params.id, (err, job) => {
		if (err) {
			req.flash('error', "The post you are attempting to save cannot be found!");
			res.redirect("back");
		} else {
			if (!req.user.jobsSaved.some(job => job._id == req.params.id)) {
				req.user.jobsSaved.push(job);
				req.user.save();
				// console.log(job);
			}
			req.flash('success', "Saved!");
			res.redirect('back');
		}
	});
});

// UNSAVE job
router.get("/jobs/:id/unsave", middleware.isLoggedIn, middleware.isStudent, (req, res) => {
	Job.findById(req.params.id, (err, job) => {
		if (err) {
			req.flash('error', "The post you are attempting to unsave cannot be found!");
			console.log(err);
		} else {	
			if (req.user.jobsSaved.some(job => job._id == req.params.id)) {
				req.user.jobsSaved.pull({ _id: req.params.id });
				req.user.save();
			}
			req.flash('error', "Unsaved!");
			res.redirect('back');
		}
	});
});

// APPLICATION FORM
router.get("/jobs/:id/apply", middleware.isLoggedIn, middleware.isVerified, middleware.isStudent, (req, res) => {
	Job.findById(req.params.id, (err, job) => {
		if (err) {
			console.log(err);
			req.flash('error', "The posting you are attempting to apply for cannot be found!");
			res.redirect('back');
		} else {
			res.render("jobs/apply", {job: job, user: req.user});
		}
	});
});

// HANDLE APPLICATION
var uploadFields = upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'coverLetter', maxCount: 1 }]);

router.post("/jobs/:id/apply", middleware.isLoggedIn, middleware.isVerified, middleware.isStudent, uploadFields, (req, res) => {
	Job.findById(req.params.id, (err, job) => {
		if (err) {
			console.log(err);
			req.flash('error', "Error uploading application!");
			res.redirect("/jobs/" + req.params.id);
		} else {
			if (!req.user.jobsApplied.some(job => job._id == req.params.id)) {
				let resume;
				if (req.body.defaultResume) {
					resume = req.user.resume;
				} else {
					if (req.files['resume']) {
						resume = {
							contentType: req.files['resume'][0].mimetype,
							data: req.files['resume'][0].buffer
						};
					} else {
						resume = null;
					}
				}	
				
				let coverLetter;
				if (req.files['coverLetter']) {
					coverLetter = {
						contentType: req.files['coverLetter'][0].mimetype,
						data: req.files['coverLetter'][0].buffer
					};
				} else {
					coverLetter = null;
				}

				var name;
				if (req.user.middleName == "")
					name = req.user.firstName + " " + req.user.lastName;
				else
					name = req.user.firstName + " " + req.user.middleName + " " + req.user.lastName;
				
				job.applicants.push({
					id: req.user._id,
					fullName: name,
					email: req.user.email,
					resume: resume,
					coverLetter: coverLetter,
					status: "In progress"
				});
				
				job.save();
				req.user.jobsApplied.push(job);
				req.user.save();
			}
			req.flash('success', "Application submitted!");
			res.redirect("/jobs/" + req.params.id);
		}
	});
});

// VIEW APPLICANTS
router.get("/jobs/:id/applicants", middleware.isLoggedIn, middleware.isEmployer, middleware.checkJobOwnership, (req, res) => {
	Job.findById(req.params.id, (err, job) => {
		if (err) {
			console.log(err);
			req.flash('error', "Error finding that posting!");
			res.redirect('back');
		} else {
			res.render("jobs/applicants", {job: job});
		}
	});
});

// VIEW RESUME OF APPLICANT
router.get("/jobs/:id/applicants/:applicantId/resume", middleware.isLoggedIn, middleware.checkDocAuthorization, (req, res) => {
	Job.findById(req.params.id, (err, job) => {
		if (err) {
			console.log(err);
			req.flash('error', "Error retrieving resume!");
			res.redirect('back');
		} else {
			var resume = _.find(job.applicants, (elem) => { return elem.id.equals(req.params.applicantId); }).resume;
			res.contentType(resume.contentType);
			res.send(resume.data);
		}
	});
});

// VIEW COVER LETTER OF APPLICANT
router.get("/jobs/:id/applicants/:applicantId/cover-letter", middleware.isLoggedIn, middleware.checkDocAuthorization, (req, res) => {
	Job.findById(req.params.id, (err, job) => {
		if (err) {
			console.log(err);
			req.flash('error', "Error retrieving cover letter!");
			res.redirect('back');
		} else {
			var coverLetter = _.find(job.applicants, (elem) => { return elem.id.equals(req.params.applicantId); }).coverLetter;
			res.contentType(coverLetter.contentType);
			res.send(coverLetter.data);
		}
	});
});

// UPDATE APPLICATION STATUS
router.post("/jobs/:id/applicants/:applicantId/update-status", middleware.isLoggedIn, middleware.isEmployer, middleware.checkJobOwnership, 
			async (req, res) => {
	try {
		let job = await Job.findById(req.params.id);
		var applicant = _.find(job.applicants, (elem) => { return elem.id.equals(req.params.applicantId); });
		applicant.status = req.body.status;
		job.save();
		
		let newNotification = {
			text: "Your application status for " + job.role + " at " + job.company + " has been updated!",
			url: "/jobs/" + req.params.id 
		};
		
		let user = await User.findById(req.params.applicantId);
		let notification = await Notification.create(newNotification);
		user.notifications.push(notification);
		user.save();
		
		req.flash('success', "Status for " + applicant.fullName + " updated!");
		res.redirect('back');
	} catch(err) {
		req.flash('error', err.message);
      	res.redirect('back');
	}
	
	// Job.findById(req.params.id, (err, job) => {
	// 	if (err) {
	// 		console.log(err);
	// 		req.flash('error', "Error updating application stataus!");
	// 		res.redirect("back");
	// 	} else {
	// 		var applicant = _.find(job.applicants, (elem) => { return elem.id.equals(req.params.applicantId); });
	// 		applicant.status = req.body.status;
	// 		job.save();
	// 		req.flash('success', "Status for " + applicant.fullName + " updated!");
	// 		res.redirect('back');	
	// 	}
	// });
});

module.exports = router;