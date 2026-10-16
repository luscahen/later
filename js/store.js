// State + logic. Saves are queued; on conflict we merge by id and retry.
import * as gh from './github.js';
const KEY = 'later.cfg', CACHE = 'later.cache';
export const getCfg = () => JSON.parse(localStorage.getItem(KEY) || 'null');
export const setCfg = c => c ? localStorage.setItem(KEY, JSON.stringify(c)) : localStorage.removeItem(KEY);

let items = JSON.parse(localStorage.getItem(CACHE) || '[]'), sha = null, queue = Promise.resolve(), onStatus = () => {};
export const setStatusHandler = f => onStatus = f;
export const visible = () => items.filter(i => !i.deleted).sort((a, b) => b.created - a.created);
const persistLocal = () => localStorage.setItem(CACHE, JSON.stringify(items));

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

export function add({ title, link, note, priority }) {
  items.push({ id: crypto.randomUUID(), title, link, note, priority, done: false, created: Date.now(), updated: Date.now() });
  persistLocal(); save();
}
export function toggle(id) { const i = items.find(x => x.id === id); i.done = !i.done; i.updated = Date.now(); persistLocal(); save(); }
export function remove(id) { const i = items.find(x => x.id === id); i.deleted = true; i.updated = Date.now(); persistLocal(); save(); }
export function clearDone() { items.filter(i => i.done && !i.deleted).forEach(i => { i.deleted = true; i.updated = Date.now(); }); persistLocal(); save(); }
