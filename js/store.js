// State + logic. Saves are queued; on conflict we merge by id and retry.
import * as gh from './github.js';
import { preview } from './preview.js';
import * as images from './images.js';
const KEY = 'later.cfg', CACHE = 'later.cache';
export const getCfg = () => JSON.parse(localStorage.getItem(KEY) || 'null');
export const setCfg = c => c ? localStorage.setItem(KEY, JSON.stringify(c)) : localStorage.removeItem(KEY);

let items = JSON.parse(localStorage.getItem(CACHE) || '[]'), sha = null, queue = Promise.resolve(), onStatus = () => {}, onChange = () => {};
export const setStatusHandler = f => onStatus = f;
export const setChangeHandler = f => onChange = f;
export const visible = () => items.filter(i => !i.deleted).sort((a, b) => b.created - a.created);
const persistLocal = () => localStorage.setItem(CACHE, JSON.stringify(items));
// every GitHub write goes through one queue so commits never collide
const enqueue = fn => { const p = queue.then(fn); queue = p.catch(() => {}); return p; };

function merge(a, b) {
  const m = new Map(a.map(i => [i.id, i]));
  for (const i of b) { const o = m.get(i.id); if (!o || i.updated > o.updated) m.set(i.id, i); }
  return [...m.values()];
}

export async function load() {
  const r = await gh.read(getCfg());
  items = merge(items, r.items); sha = r.sha; persistLocal();
}

function save() {
  onStatus('Saving…');
  queue = queue.then(async () => {
    try {
      for (let n = 0; n < 3; n++) {
        const r = await gh.write(getCfg(), items, sha);
        if (!r.conflict) { sha = r.sha; onStatus('Saved'); return; }
        await load();
      }
      onStatus('Could not save. Reload and try again.');
    } catch (e) { onStatus(e.message); }
  });
}

function removeImg(it) {
  const p = it.img; delete it.img; delete it.imgFrom;
  if (p) enqueue(() => gh.deleteFile(getCfg(), p)).catch(() => {});
}
async function putImage(it, blob, from) {
  const small = await images.shrink(blob), path = `img/${it.id}-${Date.now().toString(36)}.jpg`;
  await enqueue(() => gh.writeFile(getCfg(), path, small));
  await images.keep(path, small);
  removeImg(it); it.img = path; it.imgFrom = from;
}
async function attach(it, file) {
  try {
    if (file) await putImage(it, file, 'upload');
    else if (it.link) {
      it.preview = it.preview || await preview(it.link);
      const src = it.preview && it.preview.image;
      if (src && !it.img) { try { const r = await fetch(src, { referrerPolicy: 'no-referrer' }); if (r.ok) await putImage(it, await r.blob(), 'link'); } catch {} }
    }
  } catch (e) { onStatus(e.message); }
  it.updated = Date.now(); persistLocal(); save(); onChange();
}

export function add({ title, link, note, priority, file }) {
  const it = { id: crypto.randomUUID(), title, link, note, priority, done: false, created: Date.now(), updated: Date.now() };
  items.push(it); persistLocal(); save(); attach(it, file);
}
// file: undefined = keep image, null = remove it, File = replace it
export function update(id, f, file) {
  const it = items.find(x => x.id === id), moved = f.link !== it.link;
  Object.assign(it, f, { updated: Date.now() });
  if (file === null || (moved && it.imgFrom === 'link')) removeImg(it);
  if (moved) delete it.preview;
  persistLocal(); save();
  if (file) attach(it, file);
  else if (it.link && !it.img) { delete it.preview; attach(it); }
}
export async function sync() { onStatus('Syncing…'); await queue; await load(); save(); await queue; }
export function toggle(id) { const i = items.find(x => x.id === id); i.done = !i.done; i.updated = Date.now(); persistLocal(); save(); }
export function remove(id) { const i = items.find(x => x.id === id); i.deleted = true; i.updated = Date.now(); removeImg(i); persistLocal(); save(); }
export function clearDone() { items.filter(i => i.done && !i.deleted).forEach(i => { i.deleted = true; i.updated = Date.now(); removeImg(i); }); persistLocal(); save(); }
