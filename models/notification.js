const mongoose = require('mongoose');

var notificationSchema = mongoose.Schema({
	text: {type: String, required: true},
	url: String,
	isRead: {type: Boolean, default: false}
});

module.exports = mongoose.model("Notification", notificationSchema);
