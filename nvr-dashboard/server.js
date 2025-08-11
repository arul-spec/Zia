const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Simple API: list of cameras (mock)
app.get("/api/cameras", (req, res) => {
  res.json([
    { id: 1, name: "Front Gate", status: "online", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { id: 2, name: "Lobby", status: "online", src: "https://www.w3schools.com/html/movie.mp4" }
  ]);
});

// Simple API: recent events (mock)
app.get("/api/events", (req, res) => {
  res.json([
    { time: Date.now(), cameraId: 1, type: "motion", message: "Motion detected", thumbnail: "/thumb1.jpg" },
    { time: Date.now(), cameraId: 2, type: "motion", message: "Motion detected", thumbnail: "/thumb2.jpg" }
  ]);
});

// Create HTTP server and attach WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Broadcast helper
function broadcast(obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

// Periodically emit fake live events
setInterval(() => {
  const camId = Math.floor(Math.random() * 2) + 1;
  const event = {
    time: Date.now(),
    cameraId: camId,
    type: "motion",
    message: `Motion on camera ${camId}`,
    thumbnail: camId === 1 ? "/thumb1.jpg" : "/thumb2.jpg"
  };
  broadcast({ kind: "event", data: event });
}, 5000);

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
