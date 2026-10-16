import * as store from './store.js';
const $ = s => document.querySelector(s);
let filter = 'all', prio = 0;

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
        ${i.link || i.priority ? `<div class="meta">${i.link ? `<a href="${esc(safe(i.link))}" target="_blank" rel="noopener">${esc(host(i.link))}</a>` : ''}${i.priority ? `<span>importance ${i.priority}</span>` : ''}</div>` : ''}
      </div>
      <button class="del" data-a="del" aria-label="Delete">×</button>
    </li>`).join('');
}

export function initUI() {
  store.setStatusHandler(t => $('#status').textContent = t);
  $('#list').onclick = e => {
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
  // Prefill from URL: ?t=title&u=link (for iOS Shortcuts / bookmarklets)
  const p = new URLSearchParams(location.search);
  if (p.get('t') || p.get('u')) {
    $('#title').value = p.get('t') || host(p.get('u'));
    if (p.get('u')) { $('#link').value = p.get('u'); $('#details').hidden = false; }
    history.replaceState(null, '', location.pathname);
  }
}
