const DATA_URL = "/api/adnkronos";
const MAX_ITEMS = 6;
const REFRESH_MS = 10 * 60 * 1000;
const SEP = " •    ";

/* ---------- Adaptive sizing: misura altezza ticker e adatta font ---------- */
(function adaptiveSizing(){
  const ticker = () => document.querySelector('.ticker-bar');
  const marquee = () => document.querySelector('.marquee-track');
  const clock = () => document.querySelector('.clock');
  const brand = () => document.querySelector('.brand');

  function resizeOnce() {
    const t = ticker();
    if(!t) return;
    const h = t.getBoundingClientRect().height; // altezza effettiva del ticker
    // lasciare 2-3px di margine sopra/sotto: useremo una quota dell'altezza
    const available = Math.max(8, h * 0.72); // 72% dello spazio verticale per il testo
    // impostiamo dimensione font per i titoli: proporzione e limiti
    const titleSize = Math.max(10, Math.min( Math.floor(available), 48 ));
    const clockSize = Math.max(10, Math.min( Math.floor(available * 0.9), 48 ));
    const brandSize = Math.max(10, Math.min( Math.floor(available * 0.5), 28 ));

    const m = marquee();
    const c = clock();
    const b = brand();
    if(m) { m.style.fontSize = titleSize + 'px'; m.style.lineHeight = (Math.max(0.85, Math.min(1.05, available / titleSize))) ; }
    if(c) { c.style.fontSize = clockSize + 'px'; }
    if(b) { b.style.fontSize = brandSize + 'px'; }
  }

  // esegui subito e al resize / osserva i cambi di dimensione del ticker (iframe)
  function attach(){
    resizeOnce();
    window.addEventListener('resize', resizeOnce, { passive:true });
    // ResizeObserver per catchare cambi di dimensioni iframe o container
    try {
      const ro = new ResizeObserver(resizeOnce);
      const t = ticker();
      if(t) ro.observe(t);
    } catch(e){ /* niente */ }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
  else attach();
})();


function updateClock(){
  const el=document.getElementById("clock");
  const n=new Date();
  el.textContent=`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
}
setInterval(updateClock,5000);updateClock();

function buildMarqueeText(ts){const t=ts.join(SEP);return`${t}${SEP}${t}${SEP}`;}

async function fetchLocal(force=false){
  const url = `${DATA_URL}${force ? '?refresh=1' : ''}&ts=${Date.now()}`;
  const r=await fetch(url,{cache:"no-store",headers:{"Accept":"application/json"}});
  const ct=r.headers.get("content-type")||"";
  if(!r.ok||!ct.includes("application/json")){
    const text=await r.text();
    throw new Error(`Bad response (${r.status}) content-type=${ct} body-start=${text.slice(0,60)}`);
  }
  return r.json();
}

function extractTitles(p){try{const n=p?.json?.news??[];return n.slice(0,MAX_ITEMS).map(x=>x?.title??"").filter(Boolean);}catch{return[];}}

async function render(force=false){
  const bar=document.getElementById("ticker");
  const track=document.getElementById("marquee");
  try{
    const data=await fetchLocal(force);
    const titles=extractTitles(data);
    if(!titles.length)throw new Error("no titles");
    bar.classList.remove("error");
    track.textContent=buildMarqueeText(titles);
    const seconds=Math.max(25,Math.min(90,Math.floor(track.textContent.length/3)));
    track.style.animationDuration=`${seconds}s`;
  }catch(e){
    console.error("Errore feed:",e);
    bar.classList.add("error");
    track.textContent="Impossibile leggere il feed.";
  }
}

render(true);
setInterval(()=>render(true),REFRESH_MS);
