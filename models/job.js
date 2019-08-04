const mongoose = require('mongoose');

var jobSchema = mongoose.Schema({
	company: {type: String, required: true},
	role: {type: String, required: true},
	location: {type: String, required: true},
	workLoad: {type: String, required: true},
	paid: {type: String},
	term: {type: String},
	grant: {type: Boolean},
	description: {type: String, required: true},
	createdAt: {type: Date, default: Date.now},
	deadline: {type: Date, required: true},
	status: {type: String, default: "archive"},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	applicants: [{
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		fullName: String,
		email: String,
		resume: {
			contentType: String,
			data: Buffer
		}, 
		coverLetter: {
			contentType: String,
			data: Buffer
		},
		transcript: {
			contentType: String,
			data: Buffer
		},
		status: {type: String, deafult: "In progress"}
	}],
});

module.exports = mongoose.model("Job", jobSchema);
