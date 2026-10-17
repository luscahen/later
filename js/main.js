import * as store from './store.js';
import { initTheme } from './theme.js';
import { initUI, render } from './ui.js';
const $ = s => document.querySelector(s);
const SYNC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3M18 3v4h-4M6 21v-4h4"/></svg>';
async function doSync() {
  const b = $('#sync'); b.classList.add('spin');
  try { await store.sync(); } catch (e) { $('#status').textContent = e.message; }
  b.classList.remove('spin'); render();
}

async function start() {
  $('#gate').hidden = true; $('#app').hidden = false;
  initTheme($('#theme')); initUI(); render(); $('#sync').innerHTML = SYNC; $('#sync').onclick = doSync;
  try { $('#status').textContent = 'Syncing…'; await store.load(); $('#status').textContent = ''; render(); }
  catch (e) { $('#status').textContent = e.message; }
}

$('#gate-form').onsubmit = async e => {
  e.preventDefault();
  store.setCfg({ repo: $('#g-repo').value.trim(), token: $('#g-token').value.trim() });
  try { await store.load(); start(); }
  catch (err) { store.setCfg(null); $('#g-err').textContent = err.message + '. Check repo name and token.'; }
};
$('#logout').onclick = () => { if (confirm('Disconnect this device?')) { store.setCfg(null); localStorage.removeItem('later.cache'); location.reload(); } };

if (store.getCfg()) start(); else $('#gate').hidden = false;
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
