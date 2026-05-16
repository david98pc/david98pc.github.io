document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const romId = urlParams.get('id');
  if(!romId) return;

  try {
    const res = await fetch('assets/roms.json');
    const roms = await res.json();
    const rom = roms.find(r => r.id === romId);
    
    if(rom) {
      document.title = `${rom.title} | davv`;
      document.getElementById('rom-header').innerHTML = `
        <div class="rom-banner-large"><img src="${rom.image}" alt="${rom.title}"></div>
        <h1 class="rom-title-large">${rom.title}</h1>
        <p class="rom-desc-large">${rom.description}</p>
      `;

      if(rom.releases) {
        const relRes = await fetch(rom.releases);
        const releases = await relRes.json();
        const container = document.getElementById('releases-container');
        
        [...releases].reverse().forEach((rel, index) => {
          const tag = index === 0 ? '<span class="latest-tag">Latest</span>' : '';
          const div = document.createElement('div');
          div.className = 'release-item';
          
          let dlButtons = rel.downloads.map(d => `<a href="${d.link}" target="_blank" class="btn-primary">Descargar (${d.device})</a>`).join('');

          div.innerHTML = `
            <div class="rel-info">
              <h4>${rel.version} ${tag}</h4>
              <p class="rel-date">Android ${rel.android_ver} • ${rel.date}</p>
            </div>
            <div class="rel-actions">
              ${rel.changelog ? `<a href="${rel.changelog}" target="_blank" class="btn-outline">Changelog</a>` : ''}
              ${dlButtons}
            </div>
          `;
          container.appendChild(div);
        });
      }
    }
  } catch(e) { console.error(e); }
});