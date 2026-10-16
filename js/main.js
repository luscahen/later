import * as store from './store.js';
import { initTheme } from './theme.js';
import { initUI, render } from './ui.js';
const $ = s => document.querySelector(s);

async function start() {
  $('#gate').hidden = true; $('#app').hidden = false;
  initTheme($('#theme')); initUI(); render();
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
