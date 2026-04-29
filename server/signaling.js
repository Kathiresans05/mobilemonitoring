module.exports = (io) => {
    const dashboardSockets = new Set();
    const mobileDevices = new Map(); // deviceId -> socketId

    io.on('connection', (socket) => {
        console.log('New connection:', socket.id);

        // Join room based on deviceId or dashboard
        socket.on('join', (data) => {
            const { deviceId, type } = data;

            if (type === 'dashboard') {
                dashboardSockets.add(socket.id);
                socket.join('dashboard');
                console.log(`Dashboard joined: ${socket.id}`);

                // Send current connected devices to new dashboard
                const deviceList = Array.from(mobileDevices.entries()).map(([id, sid]) => ({
                    deviceId: id,
                    socketId: sid
                }));
                socket.emit('device-list', deviceList);
            } else {
                // Mobile device
                mobileDevices.set(deviceId, socket.id);
                socket.join(deviceId);
                console.log(`Mobile joined: ${deviceId} (${socket.id})`);

                // Notify dashboard of new device
                io.to('dashboard').emit('device-connected', {
                    deviceId,
                    socketId: socket.id
                });

                // Send dashboard socket ID to mobile so it knows who to call
                const dashboardSocketId = Array.from(dashboardSockets)[0];
                if (dashboardSocketId) {
                    socket.emit('dashboard-ready', { dashboardSocketId });
                }
            }
        });

        // Signaling events
        socket.on('offer', (data) => {
            socket.to(data.targetSocketId).emit('offer', {
                from: socket.id,
                sdp: data.sdp,
                deviceId: data.deviceId
            });
        });

        socket.on('answer', (data) => {
            socket.to(data.targetSocketId).emit('answer', {
                from: socket.id,
                sdp: data.sdp
            });
        });

        socket.on('ice-candidate', (data) => {
            socket.to(data.targetSocketId).emit('ice-candidate', {
                from: socket.id,
                candidate: data.candidate
            });
        });

        // Status updates from mobile
        socket.on('status-update', (data) => {
            io.to('dashboard').emit('device-status', data);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            dashboardSockets.delete(socket.id);
            // Remove from mobileDevices map
            for (const [deviceId, sid] of mobileDevices.entries()) {
                if (sid === socket.id) {
                    mobileDevices.delete(deviceId);
                    io.to('dashboard').emit('device-disconnected', { deviceId });
                    break;
                }
            }
        });
    });
};
