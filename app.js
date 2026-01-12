const API_URL = '/.netlify/functions/adnkronos';
const REFRESH_MS = 10 * 60 * 1000;
const SEP = ' | ';

// TUA adaptiveSizing originale (copia da file:36)
function adaptiveSizing() {
  // ... tutto il tuo codice originale da qui ...
  const ticker = document.querySelector('.ticker-bar');
  // ... fino ResizeObserver ...
}

// TUA updateClock originale
function updateClock() {
  // ... tuo codice originale ...
}

async function updateTicker(force = false) {
  const bar = document.getElementById('ticker');
  const track = document.getElementById('marquee');
  try {
    const url = `${API_URL}${force ? '?refresh=1' : ''}`;
    const res = await fetch(url);
    const titles = await res.json();
    
    if (!titles?.length) throw new Error('No news');
    
    bar.classList.remove('error');
    track.textContent = titles.slice(0, 6).join(SEP) + SEP;
    track.style.animationDuration = `${Math.max(25, Math.min(90, track.textContent.length / 3))}s`;
  } catch (e) {
    console.error(e);
    bar.classList.add('error');
    track.textContent = 'Impossibile leggere il feed.';
  }
}

// Init (tua logica)
document.addEventListener('DOMContentLoaded', () => {
  adaptiveSizing();
  updateClock();
  setInterval(updateClock, 5000);
  updateTicker(true);
  setInterval(() => updateTicker(true), REFRESH_MS);
});
