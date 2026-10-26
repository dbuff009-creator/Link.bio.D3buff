'use strict';

// Лёгкий localhost-сервер без npm install и сторонних модулей.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.bat': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.avif': 'image/avif', '.bmp': 'image/bmp',
  '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
};

function reply(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res, 405, 'Method not allowed');

  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname); }
  catch { return reply(res, 400, 'Bad request'); }

  const filename = path.resolve(ROOT, `.${pathname}`);
  if (filename !== ROOT && !filename.startsWith(ROOT + path.sep)) return reply(res, 403, 'Forbidden');

  fs.stat(filename, (statError, initialStat) => {
    if (statError) return reply(res, 404, 'Not found');
    const file = initialStat.isDirectory() ? path.join(filename, 'index.html') : filename;
    fs.stat(file, (error, info) => {
      if (error || !info.isFile()) return reply(res, 404, 'Not found');
      const headers = {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      };
      let start = 0;
      let end = info.size - 1;
      const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
      let status = 200;
      if (range) {
        if (!range[1] && !range[2]) return reply(res, 416, 'Range not satisfiable');
        if (!range[1]) start = Math.max(0, info.size - Number(range[2]));
        else start = Number(range[1]);
        if (range[2] && range[1]) end = Math.min(end, Number(range[2]));
        if (start >= info.size || start > end) {
          res.writeHead(416, { 'Content-Range': `bytes */${info.size}`, 'Cache-Control': 'no-store' });
          return res.end();
        }
        status = 206;
        headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
      }
      headers['Content-Length'] = String(end - start + 1);
      res.writeHead(status, headers);
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
    });
  });
});

server.on('error', error => {
  console.error(`Не удалось запустить сервер на порту ${PORT}: ${error.message}`);
  process.exitCode = 1;
});
server.listen(PORT, HOST, () => console.log(`D3buff: http://localhost:${PORT}/  (остановить: Ctrl+C)`));
