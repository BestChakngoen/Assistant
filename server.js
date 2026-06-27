const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8888;
const STORAGE_DIR = path.join(__dirname, 'shared-storage');
const DB_FILE = path.join(STORAGE_DIR, 'messages.json');

// Ensure storage directory and database file exist
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '[]');
}

// Get local IPv4 address
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
}

const LOCAL_IP = getLocalIp();
const HOST_URL = `http://${LOCAL_IP}:${PORT}`;

// Clients listening to Server-Sent Events (SSE)
let sseClients = [];

function broadcast(type, payload) {
    const message = JSON.stringify({ type, payload });
    sseClients.forEach(client => {
        client.write(`data: ${message}\n\n`);
    });
}

// Helper to read database
function readDb() {
    try {
        const content = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(content || '[]');
    } catch (e) {
        return [];
    }
}

// Helper to write database
function writeDb(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('Error writing database:', e);
        return false;
    }
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.wav': 'audio/wav',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
    // Enable CORS for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url, HOST_URL);
    const pathname = url.pathname;

    // --- API ENDPOINTS ---

    // 1. SSE Stream
    if (pathname === '/api/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        
        sseClients.push(res);
        
        req.on('close', () => {
            sseClients = sseClients.filter(client => client !== res);
        });
        return;
    }

    // 2. Server Information
    if (pathname === '/api/info' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            localIp: LOCAL_IP,
            port: PORT,
            hostUrl: HOST_URL
        }));
        return;
    }

    // 3. Get all shared items
    if (pathname === '/api/items' && req.method === 'GET') {
        const items = readDb();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(items));
        return;
    }

    // 4. Send Message/Link
    if (pathname === '/api/message' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (!data.text) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Message text is required' }));
                    return;
                }

                const items = readDb();
                const newItem = {
                    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    type: 'text',
                    text: data.text,
                    timestamp: Date.now()
                };

                items.push(newItem);
                writeDb(items);
                broadcast('add', newItem);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, item: newItem }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to process message' }));
            }
        });
        return;
    }

    // 5. Upload File (Streamed Binary data)
    if (pathname === '/api/upload' && req.method === 'POST') {
        const filename = url.searchParams.get('filename') || ('file_' + Date.now());
        const safeFilename = path.basename(filename);
        const uniqueFilename = Date.now() + '_' + safeFilename;
        const uploadPath = path.join(STORAGE_DIR, uniqueFilename);

        const writeStream = fs.createWriteStream(uploadPath);
        req.pipe(writeStream);

        writeStream.on('error', (err) => {
            console.error('File write error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to save file' }));
        });

        writeStream.on('finish', () => {
            try {
                const stats = fs.statSync(uploadPath);
                const items = readDb();
                
                // Detect mime-type based on extension
                const ext = path.extname(safeFilename).toLowerCase();
                const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

                const newItem = {
                    id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    type: 'file',
                    filename: safeFilename,
                    uniqueFilename: uniqueFilename,
                    size: stats.size,
                    mimetype: mimeType,
                    url: `/shared-storage/${uniqueFilename}`,
                    timestamp: Date.now()
                };

                items.push(newItem);
                writeDb(items);
                broadcast('add', newItem);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, item: newItem }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to process uploaded file' }));
            }
        });
        return;
    }

    // 6. Clear History & Shared Files
    if (pathname === '/api/clear' && req.method === 'POST') {
        try {
            // Delete all files in shared-storage except messages.json
            const files = fs.readdirSync(STORAGE_DIR);
            for (const file of files) {
                if (file !== 'messages.json') {
                    fs.unlinkSync(path.join(STORAGE_DIR, file));
                }
            }

            writeDb([]);
            broadcast('clear', null);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to clear storage' }));
        }
        return;
    }

    // --- STATIC FILES SERVING ---
    let reqPath = pathname;
    if (reqPath === '/' || reqPath === '') {
        reqPath = '/TrackerView.html';
    }

    let filePath = path.join(__dirname, reqPath);

    // Security check: ensure path is within __dirname or STORAGE_DIR
    const relative = path.relative(__dirname, filePath);
    const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    
    if (!isSafe && !filePath.startsWith(STORAGE_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🚀 TradeTracker Self-Hosted Share Files Server`);
    console.log(`==================================================`);
    console.log(`🏠 Access locally: http://localhost:${PORT}`);
    console.log(`📶 Access from other devices: ${HOST_URL}`);
    console.log(`📂 Storage directory: ${STORAGE_DIR}`);
    console.log(`==================================================\n`);
});
