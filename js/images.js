// Thumbnails: shrink in the browser, cache fetched ones on this device.
import * as gh from './github.js';
const mem = new Map();
export async function shrink(file, max = 480) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / bmp.width), c = document.createElement('canvas');
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/jpeg', 0.72));
}
export async function keep(path, blob) { (await caches.open('later-img')).put(path, new Response(blob)); mem.delete(path); }
export async function url(cfg, path) {
  if (mem.has(path)) return mem.get(path);
  const c = await caches.open('later-img');
  let r = await c.match(path);
  if (!r) { const b = await gh.readFile(cfg, path); if (!b) return ''; await c.put(path, new Response(b)); r = await c.match(path); }
  const u = URL.createObjectURL(await r.blob()); mem.set(path, u); return u;
}
