
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('roms-grid');
  try {
    const res = await fetch('assets/roms.json');
    const roms = await res.json();
    container.innerHTML = '';
    
    for (const rom of roms) {
      let latestVer = 'N/A';
      let latestDate = '';
      if(rom.releases) {
        try {
          const relRes = await fetch(rom.releases);
          const releases = await relRes.json();
          if(releases.length > 0) {
            latestVer = releases[releases.length-1].version;
            latestDate = releases[releases.length-1].date;
          }
        }catch(e){}
      }

      const card = document.createElement('a');
      card.href = `rom.html?id=${rom.id}`;
      card.className = 'davv-card';
      card.innerHTML = `
        <div class="card-banner">
          <img src="${rom.image}" alt="${rom.title}">
        </div>
        <div class="card-body">
          <h2 class="card-title">${rom.title}</h2>
          <p class="card-desc">${rom.description}</p>
          <div class="card-meta">
            <span>Latest: ${latestVer}</span>
            <span>${latestDate}</span>
          </div>
        </div>
      `;
      container.appendChild(card);
    }
  } catch(e) {
    container.innerHTML = '<p style="color:red;">Error loading projects.</p>';
  }
});
