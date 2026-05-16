document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initTabs();
});

function initTheme() {
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
  }
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  if (document.body.classList.contains('light-mode')) {
    localStorage.setItem('theme', 'light');
  } else {
    localStorage.setItem('theme', 'dark');
  }
}

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const currentActiveTab = document.querySelector('.tab-content.active');
      const newTabId = this.getAttribute('data-tab') + '-tab';
      const newTabContent = document.getElementById(newTabId);
      
      if (currentActiveTab === newTabContent) return;

      const currentIndex = Array.from(tabButtons).findIndex(btn => btn.classList.contains('active'));
      const newIndex = Array.from(tabButtons).findIndex(btn => btn === this);
      const direction = newIndex > currentIndex ? 'right' : 'left';

      currentActiveTab.classList.add(direction === 'right' ? 'slide-out-left' : 'slide-out-right');
      newTabContent.classList.add(direction === 'right' ? 'slide-out-right' : 'slide-out-left');
      newTabContent.classList.remove('hidden');
      
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      setTimeout(() => {
        currentActiveTab.classList.remove('active', 'slide-out-left', 'slide-out-right');
        currentActiveTab.classList.add('hidden');
        
        newTabContent.classList.add('active');
        newTabContent.classList.remove('slide-out-left', 'slide-out-right');
        
        if (newTabId === 'roms-tab' && document.getElementById('roms-container').innerHTML.trim() === '') {
          loadROMs();
        } else if (newTabId === 'kernels-tab' && document.getElementById('kernels-container').innerHTML.trim() === '') {
          loadKernels();
        } else if (newTabId === 'flashing-tab' && document.getElementById('flashing-container').innerHTML.trim() === '') {
          loadFlashingGuide();
        }
        window.history.replaceState(null, null, `#${this.getAttribute('data-tab')}`);
      }, 100);
    });
  });

  const hash = window.location.hash.substring(1);
  if (['roms', 'kernels', 'flashing'].includes(hash)) {
    const tabButton = document.querySelector(`.tab-btn[data-tab="${hash}"]`);
    if (tabButton) tabButton.click();
  } else {
    loadROMs();
  }
}

async function loadROMs() {
  const container = document.getElementById('roms-container');
  container.innerHTML = `
    <div class="col-span-full flex justify-center items-center h-32">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  `;

  try {
    const response = await fetch('assets/roms.json');
    if (!response.ok) throw new Error('Error al cargar catálogo principal');
    const roms = await response.json();
    
    const enrichedRoms = await Promise.all(roms.map(async (rom) => {
      let latestVersion = 'N/A';
      let latestDate = 'N/A';
      let timestamp = 0;
      
      if (rom.releases) {
        try {
          const relRes = await fetch(`${rom.releases}?t=${new Date().getTime()}`, { cache: 'no-store' });
          if (relRes.ok) {
            const releases = await relRes.json();
            if (releases && releases.length > 0) {
              const latestRelease = releases[releases.length - 1]; 
              latestVersion = latestRelease.version;
              latestDate = latestRelease.date;
              timestamp = new Date(latestDate).getTime() || 0;
            }
          }
        } catch (e) {
          console.error(`Error de release secuencial en ${rom.id}`);
        }
      }
      return { ...rom, latestVersion, latestDate, timestamp };
    }));
    
    enrichedRoms.sort((a, b) => b.timestamp - a.timestamp);
    container.innerHTML = ''; 
    
    enrichedRoms.forEach(rom => {
      const card = document.createElement('a');
      card.href = `rom.html?id=${rom.id}`;
      card.className = 'card flex flex-col h-full block transition-all duration-300 cursor-pointer';
      
      card.innerHTML = `
        <div class="w-full h-32 bg-gradient-to-br from-zinc-800/40 to-zinc-900/10 rounded-lg flex items-center justify-center border border-white/5 mb-4 overflow-hidden">
          <img src="${rom.image}" alt="${rom.title}" class="h-16 w-auto object-contain transition-transform duration-500 hover:scale-105" onerror="this.style.display='none'">
        </div>
        <h2 class="text-lg font-bold text-zinc-100 mb-1.5">${rom.title}</h2>
        <p class="desc text-xs font-normal mb-4 flex-grow">${rom.description}</p>
        
        <div class="border-t border-white/5 pt-3 mt-auto flex justify-between items-center text-[11px] device-text">
          <div>Build: <span class="font-semibold text-zinc-300">${rom.latestVersion}</span></div>
          <div>Actualizado: <span class="font-semibold text-zinc-300">${rom.latestDate}</span></div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="col-span-full p-4 text-center text-sm text-red-400">Error crítico al cargar las ROMs. Revisa la consola.</div>`;
  }
}

async function loadKernels() {
  const container = document.getElementById('kernels-container');
  container.innerHTML = `
    <div class="col-span-full flex justify-center items-center h-32">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  `;

  try {
    const response = await fetch('assets/kernels.json');
    if (!response.ok) throw new Error('Error al cargar kernels');
    const kernels = await response.json();
    container.innerHTML = '';
    
    kernels.forEach(kernel => {
      const card = document.createElement('div');
      card.className = 'card flex flex-col h-full';
      card.innerHTML = `
        <div class="w-full h-32 bg-gradient-to-br from-zinc-800/40 to-zinc-900/10 rounded-lg flex items-center justify-center border border-white/5 mb-4 overflow-hidden">
          <img src="${kernel.image}" alt="${kernel.title}" class="h-16 w-auto object-contain" onerror="this.style.display='none'">
        </div>
        <h2 class="text-lg font-bold text-zinc-100 mb-1">${kernel.title}</h2>
        <p class="desc text-xs mb-3 flex-grow">${kernel.description}</p>
        <p class="text-[11px] device-text mb-4 font-medium"><span class="text-zinc-500">Soporte:</span> ${kernel.devices}</p>
        <div class="grid grid-cols-2 gap-3 pt-2 mt-auto border-t border-white/5">
          <a href="${kernel.sourceUrl}" target="_blank" class="text-center text-xs font-semibold py-2 px-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-zinc-300">Código Fuente</a>
          <a href="${kernel.downloadUrl}" target="_blank" class="text-center text-xs font-semibold py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors text-white">Descargar</a>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="col-span-full p-4 text-center text-sm text-red-400">Error al compilar el feed de Kernels.</div>`;
  }
}

async function loadFlashingGuide() {
  const container = document.getElementById('flashing-container');
  try {
    const response = await fetch('assets/flashing_guide.html');
    if (!response.ok) throw new Error();
    container.innerHTML = await response.text();
  } catch (e) {
    container.innerHTML = `<div class="p-4 text-center text-sm text-zinc-500">Fallo la inyección asíncrona de la guía de flasheo.</div>`;
  }
}
