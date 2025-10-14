// ===== Intro timing =====
window.addEventListener('load', () => {
  setTimeout(()=>{
    document.documentElement.classList.add('loaded');
    document.body.style.overflow = 'auto';
  }, 2800);
});

/* ========= MENÚ / MODAL DE INFORMACIÓN (solo si existe en la página) ========= */
(function(){
  const modal   = document.getElementById('infoModal');
  const results = document.getElementById('results');
  const query   = document.getElementById('query');
  const openers = document.querySelectorAll('[data-open="info"]');

  if (!modal) return; // si no hay modal, no hacemos nada en esta parte

  const closers = modal.querySelectorAll('[data-close]');
  const backdrop = modal.querySelector('.modal-backdrop');

 const data = [
  { title:'Información General', meta:'Colegio', href:'info.html',
    tags:['información','colegio','admisión','horarios','ubicación','reglamento'] },

  { title:'Dionisio de Herrera', meta:'Biografía', href:'dionisio.html',
    tags:['dionisio','biografía','historia'] },

  { title:'Actividades Extracurriculares', meta:'Vida estudiantil', href:'actividades.html',
    tags:['actividades','deportes','arte','clubes','stem'] },

  { title:'Carreras y Modalidades', meta:'Oferta académica', href:'oferta.html',
    tags:['carreras','modalidades','mallas','plan de estudios'] },

  { title:'Oferta Académica', meta:'Oferta', href:'oferta.html',
    tags:['oferta','académica','asignaturas','programas'] },

  { title:'Perfiles del Estudiante (Básica y Media)', meta:'Perfiles', href:'perfiles.html',
    tags:['perfiles','básica','media','competencias'] },

  { title:'Galería del Instituto', meta:'Galería', href:'galeria.html',
    tags:['galería','fotos','eventos','celebraciones'] },

  { title:'Contacto del Instituto', meta:'Contacto', href:'contacto.html',
    tags:['contacto','teléfono','whatsapp','correo','ubicación','mapa'] }
];

  function render(list){
    if (!results) return;
    results.innerHTML = list.map(item=>`
      <a class="item" href="${item.href}">
        <div class="icon">${item.meta[0].toUpperCase()}</div>
        <div>
          <div class="title">${item.title}</div>
          <div class="meta">${item.meta}</div>
        </div>
      </a>
    `).join('');
  }

  function search(q){
    const s = (q||'').trim().toLowerCase();
    if(!s) return data;
    return data.filter(item =>
      item.title.toLowerCase().includes(s) ||
      item.meta.toLowerCase().includes(s) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(s)))
    );
  }

  function openModal(e){
    if (e) e.preventDefault();
    modal.classList.add('open');
    render(data);
    if (query){ query.value=''; setTimeout(()=>query.focus(),0); }
  }
  function closeModal(){ modal.classList.remove('open'); }

  openers.forEach(btn => btn.addEventListener('click', openModal));
  if (backdrop) backdrop.addEventListener('click', closeModal);
  modal.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click', closeModal));
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && modal.classList.contains('open')) closeModal(); });

  if (query){
    query.addEventListener('input', () => render(search(query.value)));
  }
  document.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', ()=>{
    if (!query) return;
    query.value = ch.dataset.tag || '';
    render(search(query.value));
    query.focus();
  }));

  render(data);
})();

/* ========= NAV HAMBURGUESA (corre en todas las páginas) ========= */
(function(){
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primaryNav');
  if(!btn || !nav) return;

  btn.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (e)=>{
    if(!nav.classList.contains('open')) return;
    if(e.target.closest('#primaryNav') || e.target.closest('.nav-toggle')) return;
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
  });

  // Cerrar con ESC
  window.addEventListener('keydown', (e)=>{
    if(e.key==='Escape' && nav.classList.contains('open')){
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    }
  });
})();
