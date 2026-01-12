const DATA_URL = '/api/adnkronos';
const MAX_ITEMS = 6;
const REFRESH_MS = 10 * 60 * 1000;  // 10 minuti
const SEP = ' | ';

function adaptiveSizing() {
  const ticker = document.querySelector('.ticker-bar');
  const marquee = document.querySelector('.marquee-track');
  const clock = document.querySelector('.clock');
  const brand = document.querySelector('.brand');

  function resizeOnce() {
    const t = ticker;
    if (!t) return;
    const h = t.getBoundingClientRect().height;
    const available = Math.max(8, h * 0.72);
    const titleSize = Math.max(10, Math.min(Math.floor(available), 48));
    const clockSize = Math.max(10, Math.min(Math.floor(available * 0.9), 48));
    const brandSize = Math.max(10, Math.min(Math.floor(available * 0.5), 28));

    if (marquee) {
      marquee.style.fontSize = `${titleSize}px`;
      marquee.style.lineHeight = Math.max(0.85, Math.min(1.05, available / titleSize)).toFixed(2);
    }
    if (clock) clock.style.fontSize = `${clockSize}px`;
    if (brand) brand.style.fontSize = `${brandSize}px`;
  }

  function attach() {
    resizeOnce();
    window.addEventListener('resize', resizeOnce, { passive: true });
    try {
      const ro = new ResizeObserver(resizeOnce);
      const t = ticker;
      if (t) ro.observe(t);
    } catch (e) { /* niente */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
}

function updateClock() {
  const el = document.getElementById('clock');
  const n = new Date();
  el.textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
}

function buildMarqueeText(titles) {
  const ts = titles.join(SEP);
  return ts ? `${ts}${SEP}` : ts;
}

function parseAdnkronosXML(xmlText) {
  try {
    // Regex flessibile per catturare <json>...</json> content
    const jsonMatch = xmlText.match(/<json\b[^>]*>\s*([\s\S]*?)\s*<\/json>/i);
    if (!jsonMatch) throw new Error('No <json> tag found');
    let jsonStr = jsonMatch[1];
    // Pulisci eventuali CDATA o entità XML
    jsonStr = jsonStr.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
    jsonStr = jsonStr.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const data = JSON.parse(jsonStr);
    return data.news || [];
  } catch (e) {
    console.error('XML/JSON parse error:', e, xmlText.slice(0, 500));
    throw new Error(`Parse failed: ${e.message}`);
  }
}

async function fetchLocal(force = false) {
  const url = `${DATA_URL}${force ? '?refresh=1&ts=' + Date.now() : ''}`;
  const r = await fetch(url);
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
  }
  const xmlText = await r.text();
  return parseAdnkronosXML(xmlText);
}

function extractTitles(news) {
  try {
    return news.slice(0, MAX_ITEMS).map(x => x?.title || '').filter(Boolean);
  } catch {
    return [];
  }
}

async function render(force = false) {
  const bar = document.getElementById('ticker');
  const track = document.getElementById('marquee');
  if (!bar || !track) return;
  try {
    const news = await fetchLocal(force);
    const titles = extractTitles(news);
    if (!titles.length) throw new Error('Nessun titolo trovato');
    bar.classList.remove('error');
    track.textContent = buildMarqueeText(titles);
    const seconds = Math.max(25, Math.min(90, Math.floor(track.textContent.length / 3)));
    track.style.animationDuration = `${seconds}s`;
  } catch (e) {
    console.error('Errore feed:', e);
    bar.classList.add('error');
    track.textContent = 'Impossibile leggere il feed.';
  }
}

// Inizializza
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  adaptiveSizing();
  updateClock();
  setInterval(updateClock, 5000);
  render(true);
  setInterval(() => render(true), REFRESH_MS);
}
