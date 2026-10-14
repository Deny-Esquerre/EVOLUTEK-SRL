#!/usr/bin/env node
/* Servidor estático para ver el sitio en local, sin dependencias.
 *
 *   node serve.js              sirve dist/ — lo mismo que se publica
 *   node serve.js --dev        sirve la raíz — el esqueleto que se monta solo
 *   node serve.js --dev 8080   el puerto va al final en cualquiera de los dos
 *
 * La diferencia que importa: en dist/ cada ruta es una carpeta con su
 * index.html, así que /proyectos/canary existe de verdad y recargar con
 * Ctrl+Shift+R funciona. En la raíz no hay más archivo que index.html, de modo
 * que este servidor repliega ahí cualquier ruta sin archivo propio; sin ese
 * repliegue, recargar en una ruta profunda devuelve 404, que es justo lo que
 * hace `python -m http.server`.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const DEV = args.includes('--dev');
const PORT = Number(args.find(a => /^\d+$/.test(a))) || 5173;
const ROOT = path.join(__dirname, DEV ? '.' : 'dist');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

if (!fs.existsSync(ROOT)) {
  console.error(DEV
    ? 'No encuentro la raíz del proyecto.'
    : 'No existe dist/. Ejecuta primero:  node build.js');
  process.exit(1);
}

function enviar(res, codigo, cuerpo, tipo) {
  res.writeHead(codigo, {
    'Content-Type': tipo || 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
    // En local interesa ver el último cambio, no lo que guardó el navegador
    'Cache-Control': 'no-store'
  });
  res.end(cuerpo);
}

function servirArchivo(res, archivo, ruta) {
  fs.readFile(archivo, (err, datos) => {
    if (err) return enviar(res, 404, '404 — no existe ' + ruta);
    enviar(res, 200, datos, TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream');
  });
}

http.createServer((req, res) => {
  const ruta = decodeURIComponent(req.url.split('?')[0]);

  // Nada de salirse del directorio servido
  const destino = path.normalize(path.join(ROOT, ruta));
  if (!destino.startsWith(ROOT)) return enviar(res, 403, '403 — fuera del directorio servido');

  let archivo = destino;
  try {
    if (fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
  } catch (e) { /* no existe: se resuelve abajo */ }

  if (fs.existsSync(archivo)) return servirArchivo(res, archivo, ruta);

  // Ruta sin archivo propio: en desarrollo la atiende el router del navegador
  if (DEV && !path.extname(ruta)) {
    return servirArchivo(res, path.join(ROOT, 'index.html'), ruta);
  }

  enviar(res, 404, '404 — no existe ' + ruta);
}).listen(PORT, () => {
  console.log('http://localhost:' + PORT + '  sirviendo ' + (DEV ? 'la raíz (desarrollo)' : 'dist/ (producción)'));
  if (!DEV) console.log('Recuerda reconstruir con `node build.js` tras cada cambio.');
});
