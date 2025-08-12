// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CAM_FILE = path.join(__dirname, 'cameras.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure cameras.json exists
if (!fs.existsSync(CAM_FILE)) {
  fs.writeFileSync(CAM_FILE, JSON.stringify([], null, 2));
}

// Helper: read/write cameras
function readCameras() {
  try {
    return JSON.parse(fs.readFileSync(CAM_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}
function writeCameras(list) {
  fs.writeFileSync(CAM_FILE, JSON.stringify(list, null, 2));
}

/* --- API: Cameras --- */

// List cameras
app.get('/api/cameras', (req, res) => {
  const cams = readCameras();
  res.json(cams);
});

// Add camera
app.post('/api/cameras', (req, res) => {
  const { id, name, url, note } = req.body;
  const cams = readCameras();
  const newId = id || (`cam${Date.now()}`);
  if (cams.find(c => c.id === newId)) {
    return res.status(400).json({ error: 'id already exists' });
  }
  const cam = { id: newId, name: name || newId, url: url || '', note: note || '', status: 'unknown' };
  cams.push(cam);
  writeCameras(cams);
  res.status(201).json(cam);
});

// Update camera
app.put('/api/cameras/:id', (req, res) => {
  const id = req.params.id;
  const { name, url, note } = req.body;
  const cams = readCameras();
  const idx = cams.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  cams[idx] = { ...cams[idx], name: name ?? cams[idx].name, url: url ?? cams[idx].url, note: note ?? cams[idx].note };
  writeCameras(cams);
  res.json(cams[idx]);
});

// Delete camera
app.delete('/api/cameras/:id', (req, res) => {
  const id = req.params.id;
  let cams = readCameras();
  const before = cams.length;
  cams = cams.filter(c => c.id !== id);
  if (cams.length === before) return res.status(404).json({ error: 'not found' });
  writeCameras(cams);
  res.json({ success: true });
});

/* --- Serve frontend --- */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NVR Dashboard server listening on port ${PORT}`);
});
