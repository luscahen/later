import * as store from './store.js';
const $ = s => document.querySelector(s);
let filter = 'all', prio = 0, eid = null, eprio = 0;
const card = i => `<a class="card" href="${esc(safe(i.link))}" target="_blank" rel="noopener">${i.preview.image ? `<img src="${esc(i.preview.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span class="ct">${esc(i.preview.title || host(i.link))}</span><span class="cs">${esc(host(i.link))}</span></a>`;
const paintE = () => document.querySelectorAll('.eprio button').forEach(x => x.classList.toggle('on', +x.dataset.p === eprio));
function openEdit(id) {
  const i = store.visible().find(x => x.id === id); if (!i) return;
  eid = id; eprio = i.priority || 0;
  $('#e-title').value = i.title; $('#e-link').value = i.link || ''; $('#e-note').value = i.note || '';
  paintE(); $('#edit').showModal();
}

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const safe = u => /^https?:\/\//i.test(u) ? u : '#';

export function render() {
  const all = store.visible();
  const list = all.filter(i => filter === 'all' || (filter === 'done') === i.done);
  $('#count').textContent = `${all.filter(i => !i.done).length} remaining`;
  $('#list').innerHTML = list.map(i => `
    <li class="${i.done ? 'done' : ''}" data-id="${i.id}">
      <button class="chk" data-a="toggle" aria-label="Toggle done"></button>
      <div class="body"><div class="t">${esc(i.title)}</div>
        ${i.note ? `<p class="note">${esc(i.note)}</p>` : ''}
        ${i.preview ? card(i) : ''}
        ${i.link || i.priority ? `<div class="meta">${i.link && !i.preview ? `<a href="${esc(safe(i.link))}" target="_blank" rel="noopener">${esc(host(i.link))}</a>` : ''}${i.priority ? `<span>importance ${i.priority}</span>` : ''}</div>` : ''}
      </div>
      <button class="del" data-a="del" aria-label="Delete">×</button>
    </li>`).join('');
}

export function initUI() {
  store.setStatusHandler(t => $('#status').textContent = t);
  store.setChangeHandler(render);
  $('#list').onclick = e => {
    if (e.target.closest('a')) return;
    const b = e.target.closest('.body'); if (b) return openEdit(b.closest('li').dataset.id);
    const a = e.target.closest('[data-a]'); if (!a) return;
    const id = a.closest('li').dataset.id;
    a.dataset.a === 'toggle' ? store.toggle(id) : store.remove(id); render();
  };
  $('#tabs').onclick = e => {
    const f = e.target.dataset.f; if (!f) return; filter = f;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.f === f)); render();
  };
  $('#clear').onclick = () => { store.clearDone(); render(); };
  $('#more').onclick = () => { const d = $('#details'); d.hidden = !d.hidden; };
  document.querySelectorAll('.prio button').forEach(b => b.onclick = () => {
    prio = prio === +b.dataset.p ? 0 : +b.dataset.p;
    document.querySelectorAll('.prio button').forEach(x => x.classList.toggle('on', +x.dataset.p === prio));
  });
  $('#add').onsubmit = e => {
    e.preventDefault();
    store.add({ title: $('#title').value.trim(), link: $('#link').value.trim() || undefined, note: $('#note').value.trim() || undefined, priority: prio || undefined });
    e.target.reset(); prio = 0; $('#details').hidden = true;
    document.querySelectorAll('.prio button').forEach(x => x.classList.remove('on'));
    render();
  };
  document.querySelectorAll('.eprio button').forEach(b => b.onclick = () => { eprio = eprio === +b.dataset.p ? 0 : +b.dataset.p; paintE(); });
  $('#e-cancel').onclick = () => $('#edit').close();
  $('#edit-form').onsubmit = e => {
    e.preventDefault();
    store.update(eid, { title: $('#e-title').value.trim(), link: $('#e-link').value.trim() || undefined, note: $('#e-note').value.trim() || undefined, priority: eprio || undefined });
    $('#edit').close(); render();
  };
  // Prefill from URL: ?t=title&u=link (for iOS Shortcuts / bookmarklets)
  const p = new URLSearchParams(location.search);
  if (p.get('t') || p.get('u')) {
    $('#title').value = p.get('t') || host(p.get('u'));
    if (p.get('u')) { $('#link').value = p.get('u'); $('#details').hidden = false; }
    history.replaceState(null, '', location.pathname);
  }
}
