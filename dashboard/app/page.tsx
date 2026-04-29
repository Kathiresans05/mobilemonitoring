"use client";

import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

interface DeviceScreen {
  deviceId: string;
  currentApp: string;
  image: string;
  timestamp: number;
  status: 'live' | 'offline';
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Map<string, DeviceScreen>>(new Map());
  const socketRef = useRef<any>(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join', { type: 'dashboard' });
    });

    // Receive screenshot from Android device every 2 seconds
    socketRef.current.on('screenshot', (data: DeviceScreen) => {
      setDevices(prev => {
        const updated = new Map(prev);
        updated.set(data.deviceId, { ...data, status: 'live' });
        return updated;
      });
    });

    // Mark devices offline if no screenshot received in 10 seconds
    const offlineCheck = setInterval(() => {
      const now = Date.now();
      setDevices(prev => {
        let changed = false;
        const updated = new Map(prev);
        updated.forEach((device, id) => {
          if (now - device.timestamp > 10000 && device.status === 'live') {
            updated.set(id, { ...device, status: 'offline' });
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }, 5000);

    return () => {
      socketRef.current?.disconnect();
      clearInterval(offlineCheck);
    };
  }, []);

  const deviceArray = Array.from(devices.values());

  return (
    <main className="dashboard-container">
      <header className="header">
        <div className="title">
          <div className="status-indicator"></div>
          SECURE MONITORING HUB
        </div>
        <div className="live-tag">● LIVE MONITORING</div>
      </header>

      <div className="grid">
        {deviceArray.map(device => (
          <div key={device.deviceId} className="stream-tile">
            {device.image ? (
              <img
                src={device.image}
                alt={`Screen - ${device.deviceId}`}
                className="stream-video"
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              />
            ) : (
              <div className="stream-video" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                Waiting for screen...
              </div>
            )}
            <div className="stream-info">
              <div>
                <div className="employee-name">{device.deviceId}</div>
                <div className="app-badge">{device.currentApp ?? '—'}</div>
              </div>
              <div style={{ fontSize: '0.7rem', color: device.status === 'live' ? 'var(--accent)' : '#888' }}>
                {device.status === 'live' ? '● LIVE' : '○ OFFLINE'}
              </div>
            </div>
          </div>
        ))}

        {/* Placeholder tiles when no devices connected */}
        {deviceArray.length === 0 && [1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="stream-tile" style={{ opacity: 0.3 }}>
            <div className="stream-video" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.8rem' }}>
              No Device
            </div>
            <div className="stream-info">
              <div className="employee-name">DEVICE_{i}</div>
              <div className="app-badge">OFFLINE</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
