const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

// ---- Camera config ----
// For testing you can use local mp4 files (file:///path/to/file.mp4) or RTSP URLs.
// Example: "rtsp://user:pass@192.168.1.100:554/stream"
const cams = [
  { id: 1, name: 'Front Gate', source: '/path/to/sample1.mp4' },
  { id: 2, name: 'Lobby', source: '/path/to/sample2.mp4' }
];

// Ensure hls directories exist
for (const c of cams) {
  const dir = path.join(__dirname, 'public', 'hls', `cam${c.id}`);
  fs.mkdirSync(dir, { recursive: true });
  // Clear older playlist/segments for fresh start
  try { fs.readdirSync(dir).forEach(f => fs.unlinkSync(path.join(dir,f))); } catch(e){}
}

// Start FFmpeg per camera: RTSP (or file) -> HLS segments in public/hls/cam{N}
for (const c of cams) {
  const outDir = path.join('public', 'hls', `cam${c.id}`, 'index.m3u8');

  // FFmpeg command tuned for low-latency-ish HLS; using libx264 for compatibility.
  // For production you'd tune bitrate/resolution and possibly transcode only when needed.
  const ffmpegArgs = [
    '-y',
    '-i', c.source,              // input
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-r', '15',
    '-g', '30',
    '-sc_threshold', '0',
    '-b:v', '800k',
    '-maxrate', '1200k',
    '-bufsize', '1600k',
    '-vf', "scale=1280:-2",
    '-c:a', 'aac', '-ar', '44100', '-b:a', '96k',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '3',
    '-hls_flags', 'delete_segments+omit_endlist',
    '-method', 'PUT',              // optional
    outDir
  ];

  console.log(`Starting ffmpeg for camera ${c.id}: ffmpeg ${ffmpegArgs.join(' ')}`);
  const ff = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore','pipe','pipe'] });

  ff.stdout.on('data', data => console.log(`[ffmpeg cam${c.id} stdout] ${data.toString()}`));
  ff.stderr.on('data', data => console.log(`[ffmpeg cam${c.id} stderr] ${data.toString()}`));
  ff.on('close', code => console.log(`ffmpeg cam${c.id} exited with ${code}`));
}

// Static files (UI + generated HLS)
app.use(express.static(path.join(__dirname, 'public')));

// Simple API for cameras
app.get('/api/cameras', (req, res) => {
  res.json(cams.map(c => ({ id: c.id, name: c.name, status: 'online', hls: `/hls/cam${c.id}/index.m3u8` })));
});

// Simple events API + WebSocket mock events
app.get('/api/events', (req,res)=> {
  res.json([]);
});

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}
setInterval(()=>{
  const camId = Math.floor(Math.random()*cams.length)+1;
  broadcast({ kind: 'event', data: { time: Date.now(), cameraId: camId, type: 'motion', message: `Motion on camera ${camId}` }});
}, 5000);

server.listen(PORT, '0.0.0.0', ()=> console.log(`Server listening ${PORT}`));
