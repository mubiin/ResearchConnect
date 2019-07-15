const mongoose = require('mongoose');

var notificationSchema = mongoose.Schema({
	shortText: {type: String, required: true},
	fullText: {type: String, required: true},
	url: String,
	isRead: {type: Boolean, default: false},
	createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model("Notification", notificationSchema);
