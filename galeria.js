// ====== Estado en memoria ======
let PHOTOS = [];          // {srcDataURL, title, cat}
let currentFilter = 'all';
let currentList = [];
let openIdx = 0;

// ====== Elementos ======

const grid = document.getElementById('grid');
const searchInput = document.getElementById('searchInput');
const chips = document.querySelectorAll('.chip');
const filePicker = document.getElementById('filePicker');
const drop = document.getElementById('drop');
const exportBtn = document.getElementById('exportBtn');
const addBtn = document.getElementById('addBtn');
if (addBtn) addBtn.addEventListener('click', () => filePicker.click());


// Lightbox
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImage');
const lbCaption = document.getElementById('lbCaption');
const lbIndex = document.getElementById('lbIndex');
const lbTotal = document.getElementById('lbTotal');

// ====== Helpers ======
function render(list){
  grid.innerHTML = list.map((p,i)=>`
    <article class="card" data-cat="${p.cat}" data-index="${i}">
      <span class="badge">${p.cat}</span>
      <a class="thumb" href="#" data-open="${i}" aria-label="Abrir ${p.title}">
        <img loading="lazy" src="${p.srcDataURL}" alt="${p.title}">
      </a>
      <div class="caption">
        <h3>${p.title}</h3>
        <p>${p.desc || ''}</p>
      </div>
    </article>
  `).join('');
  lbTotal.textContent = list.length;
}

function applyFilters(){
  const q = (searchInput.value || '').trim().toLowerCase();
  currentList = PHOTOS.filter(p=>{
    const byCat = (currentFilter==='all') || p.cat===currentFilter;
    const hay = `${p.title} ${p.desc||''} ${p.cat}`.toLowerCase();
    const byText = !q || hay.includes(q);
    return byCat && byText;
  });
  render(currentList);
}

function openLightbox(idx){
  if(!currentList.length) return;
  openIdx = idx;
  const item = currentList[openIdx];
  lbImg.src = item.srcDataURL;
  lbImg.alt = item.title;
  lbCaption.textContent = item.title + (item.desc ? ` — ${item.desc}` : '');
  lbIndex.textContent = (openIdx+1);
  lb.classList.add('open');
  lb.setAttribute('aria-hidden','false');
}
function closeLightbox(){
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden','true');
  lbImg.src = '';
}
function next(){ openLightbox((openIdx+1) % currentList.length); }
function prev(){ openLightbox((openIdx-1+currentList.length) % currentList.length); }

// ====== Eventos UI ======
chips.forEach(c=>{
  c.addEventListener('click', ()=>{
    chips.forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    currentFilter = c.dataset.filter;
    applyFilters();
  });
});
searchInput.addEventListener('input', applyFilters);

grid.addEventListener('click', (e)=>{
  const a = e.target.closest('[data-open]');
  if(!a) return;
  e.preventDefault();
  const idx = Number(a.dataset.open);
  // mapear a índice actual
  const src = currentList[idx].srcDataURL;
  const mapped = currentList.findIndex(p=>p.srcDataURL===src);
  openLightbox(mapped<0?0:mapped);
});

lb.addEventListener('click', (e)=>{
  if(e.target.hasAttribute('data-close')) closeLightbox();
  if(e.target.hasAttribute('data-next'))  next();
  if(e.target.hasAttribute('data-prev'))  prev();
});
window.addEventListener('keydown', (e)=>{
  if(!lb.classList.contains('open')) return;
  if(e.key==='Escape') closeLightbox();
  if(e.key==='ArrowRight') next();
  if(e.key==='ArrowLeft') prev();
});

// ====== Carga de imágenes (file input + drag&drop) ======
filePicker.addEventListener('change', async (e)=>{
  await addFiles([...e.target.files]);
  e.target.value = ''; // reset
});

['dragenter','dragover'].forEach(ev=>{
  drop.addEventListener(ev, (e)=>{ e.preventDefault(); drop.classList.add('drag'); });
});
['dragleave','drop'].forEach(ev=>{
  drop.addEventListener(ev, (e)=>{ e.preventDefault(); drop.classList.remove('drag'); });
});
drop.addEventListener('drop', async (e)=>{
  const files = [...e.dataTransfer.files].filter(f=>f.type.startsWith('image/'));
  await addFiles(files);
});

async function addFiles(files){
  // Lee como DataURL para no depender de nombres/rutas
  for(const file of files){
    const dataURL = await readAsDataURL(file);
    // Opcional: pedir etiqueta rápida (Enter = general)
    let title = file.name.replace(/\.[^.]+$/, '');
    title = title.substring(0,60);
    const cat = quickGuessCategory(title); // heurística simple
    PHOTOS.push({srcDataURL:dataURL, title, cat});
  }
  applyFilters();
}

function readAsDataURL(file){
  return new Promise((res,rej)=>{
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

// Heurística simple para categoría (puedes editar palabras):
function quickGuessCategory(text){
  const t = text.toLowerCase();
  if(/fútbol|voleibol|baloncesto|deporte/.test(t)) return 'deporte';
  if(/acto|desfile|color day|movie|villamar|evento|gradu/i.test(t)) return 'eventos';
  if(/aula|clase|laboratorio|robot|informática|comput/i.test(t)) return 'aulas';
  if(/feria|vocacional|expo/i.test(t)) return 'ferias';
  if(/cultura|indio|folclor|música|teatro/i.test(t)) return 'cultura';
  if(/si[\'’]?ndrome|down|conciencia|salud|árbol|arbol|ambiente/i.test(t)) return 'conciencia';
  if(/solidar/i.test(t)) return 'solidaridad';
  if(/campus|patio|pasillo|jard[ií]n|entrada|biblioteca/i.test(t)) return 'campus';
  return 'campus';
}

// ====== Exportar galería a un HTML auto-contenido ======
exportBtn.addEventListener('click', ()=>{
  if(!PHOTOS.length){ alert('Primero añade fotos.'); return; }

  const payload = {
    savedAt: new Date().toISOString(),
    photos: PHOTOS
  };
  const data = JSON.stringify(payload);

  // Plantilla mini con la misma UI pero cargando desde JSON embebido
  const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Galería exportada — CEMNG</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
<style>${inlineStyles()}</style>
</head><body>
<header class="hero"><div class="hero-inner">
<h1>Galería exportada</h1><p class="tag">Archivo único con tus fotos embebidas.</p>
</div><div class="hero-vignette"></div></header>
<section class="controls">
  <div class="filters">
    <button class="chip active" data-filter="all">Todas</button>
    <button class="chip" data-filter="campus">Campus</button>
    <button class="chip" data-filter="eventos">Eventos</button>
    <button class="chip" data-filter="aulas">Aulas</button>
    <button class="chip" data-filter="deporte">Deporte</button>
    <button class="chip" data-filter="cultura">Cultura</button>
    <button class="chip" data-filter="solidaridad">Solidaridad</button>
    <button class="chip" data-filter="ferias">Ferias</button>
    <button class="chip" data-filter="conciencia">Conciencia</button>
  </div>
  <div class="search"><input id="searchInput" type="search" placeholder="Buscar…"></div>
</section>
<main id="grid" class="grid" aria-live="polite"></main>
<div id="lightbox" class="lightbox" aria-hidden="true"><div class="lb-backdrop" data-close></div>
<figure class="lb-figure" role="dialog" aria-modal="true"><button class="lb-close" data-close>✕</button>
<img id="lbImage" alt=""><figcaption><div id="lbCaption" class="lb-caption"></div><div class="lb-meta"><span id="lbIndex">1</span>/<span id="lbTotal">0</span></div></figcaption>
<button class="lb-nav prev" data-prev>‹</button><button class="lb-nav next" data-next>›</button></figure></div>
<footer class="foot"><p>Exportada ${new Date().toLocaleString()}</p></footer>
<script>const EXPORT=${data};</script>
<script>${inlineScript()}</script>
</body></html>`;

  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {href:url, download:'galeria-exportada.html'});
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
});

// ====== Inlines para export ======
function inlineStyles(){
  // copiamos el CSS mínimo para export (mismo layout, resumido)
  return `
  :root{--accent:#c8102e;--ink:#101010;--paper:#fff;--bg:#fafafa}
  *{box-sizing:border-box}body{margin:0;font-family:'Inter',system-ui;color:var(--ink);background:#fafafa}
  .hero{min-height:30svh;display:grid;place-items:center;position:relative}
  .hero-inner{text-align:center;padding:36px 20px}
  .hero h1{margin:0 0 6px;font-size:clamp(24px,5vw,40px);font-weight:900}
  .controls{width:min(1180px,94vw);margin:18px auto 10px;display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between}
  .filters{display:flex;gap:8px;flex-wrap:wrap}
  .chip{padding:9px 12px;border-radius:999px;border:2px solid var(--accent);background:#fff;color:var(--accent);font-weight:800}
  .chip.active{background:var(--accent);color:#fff}
  .search input{padding:12px 14px;border-radius:12px;border:2px solid #eee;min-width:240px}
  .grid{width:min(1180px,94vw);margin:8px auto 38px;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
  .card{position:relative;overflow:hidden;border-radius:18px;background:var(--paper);border:1px solid #eee;box-shadow:0 14px 30px rgba(0,0,0,.08)}
  .thumb{position:relative;aspect-ratio:4/3;overflow:hidden}
  .thumb img{width:100%;height:100%;object-fit:cover;display:block}
  .badge{position:absolute;left:10px;top:10px;background:#fff;color:var(--accent);border:2px solid var(--accent);padding:4px 8px;border-radius:999px;font-size:.8rem;font-weight:900}
  .caption{padding:10px 12px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px}
  .caption h3{font-size:.98rem;margin:0;font-weight:900}
  .caption p{margin:0;font-size:.85rem;color:#333;opacity:.85}
  .lightbox{position:fixed;inset:0;display:none;z-index:60}.lightbox.open{display:block}
  .lb-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.6)}
  .lb-figure{position:absolute;inset:0;display:grid;place-items:center;padding:26px}
  .lb-figure img{max-width:min(92vw,1200px);max-height:78vh;border-radius:18px;background:#000}
  .lb-caption{color:#fff;text-align:center;margin-top:10px;font-weight:700}
  .lb-meta{color:#ddd;text-align:center;font-size:.9rem}
  .lb-close{position:absolute;right:22px;top:18px;background:#fff;border:0;border-radius:12px;padding:8px 12px;font-weight:900}
  .lb-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.95);border:0;border-radius:14px;width:46px;height:46px;font-size:28px;font-weight:900}
  .lb-nav.prev{left:16px}.lb-nav.next{right:16px}
  .foot{text-align:center;color:#555;padding:26px 10px}
  `;
}
function inlineScript(){
  // versión mínima que usa EXPORT.photos
  return `
  let PHOTOS=EXPORT.photos||[],currentFilter='all',currentList=[...PHOTOS],openIdx=0;
  const grid=document.getElementById('grid'),chips=document.querySelectorAll('.chip'),searchInput=document.getElementById('searchInput');
  const lb=document.getElementById('lightbox'),lbImg=document.getElementById('lbImage'),lbCaption=document.getElementById('lbCaption'),lbIndex=document.getElementById('lbIndex'),lbTotal=document.getElementById('lbTotal');
  function render(l){grid.innerHTML=l.map((p,i)=>\\\`<article class="card"><span class="badge">\\\${p.cat}</span><a class="thumb" href="#" data-open="\\\${i}"><img src="\\\${p.srcDataURL}" alt="\\\${p.title}"></a><div class="caption"><h3>\\\${p.title}</h3><p>\\\${p.desc||''}</p></div></article>\\\`).join('');lbTotal.textContent=l.length}
  function apply(){const q=(searchInput.value||'').toLowerCase();currentList=PHOTOS.filter(p=>((currentFilter==='all')||p.cat===currentFilter)&&(!q||(\`\${p.title} \${p.desc||''} \${p.cat}\`.toLowerCase().includes(q))));render(currentList)}
  chips.forEach(c=>c.addEventListener('click',()=>{chips.forEach(x=>x.classList.remove('active'));c.classList.add('active');currentFilter=c.dataset.filter;apply()}));
  searchInput.addEventListener('input',apply);grid.addEventListener('click',e=>{const a=e.target.closest('[data-open]');if(!a)return;e.preventDefault();open(+a.dataset.open)});
  function open(i){if(!currentList.length)return;openIdx=i;const it=currentList[openIdx];lbImg.src=it.srcDataURL;lbCaption.textContent=it.title+(it.desc?(' — '+it.desc):'');lbIndex.textContent=openIdx+1;lb.classList.add('open');lb.setAttribute('aria-hidden','false')}
  function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');lbImg.src=''}
  function next(){open((openIdx+1)%currentList.length)}function prev(){open((openIdx-1+currentList.length)%currentList.length)}
  lb.addEventListener('click',e=>{if(e.target.hasAttribute('data-close'))close();if(e.target.hasAttribute('data-next'))next();if(e.target.hasAttribute('data-prev'))prev()});
  window.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev()});
  apply();
  `;
}
/* =========================================================
   Galería — JS
   Funciones:
   - Subir imágenes (botón y drag&drop)
   - Etiquetas: banda, deportes, viajes, cultura, celebraciones, tes
   - Filtros por chip + búsqueda
   - Lightbox (ver en grande, ← → Esc)
   - Borrar imagen
   - Guardar galería (export .html)
   - Persistencia en localStorage
   ========================================================= */

(() => {
  // ---------- Config ----------
  const TAGS = [
    { id: 'banda',          label: 'Banda marcial' },
    { id: 'deportes',       label: 'Deportes' },
    { id: 'viajes',         label: 'Viajes' },
    { id: 'cultura',        label: 'Cultura' },
    { id: 'celebraciones',  label: 'Celebraciones' },
    { id: 'tes',            label: 'Trabajo educativo social' },
  ];
  const LS_KEY = 'cemng_galeria_fotos_v1';

  // ---------- Estado ----------
  let photos = load();
  let currentTag = 'all';
  let searchText = '';
  let lightIndex = -1; // índice actual en la lista filtrada

  // ---------- DOM helpers ----------
  const $  = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  // Asegurar elementos mínimos
  ensureBaseDOM();

  const grid       = $('#grid');
  const filtersEl  = $('.filters');
  const filePicker = $('#filePicker');
  const addBtn     = $('#addBtn');
  const exportBtn  = $('#exportBtn');
  const dropZone   = $('#drop');
  const searchBox  = $('#search');

  // Render inicial
  renderChips();
  renderGrid();
  mountLightbox();

  // ---------- Eventos globales ----------
  // Botón Añadir → abre input file
  addBtn?.addEventListener('click', () => filePicker?.click());
  // Input file seleccionado
  filePicker?.addEventListener('change', handleFilesSelected);

  // Exportar galería a HTML autónomo
  exportBtn?.addEventListener('click', exportGallery);

  // Drag & drop
  if (dropZone) {
    ;['dragenter','dragover'].forEach(ev =>
      dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('is-drag'); })
    );
    ;['dragleave','drop'].forEach(ev =>
      dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('is-drag'); if (ev === 'drop') handleDrop(e); })
    );
  }

  // Búsqueda
  searchBox?.addEventListener('input', () => {
    searchText = (searchBox.value || '').trim().toLowerCase();
    renderGrid();
  });

  // Delegación: click en tarjeta para abrir lightbox
  grid?.addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    const id = card.dataset.id;
    const list = getFiltered();
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) openLightbox(idx);
  });

  // ---------- Lógica de subida ----------
  function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    addFiles(files);
    filePicker.value = '';
  }

  function handleDrop(e) {
    const files = Array.from(e.dataTransfer?.files || []);
    if (!files.length) return;
    addFiles(files);
  }

  // Convierte files a DataURL y agrega con tag seleccionado (si existe #tagSelect)
  async function addFiles(files) {
    const tagSel = $('#tagSelect');
    const tag = tagSel?.value || 'celebraciones';
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      const src = await fileToDataURL(f);
      photos.push({ id: crypto.randomUUID(), src, tag, title: '' });
    }
    save();
    renderGrid();
  }

  function fileToDataURL(file) {
    return new Promise(resolve => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.readAsDataURL(file);
    });
  }

  // ---------- Render chips / filtros ----------
  function renderChips() {
    if (!filtersEl) return;
    filtersEl.innerHTML = `
      <button class="chip is-active" data-tag="all">Todas</button>
      ${TAGS.map(t => `<button class="chip" data-tag="${t.id}">${t.label}</button>`).join('')}
    `;
    bindChipEvents();
  }

  function bindChipEvents() {
    $$('.chip').forEach(ch => {
      ch.addEventListener('click', () => {
        $$('.chip').forEach(c => c.classList.remove('is-active'));
        ch.classList.add('is-active');
        currentTag = ch.dataset.tag || 'all';
        renderGrid();
      });
    });
  }

  // ---------- Render grid ----------
  function getFiltered() {
    let list = photos.slice();
    if (currentTag !== 'all') list = list.filter(p => p.tag === currentTag);
    if (searchText) {
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(searchText) ||
        p.tag.toLowerCase().includes(searchText)
      );
    }
    return list;
  }

  function renderGrid() {
    if (!grid) return;
    const list = getFiltered();
    if (!list.length) {
      grid.innerHTML = `
        <div class="empty">
          <p>No hay fotos aquí todavía.</p>
          <p><strong>Consejo:</strong> usa “Añadir fotos” o arrástralas a la caja.</p>
        </div>`;
      return;
    }
    grid.innerHTML = list.map(p => `
      <figure class="card" data-id="${p.id}" data-tag="${p.tag}">
        <img src="${p.src}" alt="" loading="lazy">
        <figcaption class="tag">${labelOf(p.tag)}</figcaption>
        <button class="del" title="Eliminar" data-action="del">×</button>
      </figure>
    `).join('');

    // borrar
    $$('#grid .card .del').forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.stopPropagation();
        const id = (ev.currentTarget).closest('.card').dataset.id;
        removePhoto(id);
      });
    });
  }

  function labelOf(tagId) {
    return TAGS.find(t => t.id === tagId)?.label || tagId;
  }

  function removePhoto(id) {
    photos = photos.filter(p => p.id !== id);
    save();
    renderGrid();
  }

  // ---------- Lightbox ----------
  function mountLightbox() {
    if ($('#lightbox')) return;
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.innerHTML = `
      <div class="lb-backdrop"></div>
      <div class="lb-content">
        <button class="lb-close" title="Cerrar">✕</button>
        <button class="lb-prev"  title="Anterior">‹</button>
        <img id="lbImg" alt="">
        <button class="lb-next"  title="Siguiente">›</button>
        <div class="lb-foot">
          <span id="lbMeta"></span>
          <button id="lbDownload" class="btn small">Descargar</button>
        </div>
      </div>
    `;
    document.body.appendChild(lb);

    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-backdrop').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-prev').addEventListener('click', prevLight);
    lb.querySelector('.lb-next').addEventListener('click', nextLight);
    $('#lbDownload').addEventListener('click', downloadCurrent);

    window.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevLight();
      if (e.key === 'ArrowRight') nextLight();
    });
  }

  function openLightbox(idx) {
    lightIndex = idx;
    const list = getFiltered();
    if (!list.length) return;
    const p = list[lightIndex];
    $('#lbImg').src = p.src;
    $('#lbMeta').textContent = `${labelOf(p.tag)} — ${lightIndex + 1} / ${list.length}`;
    $('#lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    $('#lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }
  function prevLight() {
    const list = getFiltered();
    if (!list.length) return;
    lightIndex = (lightIndex - 1 + list.length) % list.length;
    $('#lbImg').src = list[lightIndex].src;
    $('#lbMeta').textContent = `${labelOf(list[lightIndex].tag)} — ${lightIndex + 1} / ${list.length}`;
  }
  function nextLight() {
    const list = getFiltered();
    if (!list.length) return;
    lightIndex = (lightIndex + 1) % list.length;
    $('#lbImg').src = list[lightIndex].src;
    $('#lbMeta').textContent = `${labelOf(list[lightIndex].tag)} — ${lightIndex + 1} / ${list.length}`;
  }
  function downloadCurrent() {
    const list = getFiltered();
    if (!list.length || lightIndex < 0) return;
    const a = document.createElement('a');
    a.href = list[lightIndex].src;
    a.download = `foto_${Date.now()}.png`;
    a.click();
  }

  // ---------- Exportar galería ----------
  function exportGallery() {
    const doc = `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Galería exportada</title>
<style>
  body{font-family:system-ui,Inter,Arial; margin:0; background:#fafafa; color:#111}
  .wrap{max-width:1200px; margin:24px auto; padding:0 16px}
  h1{font-size:clamp(24px,3.6vw,36px); margin:16px 0}
  .grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px}
  figure{position:relative; margin:0; border-radius:14px; overflow:hidden; background:#fff; box-shadow:0 2px 12px rgba(0,0,0,.08)}
  img{width:100%; height:220px; object-fit:cover; display:block}
  figcaption{position:absolute; left:8px; bottom:8px; background:#fff; border-radius:999px; padding:4px 10px; font-weight:700; font-size:12px; border:1px solid #eee}
</style>
</head>
<body>
<div class="wrap">
  <h1>Galería exportada</h1>
  <div class="grid">
    ${photos.map(p => `
      <figure><img src="${p.src}" alt=""><figcaption>${labelOf(p.tag)}</figcaption></figure>
    `).join('')}
  </div>
</div>
</body>
</html>`;
    const blob = new Blob([doc], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `galeria_${new Date().toISOString().slice(0,10)}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---------- Persistencia ----------
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(photos)); } catch {}
  }
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      // saneo mínimo
      return Array.isArray(arr) ? arr.filter(p => p && p.src) : [];
    } catch { return []; }
  }

  // ---------- Utilidades ----------
  function ensureBaseDOM() {
    // Filtros
    if (!$('.filters')) {
      const bar = document.createElement('div');
      bar.className = 'filters';
      const hero = document.querySelector('.hero-actions') || document.body;
      hero.insertAdjacentElement('afterend', bar);
    }
    // Grid
    if (!$('#grid')) {
      const g = document.createElement('section');
      g.id = 'grid';
      document.body.appendChild(g);
    }
    // File picker
    if (!$('#filePicker')) {
      const i = document.createElement('input');
      i.type = 'file'; i.id = 'filePicker'; i.multiple = true; i.accept = 'image/*'; i.hidden = true;
      document.body.appendChild(i);
    }
    // Botones (opcional, si tu HTML ya los tiene no pasa nada)
    if (!$('#addBtn')) {
      const b = document.createElement('button');
      b.id = 'addBtn'; b.className = 'btn'; b.textContent = '➕ Añadir fotos';
      document.body.prepend(b);
    }
    if (!$('#exportBtn')) {
      const b = document.createElement('button');
      b.id = 'exportBtn'; b.className = 'btn'; b.textContent = '💾 Guardar galería';
      document.body.prepend(b);
    }
    // Zona drop (opcional)
    if (!$('#drop')) {
      const d = document.createElement('div');
      d.id = 'drop';
      d.innerHTML = '<div class="drop-inner">Arrastra aquí tus imágenes</div>';
      document.body.appendChild(d);
    }
    // Buscador (opcional)
    if (!$('#search')) {
      const s = document.createElement('input');
      s.id = 'search'; s.type = 'search'; s.placeholder = 'Buscar por etiqueta o texto…';
      document.body.prepend(s);
    }
  }
})();
