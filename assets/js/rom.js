document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadROMDetails();
  setupModalListeners();
});

function initTheme() {
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
  }
}

async function loadROMDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const romId = urlParams.get('id');

  if (!romId) {
    document.getElementById('rom-header').innerHTML = '<p class="text-red-400 text-sm">Error: Parámetro identificador de ROM ausente.</p>';
    return;
  }

  try {
    const romsResponse = await fetch('assets/roms.json');
    const roms = await romsResponse.json();
    const rom = roms.find(r => r.id === romId);

    if (!rom) {
      document.getElementById('rom-header').innerHTML = '<p class="text-red-400 text-sm">Error: El ID solicitado no coincide con ningún registro.</p>';
      return;
    }

    document.title = `${rom.title} | Repositorio Oficial`;

    const headerContainer = document.getElementById('rom-header');
    headerContainer.innerHTML = `
      <div class="flex flex-col md:flex-row items-center gap-6">
        <div class="h-20 w-20 shrink-0 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-3">
          <img src="${rom.image}" alt="Logo" class="max-h-full max-w-full object-contain">
        </div>
        <div class="text-center md:text-left">
          <h2 class="text-2xl font-extrabold text-zinc-100">${rom.title}</h2>
          <p class="desc text-sm font-normal mt-1 leading-relaxed max-w-2xl">${rom.description}</p>
        </div>
      </div>
    `;

    if (rom.releases) {
      const releasesResponse = await fetch(`${rom.releases}?t=${new Date().getTime()}`, { cache: 'no-store' });
      const releases = await releasesResponse.json();
      renderReleases(releases);
    }
  } catch (error) {
    console.error(error);
    document.getElementById('rom-header').innerHTML = '<p class="text-red-400 text-sm">Fallo de red al parsear los metadatos de la compilación.</p>';
  }
}

function renderReleases(releases) {
  const container = document.getElementById('releases-container');
  container.innerHTML = '';
  const reversedReleases = [...releases].reverse();

  reversedReleases.forEach((release, index) => {
    const card = document.createElement('div');
    card.className = 'card p-5 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4';

    const tagLatest = index === 0 
      ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LATEST</span>` 
      : '';

    const buildMeta = `
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <h4 class="text-lg font-bold text-zinc-100">${release.version}</h4>
          ${tagLatest}
        </div>
        <p class="text-xs text-zinc-400 font-medium">Android ${release.android_ver} &bull; Publicado el ${release.date}</p>
      </div>
    `;

    const createBtn = (label, url) => {
      if (!url) return '';
      if (url.includes('telegra.ph')) {
        return `<button onclick="openReaderModal('${url}')" class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-zinc-300">${label}</button>`;
      }
      return `<a href="${url}" target="_blank" class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-zinc-300">${label}</a>`;
    };

    const actionLinks = `
      <div class="flex flex-wrap gap-2">
        ${createBtn('Changelog', release.changelog)}
        ${createBtn('Notas', release.notes)}
        ${createBtn('Capturas', release.screenshots)}
      </div>
    `;

    let downloadButtons = '<div class="flex flex-wrap gap-2">';
    if (release.downloads && release.downloads.length > 0) {
      release.downloads.forEach(dl => {
        downloadButtons += `<button onclick="openDownloadModal('${dl.link}')" class="text-xs font-bold px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-md shadow-blue-600/5">Descargar (${dl.device})</button>`;
      });
    }
    downloadButtons += '</div>';

    card.innerHTML = `
      <div class="space-y-3">
        ${buildMeta}
        ${actionLinks}
      </div>
      <div class="shrink-0 w-full md:w-auto flex justify-end">
        ${downloadButtons}
      </div>
    `;
    container.appendChild(card);
  });
}

let countdownInterval;

function openDownloadModal(url) {
  const modal = document.getElementById('download-modal');
  const proceedBtn = document.getElementById('proceed-btn');
  
  proceedBtn.classList.add('pointer-events-none', 'opacity-40');
  proceedBtn.href = "#"; 
  let timeLeft = 5;
  proceedBtn.innerText = `Proceder (${timeLeft})`;

  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.remove('opacity-0'), 10);

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      proceedBtn.innerText = `Proceder (${timeLeft})`;
    } else {
      clearInterval(countdownInterval);
      proceedBtn.innerText = 'Proceder con la Descarga';
      proceedBtn.href = url;
      proceedBtn.classList.remove('pointer-events-none', 'opacity-40');
    }
  }, 1000);
}

function closeDownloadModal() {
  const modal = document.getElementById('download-modal');
  modal.classList.add('opacity-0');
  clearInterval(countdownInterval);
  setTimeout(() => modal.classList.add('hidden'), 300);
}

async function openReaderModal(url) {
  const modal = document.getElementById('reader-modal');
  const titleEl = document.getElementById('reader-title');
  const contentEl = document.getElementById('reader-content');

  titleEl.innerText = "Sincronizando con Telegraph...";
  contentEl.innerHTML = `<div class="flex justify-center items-center h-32"><div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div></div>`;
  
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.remove('opacity-0'), 10);

  try {
    const path = url.split('/').pop();
    const response = await fetch(`https://api.telegra.ph/getPage/${path}?return_content=true`);
    const data = await response.json();

    if (data.ok) {
      titleEl.innerText = data.result.title;
      contentEl.innerHTML = parseTelegraphNodes(data.result.content);
    } else {
      throw new Error();
    }
  } catch (error) {
    titleEl.innerText = "Enlace Externo";
    contentEl.innerHTML = `
      <div class="text-center py-6">
        <p class="text-zinc-400 text-sm mb-4">No se pudo parsear el documento de notas de forma nativa en la UI.</p>
        <a href="${url}" target="_blank" class="inline-block bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Abrir en pestaña nueva</a>
      </div>
    `;
  }
}

function parseTelegraphNodes(nodes) {
  if (!nodes) return '';
  let html = '';
  
  for (const node of nodes) {
    if (typeof node === 'string') {
      html += node.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/
/g, "<br>");
    } else {
      let { tag, attrs, children } = node;
      let attrStr = '';
      
      if (attrs) {
         if (tag === 'img' && attrs.src && attrs.src.startsWith('/')) {
            attrs.src = 'https://telegra.ph' + attrs.src;
         }
         for (const [key, value] of Object.entries(attrs)) {
            attrStr += ` ${key}="${value.toString().replace(/"/g, '&quot;')}"`;
         }
      }
      
      let classes = '';
      if (tag === 'p') classes = ' class="mb-4 leading-relaxed text-zinc-300"';
      else if (tag === 'a') classes = ' class="text-blue-400 hover:underline" target="_blank"';
      else if (tag === 'ul') classes = ' class="list-disc pl-5 mb-4 space-y-1 text-zinc-300"';
      else if (tag === 'ol') classes = ' class="list-decimal pl-5 mb-4 space-y-1 text-zinc-300"';
      else if (tag === 'h3' || tag === 'h4') classes = ' class="text-base font-bold text-zinc-100 mt-6 mb-2"';
      else if (tag === 'blockquote') classes = ' class="border-l-2 border-zinc-600 pl-4 italic text-zinc-400 my-4"';
      else if (tag === 'img') classes = ' class="rounded-xl max-w-full h-auto my-4 border border-white/5"';
      html += `<${tag}${attrStr}${classes}>`;
      if (children) html += parseTelegraphNodes(children);
      if (!['img', 'br', 'hr'].includes(tag)) html += `</${tag}>`;
    }
  }
  return html;
}

function closeReaderModal() {
  const modal = document.getElementById('reader-modal');
  modal.classList.add('opacity-0');
  setTimeout(() => modal.classList.add('hidden'), 300);
}

function setupModalListeners() {
  document.getElementById('close-modal-btn').addEventListener('click', closeDownloadModal);
  document.getElementById('close-reader-btn').addEventListener('click', closeReaderModal);
  
  document.getElementById('download-modal').addEventListener('click', (e) => {
    if (e.target.id === 'download-modal') closeDownloadModal();
  });
  document.getElementById('reader-modal').addEventListener('click', (e) => {
    if (e.target.id === 'reader-modal') closeReaderModal();
  });
}
