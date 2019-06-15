const mongoose = require('mongoose'),
	  passportLocalMongoose = require('passport-local-mongoose');

var userSchema = mongoose.Schema({
	email: {type: String, unique: true, required: true},
	password: String,
	firstName: String,
	middleName: String,
	lastName: String,
	school: String,
	faculty: String,
	major: String,
	graduation: Date,
	resume: {
		contentType: String,
		data: Buffer,
	},
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
	company: String
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"});

module.exports = mongoose.model("User", userSchema);

