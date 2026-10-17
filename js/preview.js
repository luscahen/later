// Link preview via the free Microlink API (the browser can't read other sites directly).
export async function preview(url) {
  try {
    const r = await fetch('https://api.microlink.io/?url=' + encodeURIComponent(url));
    const j = await r.json();
    if (j.status !== 'success') return null;
    const d = j.data;
    return { title: (d.title || '').slice(0, 140), image: (d.image && d.image.url) || (d.logo && d.logo.url) || '' };
  } catch { return null; }
}
