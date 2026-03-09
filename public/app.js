document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
});

const contentArea = document.getElementById('content-area');
const sectionTitle = document.getElementById('section-title');

// --- SYSTÈME DE FAVORIS (LocalStorage) ---
let favoris = JSON.parse(localStorage.getItem('newsbase_favoris')) || [];

function toggleFavori(titre, url, description) {
    const index = favoris.findIndex(fav => fav.url === url);
    if (index > -1) {
        favoris.splice(index, 1);
    } else {
        favoris.push({ titre, url, description });
    }
    localStorage.setItem('newsbase_favoris', JSON.stringify(favoris));
    
    if (sectionTitle.innerText === "Actualités") fetchActualites();
    if (sectionTitle.innerText === "Mes Favoris") loadFavoris();
}

function isFavori(url) {
    return favoris.some(fav => fav.url === url);
}

// --- GESTION DES SECTIONS ---
function loadSection(section) {
    contentArea.innerHTML = '<div><i class="fas fa-spinner fa-spin"></i> Chargement des données...</div>';
    if(window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('active');

    switch(section) {
        case 'actu': sectionTitle.innerText = "Actualités"; fetchActualites(); break;
        case 'favoris': sectionTitle.innerText = "Mes Favoris"; loadFavoris(); break;
        case 'meteo': sectionTitle.innerText = "Météo & Climat"; fetchMeteo(); break;
        case 'ephemeride': sectionTitle.innerText = "Éphéméride"; fetchEphemeride(); break;
        case 'tv': sectionTitle.innerText = "Programme TV"; fetchTV(); break;
        case 'ia': sectionTitle.innerText = "Assistant Claude"; loadIA(); break;
    }
}

// --- APPELS AUX API DIRECTS ---

async function fetchActualites() {
    try {
        let htmlContent = '';
        const persoRes = await fetch('https://raw.githubusercontent.com/lucgus11/api-actu/main/news.json?t=' + new Date().getTime(), { cache: 'no-store' });
        
        if(persoRes.ok) {
            const persoData = await persoRes.json();
            
            function trouverArticles(data) {
                if (Array.isArray(data)) return data;
                if (typeof data === 'object' && data !== null) {
                    for (let key in data) {
                        if (Array.isArray(data[key])) return data[key];
                    }
                    for (let key in data) {
                        if (typeof data[key] === 'object') {
                            let resultat = trouverArticles(data[key]);
                            if (resultat) return resultat;
                        }
                    }
                }
                return [data];
            }
            
            let articles = trouverArticles(persoData);
            articles = articles.filter(actu => actu && (actu.title || actu.summary));

            if (articles.length === 0) {
                htmlContent = '<p>Aucune actualité valide trouvée dans ton fichier JSON.</p>';
            } else {
                articles.forEach(actu => {
                    const titleSafe = (actu.title || 'Information').replace(/'/g, "\\'");
                    const urlSafe = (actu.link || actu.url || '#').replace(/'/g, "\\'"); 
                    const texteActu = actu.summary || actu.content || actu.description || 'Aucun détail fourni.';
                    const favClass = isFavori(urlSafe) ? 'active' : '';
                    
                    let infosSup = '';
                    if (actu.published || actu.source) {
                        let dateFr = '';
                        if (actu.published) {
                            const d = new Date(actu.published);
                            if(!isNaN(d)) dateFr = d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
                            else dateFr = actu.published; 
                        }
                        const sourceTexte = actu.source ? `<strong>${actu.source}</strong>` : '';
                        const separateur = (sourceTexte && dateFr) ? ' - ' : '';
                        infosSup = `<p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 8px;">${sourceTexte}${separateur}${dateFr}</p>`;
                    }

                    const lienHtml = urlSafe !== '#' 
                        ? `<a href="${urlSafe}" target="_blank" style="color: var(--primary-color); text-decoration: none; margin-top: 10px; display: inline-block;">Lire l'article complet <i class="fas fa-arrow-right"></i></a>` 
                        : '';

                    htmlContent += `
                        <div class="card" style="border-left: 4px solid var(--primary-color);">
                            <button class="btn-fav ${favClass}" onclick="toggleFavori('${titleSafe}', '${urlSafe}', '')">
                                <i class="fas fa-star"></i>
                            </button>
                            ${infosSup}
                            <h3>${actu.title || 'Info sans titre'}</h3>
                            <p>${texteActu}</p>
                            ${lienHtml}
                        </div>`;
                });
            }
        } else {
            htmlContent = '<p>Impossible de lire ton fichier JSON sur GitHub.</p>';
        }
        contentArea.innerHTML = htmlContent;
    } catch (e) { 
        contentArea.innerHTML = "<p>Erreur lors de l'analyse des actualités.</p>"; 
    }
}

function loadFavoris() {
    if (favoris.length === 0) {
        contentArea.innerHTML = "<p>Vous n'avez aucun article en favori pour le moment.</p>";
        return;
    }
    let htmlContent = '';
    favoris.forEach(fav => {
        const titleSafe = fav.titre.replace(/'/g, "\\'");
        htmlContent += `
            <div class="card">
                <button class="btn-fav active" onclick="toggleFavori('${titleSafe}', '${fav.url}', '')">
                    <i class="fas fa-star"></i>
                </button>
                <h3>${fav.titre}</h3>
                <a href="${fav.url}" target="_blank">Consulter l'article</a>
            </div>`;
    });
    contentArea.innerHTML = htmlContent;
}

async function fetchMeteo() {
    try {
        const lat = 50.0, lon = 5.7; // Bastogne
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=uv_index_max&timezone=Europe/Brussels`);
        const data = await res.json();
        
        const meteo = data.current_weather;
        const uvMax = data.daily.uv_index_max[0];
        let uvColor = uvMax < 3 ? '#10b981' : (uvMax < 6 ? '#f59e0b' : '#ef4444');

        // Récupération des feux via API publique de la NASA (EONET)
        let nasaHtml = '<p>Recherche en cours...</p>';
        try {
            const fireRes = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=3');
            const fireData = await fireRes.json();
            if(fireData.events && fireData.events.length > 0) {
                nasaHtml = '<ul style="padding-left: 20px; margin-top: 10px;">';
                fireData.events.forEach(event => {
                    nasaHtml += `<li style="margin-bottom: 5px;"><strong>${event.title}</strong></li>`;
                });
                nasaHtml += '</ul>';
            } else {
                nasaHtml = '<p style="margin-top: 10px;">Aucun incendie majeur détecté récemment.</p>';
            }
        } catch(e) {
            nasaHtml = '<p style="margin-top: 10px; color: red;">Erreur de connexion à la NASA.</p>';
        }

        contentArea.innerHTML = `
            <div class="card">
                <h3><i class="fas fa-temperature-half"></i> Météo Actuelle (Bastogne)</h3>
                <div class="meteo-box">
                    <div>
                        <h2>${meteo.temperature}°C</h2>
                        <p>Vent: ${meteo.windspeed} km/h</p>
                    </div>
                    <i class="fas fa-cloud-sun" style="font-size: 3rem; color: var(--primary-color);"></i>
                </div>
            </div>
            <div class="card">
                <h3><i class="fas fa-sun"></i> Indice UV (Aujourd'hui)</h3>
                <p>Niveau maximum attendu :</p>
                <div style="margin-top:10px;">
                    <span class="badge-uv" style="background-color: ${uvColor};">UV: ${uvMax}</span>
                </div>
            </div>
            <div class="card" style="grid-column: 1 / -1; background: #fff1f2; border: 1px solid #fecdd3;">
                <h3 style="color: #e11d48;"><i class="fas fa-fire-flame-curved"></i> Incendies Majeurs en Direct (NASA API)</h3>
                ${nasaHtml}
            </div>`;
    } catch (e) { contentArea.innerHTML = "Erreur météo."; }
}

async function fetchEphemeride() {
    try {
        // Récupérer le mois et le jour actuels
        const date = new Date();
        const mois = (date.getMonth() + 1).toString().padStart(2, '0');
        const jour = date.getDate().toString().padStart(2, '0');

        // Appel à l'API gratuite, ultra-rapide et fiable de Wikipédia
        const res = await fetch(`https://fr.wikipedia.org/api/rest_v1/feed/onthisday/events/${mois}/${jour}`);
        const data = await res.json();
        
        // On prend le premier événement historique de la liste
        const evenement = data.events[0];
        
        contentArea.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h2 style="color: var(--primary-color); font-size: 2rem;"><i class="fas fa-landmark"></i> Éphéméride</h2>
                <h3 style="margin: 10px 0; color: #6b7280;">Que s'est-il passé un ${jour}/${mois} ? (En ${evenement.year})</h3>
                <p style="font-size: 1.2rem; margin-top: 20px; line-height: 1.5;">${evenement.text}</p>
            </div>`;
    } catch (e) { 
        contentArea.innerHTML = "<p>Impossible de charger l'éphéméride historique aujourd'hui.</p>"; 
    }
}

async function fetchTV() {
    contentArea.innerHTML = `
        <div class="card" style="grid-column: 1 / -1;">
            <h3><i class="fas fa-tv"></i> Programme TV de ce soir</h3>
            <div id="tv-list">Chargement via Backend...</div>
        </div>`;
        
    try {
        const res = await fetch('/api/tv');
        const data = await res.json();
        let html = '<ul style="list-style: none; padding: 0;">';
        data.forEach(prog => {
            html += `<li style="padding: 10px; border-bottom: 1px solid #eee;">
                        <strong>${prog.chaine}</strong> à 21h10 : ${prog.titre}
                     </li>`;
        });
        html += '</ul>';
        document.getElementById('tv-list').innerHTML = html;
    } catch(e) {
        document.getElementById('tv-list').innerHTML = "<p>Les données sont indisponibles pour le moment.</p>";
    }
}

function loadIA() {
    contentArea.innerHTML = `
        <div class="card" style="grid-column: 1 / -1;">
            <h3>Assistant Claude AI</h3>
            <textarea id="prompt" style="width: 100%; height: 100px; padding: 10px;" placeholder="Posez une question..."></textarea>
            <button onclick="askIA()" style="padding: 10px; background: #2563eb; color: white; border: none; cursor: pointer; margin-top: 10px; border-radius:5px;">Envoyer</button>
            <div id="ia-response" style="margin-top: 15px; white-space: pre-wrap; line-height: 1.5;"></div>
        </div>`;
}

async function askIA() {
    const prompt = document.getElementById('prompt').value;
    const responseDiv = document.getElementById('ia-response');
    responseDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Réflexion en cours...';
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: prompt })
        });
        const data = await res.json();
        
        // Affichage précis de l'erreur Vercel pour t'aider à débugger
        if (data.error) {
            responseDiv.innerHTML = `<span style="color: red;">${data.error}</span>`;
        } else {
            responseDiv.innerText = data.reply || "Réponse vide de l'IA.";
        }
    } catch (e) { 
        responseDiv.innerText = "Erreur de connexion au serveur IA (Timeout Vercel ou Problème réseau)."; 
    }
}

// --- POP-UP PWA (Installation) ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPopup();
});

function showInstallPopup() {
    if (document.getElementById('pwa-popup')) return;
    
    const popup = document.createElement('div');
    popup.id = 'pwa-popup';
    popup.innerHTML = `
        <div style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: white; padding: 15px 20px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 1000; display: flex; align-items: center; gap: 15px; border-left: 5px solid var(--primary-color); width: 90%; max-width: 400px;">
            <div style="flex-grow: 1;">
                <strong style="display: block; margin-bottom: 3px; font-size: 1rem;">Installer NewsBase</strong>
                <span style="font-size: 0.8rem; color: #666;">Ajoute l'app sur ton appareil pour y accéder hors-ligne.</span>
            </div>
            <button id="btn-install-pwa" style="background: var(--primary-color); color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">Installer</button>
            <button id="btn-close-pwa" style="background: none; border: none; color: #999; cursor: pointer; font-size: 1.5rem; line-height: 1;">&times;</button>
        </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('btn-install-pwa').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            popup.remove();
        }
    });

    document.getElementById('btn-close-pwa').addEventListener('click', () => {
        popup.remove();
    });
}

// --- INITIALISATION AU CHARGEMENT ---
window.onload = () => {
    loadSection('actu');
    
    // Le code vital pour la PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => console.error('Erreur Service Worker:', err));
    }
};
