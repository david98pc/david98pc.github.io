
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
        <div class="rom-banner-large">
          <img src="${rom.image}" alt="${rom.title}">
        </div>
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
          
          // Google Drive SVG Icon for download button
          const driveIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
          
          let dlButtons = rel.downloads.map(d => 
            `<a href="${d.link}" target="_blank" class="btn-primary">${driveIcon} Download (${d.device})</a>`
          ).join('');

          div.innerHTML = `
            <div class="rel-info">
              <h4>${rel.version} ${tag}</h4>
              <p class="rel-date">Android ${rel.android_ver} • ${rel.date}</p>
            </div>
            <div class="rel-actions">
              ${rel.changelog ? `<button class="btn-outline" onclick="openReader('${rel.changelog}', 'Changelog')">Changelog</button>` : ''}
              ${rel.notes ? `<button class="btn-outline" onclick="openReader('${rel.notes}', 'Notes')">Notes</button>` : ''}
              ${dlButtons}
            </div>
          `;
          container.appendChild(div);
        });
      }
    }
  } catch(e) {
    console.error(e);
  }

  // Modal Setup
  document.getElementById('close-reader-btn').addEventListener('click', closeReader);
  document.getElementById('reader-modal').addEventListener('click', (e) => {
    if(e.target.id === 'reader-modal') closeReader();
  });
});

async function openReader(url, type) {
  const modal = document.getElementById('reader-modal');
  const title = document.getElementById('reader-title');
  const body = document.getElementById('reader-body');
  
  title.textContent = `Loading ${type}...`;
  body.innerHTML = 'Fetching data...';
  modal.classList.remove('hidden');

  try {
    if(url.includes('telegra.ph')) {
      const path = url.split('/').pop();
      const response = await fetch(`https://api.telegra.ph/getPage/${path}?return_content=true`);
      const data = await response.json();
      
      if(data.ok) {
        title.textContent = data.result.title;
        body.innerHTML = parseTelegraphNodes(data.result.content);
      } else {
        throw new Error('Failed to fetch from Telegraph');
      }
    } else {
       // Fallback for non-telegraph links
       title.textContent = type;
       body.innerHTML = `<a href="${url}" target="_blank" style="color: white; text-decoration: underline;">Open ${type} in new tab</a>`;
    }
  } catch (error) {
    title.textContent = "Error";
    body.innerHTML = `<p>Could not load content. <a href="${url}" target="_blank">Open directly</a></p>`;
  }
}

function closeReader() {
  document.getElementById('reader-modal').classList.add('hidden');
}

// Telegraph Parser
function parseTelegraphNodes(nodes) {
  if (!nodes) return '';
  let html = '';
  for (const node of nodes) {
    if (typeof node === 'string') {
      html += node.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    } else {
      let { tag, attrs, children } = node;
      let attrStr = '';
      if (attrs) {
         if (tag === 'img' && attrs.src && attrs.src.startsWith('/')) attrs.src = 'https://telegra.ph' + attrs.src;
         for (const [key, value] of Object.entries(attrs)) attrStr += ` ${key}="${value.toString().replace(/"/g, '&quot;')}"`;
      }
      html += `<${tag}${attrStr}>`;
      if (children) html += parseTelegraphNodes(children);
      if (!['img', 'br', 'hr'].includes(tag)) html += `</${tag}>`;
    }
  }
  return html;
}
