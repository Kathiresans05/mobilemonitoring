const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    type: { type: String, enum: ['AppUsage', 'Alert', 'Session'], required: true },
    details: { type: Object, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);
