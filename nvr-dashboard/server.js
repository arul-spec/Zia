const express = require('express');
const WebSocket = require('ws');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// API endpoint: list cameras
app.get('/api/cameras', (req, res) => {
  res.json([
    { id: 1, name: "Front Gate", status: "online" },
    { id: 2, name: "Lobby", status: "online" }
  ]);
});

// API endpoint: recent motion events
app.get('/api/events', (req, res) => {
  res.json([
    { time: Date.now(), cameraId: 1, type: "motion", thumbnail: "/img/mock1.jpg" },
    { time: Date.now(), cameraId: 2, type: "motion", thumbnail: "/img/mock2.jpg" }
  ]);
});

// WebSocket server for live events
const server = app.listen(PORT, () => console.log(`Server running on ${PORT}`));
const wss = new WebSocket.Server({ server });

setInterval(() => {
  const event = {
    time: Date.now(),
    cameraId: Math.floor(Math.random() * 2) + 1,
    type: "motion",
    thumbnail: "/img/mock1.jpg"
  };
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(event));
    }
  });
}, 5000);

