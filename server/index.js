const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const Employee = require('./models/Employee');
const Log = require('./models/Log');
const signaling = require('./signaling');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Multer - store screenshot in memory
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/monitoring';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// API Endpoints
app.get('/api/devices', async (req, res) => {
    try {
        const devices = await Employee.find();
        res.json(devices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/register', async (req, res) => {
    const { deviceId, name, email } = req.body;
    try {
        let device = await Employee.findOne({ deviceId });
        if (!device) {
            device = new Employee({ deviceId, name, email });
            await device.save();
        }
        res.json(device);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Screenshot upload endpoint — Android posts here every 2 seconds
app.post('/api/screenshot', upload.single('screenshot'), (req, res) => {
    try {
        const { deviceId, currentApp } = req.body;
        const imageBase64 = req.file.buffer.toString('base64');

        // Broadcast to all dashboard clients
        io.to('dashboard').emit('screenshot', {
            deviceId,
            currentApp,
            image: `data:image/jpeg;base64,${imageBase64}`,
            timestamp: Date.now()
        });

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Initialize Signaling
signaling(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
