const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String },
    status: { type: String, enum: ['Active', 'Idle', 'Offline'], default: 'Offline' },
    currentApp: { type: String, default: 'None' },
    lastActive: { type: Date, default: Date.now },
    isStreaming: { type: Boolean, default: false },
    socketId: { type: String, default: null }
});

module.exports = mongoose.model('Employee', EmployeeSchema);
