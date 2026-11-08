// Servidor estático mínimo para ver la página: node servir.mjs  →  http://localhost:4321
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL(".", import.meta.url));
const PUERTO = Number(process.env.PUERTO || 4321);
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg", ".png": "image/png", ".ico": "image/x-icon", ".svg": "image/svg+xml", ".webp": "image/webp",
};

createServer(async (req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (ruta.endsWith("/")) ruta += "index.html";
  const archivo = normalize(join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
  try {
    const datos = await readFile(archivo);
    res.writeHead(200, { "Content-Type": TIPOS[extname(archivo)] || "application/octet-stream" }).end(datos);
  } catch {
    res.writeHead(404).end("No encontrado");
  }
}).listen(PUERTO, () => console.log(`La Esquina POS · muestra en http://localhost:${PUERTO}`));
