// Only file that talks to GitHub. Data lives in data.json of the private repo.
const API = 'https://api.github.com/repos/';
const FILE = 'data.json';
const enc = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const dec = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, '')), c => c.charCodeAt(0)));

async function call(cfg, method, body) {
  const r = await fetch(`${API}${cfg.repo}/contents/${FILE}`, {
    method, cache: 'no-store',
    headers: { Authorization: `Bearer ${cfg.token}`, Accept: 'application/vnd.github+json', ...(body && { 'Content-Type': 'application/json' }) },
    body: body && JSON.stringify(body)
  });
  return r;
}

export async function read(cfg) {
  const r = await call(cfg, 'GET');
  if (r.status === 404) return { items: [], sha: null };
  if (!r.ok) throw new Error(r.status === 401 ? 'Invalid token' : `GitHub error ${r.status}`);
  const j = await r.json();
  return { items: JSON.parse(dec(j.content)).items || [], sha: j.sha };
}

export async function write(cfg, items, sha) {
  const r = await call(cfg, 'PUT', { message: 'update', content: enc(JSON.stringify({ items }, null, 1)), ...(sha && { sha }) });
  if (r.status === 409 || r.status === 422) return { conflict: true };
  if (!r.ok) throw new Error(`GitHub error ${r.status}`);
  return { sha: (await r.json()).content.sha };
}

// ---- image files ----
const U = (cfg, p) => `${API}${cfg.repo}/contents/${p}`;
const H = (cfg, extra) => ({ Authorization: `Bearer ${cfg.token}`, Accept: 'application/vnd.github+json', ...extra });
export async function readFile(cfg, path) {
  const r = await fetch(U(cfg, path), { headers: H(cfg, { Accept: 'application/vnd.github.raw+json' }) });
  return r.ok ? r.blob() : null;
}
export async function writeFile(cfg, path, blob) {
  const b64 = await new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result.split(',')[1]); f.readAsDataURL(blob); });
  const r = await fetch(U(cfg, path), { method: 'PUT', headers: H(cfg, { 'Content-Type': 'application/json' }), body: JSON.stringify({ message: 'img', content: b64 }) });
  if (!r.ok) throw new Error(`Image upload failed (${r.status})`);
}
export async function deleteFile(cfg, path) {
  const m = await fetch(U(cfg, path), { cache: 'no-store', headers: H(cfg) });
  if (!m.ok) return;
  const { sha } = await m.json();
  await fetch(U(cfg, path), { method: 'DELETE', headers: H(cfg, { 'Content-Type': 'application/json' }), body: JSON.stringify({ message: 'rm img', sha }) });
}
