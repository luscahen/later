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
