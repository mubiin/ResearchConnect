const mongoose = require('mongoose'),
	  passportLocalMongoose = require('passport-local-mongoose');

var userSchema = mongoose.Schema({
	email: {type: String, unique: true},
	password: String,
	firstName: String,
	middleName: String,
	lastName: String,
	school: String,
	faculty: String,
	major: String,
	graduation: Date,
	googleId: {type: String, unique: true},
	resumes: [{
		contentType: String,
		data: Buffer,
		name: {type: String, default: ""}
	}],
	jobsSaved: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Job"
		
	}],
	jobsApplied: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Job"
		
	}],
	jobsPosted: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Job"
		
	}],
	isEmployer: Boolean,
	company: String,
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	verificationToken: String,
	isVerified: {type: Boolean, default: false, required: true},
	isNewUser: Boolean,
	notifications: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Notification"
	}]
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"});

module.exports = mongoose.model("User", userSchema);

