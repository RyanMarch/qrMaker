const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let clients = [];

function watchDir(dir) {
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        // Ignore .git, .wrangler, node_modules, etc.
        if (filename.includes('.git') || filename.includes('.wrangler') || filename.includes('node_modules')) {
            return;
        }
        const ext = path.extname(filename);
        if (['.html', '.css', '.js'].includes(ext)) {
            console.log(`[Live Reload] File changed: ${filename}`);
            clients.forEach(res => {
                try {
                    res.write("data: reload\n\n");
                } catch (e) {
                    // Ignore errors for closed connections
                }
            });
            clients = [];
        }
    });
}

// Watch workspace root
watchDir(path.join(__dirname, '..'));

const sseServer = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/sse') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        clients.push(res);
        req.on('close', () => {
            clients = clients.filter(c => c !== res);
        });
        return;
    }
    res.writeHead(404);
    res.end();
});

sseServer.listen(8789, '127.0.0.1', () => {
    console.log('[Live Reload] Server listening on http://127.0.0.1:8789/sse');
});

// Run wrangler pages dev
const wrangler = spawn('npx', ['wrangler', 'pages', 'dev', '.', '--compatibility-date=2024-01-01'], {
    stdio: 'inherit',
    shell: true
});

wrangler.on('close', (code) => {
    process.exit(code || 0);
});
