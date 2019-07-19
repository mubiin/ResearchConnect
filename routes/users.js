const express = require('express'),
	  router = express.Router(),
	  User = require('../models/user'),
	  Job = require('../models/job'),
	  multer = require('multer'),
	  fileType = require('file-type'),
	  expressSanitizer = require('express-sanitizer'),
	  methodOverride = require('method-override'),
	  middleware = require('../middleware');

// SET STORAGE
const storage = multer.memoryStorage(),
    accepted_extensions = ['pdf', 'doc', 'docx'],
    maxFileSize = 5, // in MB
    upload = multer({
        storage: storage,
        limits: {
            fileSize: maxFileSize * 1024 * 1024 // 5 MB upload limit
        },
        fileFilter: (req, file, cb) => {
            // if the file extension is in our accepted list
            if (accepted_extensions.some(ext => file.originalname.endsWith('.' + ext))) {
                return cb(null, true);
            }

            // otherwise, return error
            return cb(new Error('Invalid file type! Only pdf & doc/docx files are accepted.'));
        }
    });

// PROFILE
router.get("/profile", middleware.isLoggedIn, (req, res) => {
	if (req.user.isEmployer == true) {
		User.findById(req.user._id).populate("jobsPosted").exec((err, user) => {
			if (err){
				console.log(err);
			} else {
				// Sort jobs by creation date/time
				let jobs = user.jobsPosted.sort((a, b) => {
					if(a.createdAt > b.createdAt) return -1;
					if(a.createdAt < b.createdAt) return 1;
					return 0;
				});
				res.render("users/profile-employer", {user: user, jobs: jobs});
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
router.post("/profile/edit", middleware.isLoggedIn, (req, res) => {
	upload.single('resume')(req, res, (err) => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE')
				req.flash('error', "File is too large (max: " + maxFileSize + "MB)");
			else 
				req.flash('error', err.message);
			
			return res.redirect('back');
		}
		if (req.file) {
			var resume = {
				contentType: req.file.mimetype, 
				data: req.file.buffer
			};
			req.user.resume = resume;
			req.user.save();
		}
		User.findByIdAndUpdate(req.user._id, req.body.user, (err, user) => {
			if (err) {
				console.log(err);
				req.flash('error', "Error updating profile!");
				res.redirect('back');
			} else {
				if (user.isNewUser) user.isNewUser = false;
				user.save();
				req.flash('success', "Updated profile!");
				res.redirect("/profile");
			}
		});
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