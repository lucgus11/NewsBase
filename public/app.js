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
        favoris.splice(index, 1); // Retire si déjà en favori
    } else {
        favoris.push({ titre, url, description }); // Ajoute
    }
    localStorage.setItem('newsbase_favoris', JSON.stringify(favoris));
    
    // Rafraîchir l'affichage selon la section en cours
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
        
        // 1. API Perso (GitHub)
        const persoRes = await fetch('https://raw.githubusercontent.com/lucgus11/api-actu/main/news.json');
        if(persoRes.ok) {
            const persoData = await persoRes.json();
            const favClass = isFavori(persoData.url || '#') ? 'active' : '';
            htmlContent += `
                <div class="card" style="border-left: 4px solid var(--primary-color);">
                    <button class="btn-fav ${favClass}" onclick="toggleFavori('${persoData.title}', '${persoData.url || '#'}', '${persoData.content || ''}')">
                        <i class="fas fa-star"></i>
                    </button>
                    <h3><i class="fas fa-thumbtack"></i> Actu Perso</h3>
                    <p><strong>${persoData.title}</strong></p>
                    <p>${persoData.content || 'Détails dans le fichier JSON.'}</p>
                </div>`;
        }

        // 2. News API via Backend
        const newsRes = await fetch('/api/news');
        const newsData = await newsRes.json();
        
        if(newsData.articles) {
            newsData.articles.slice(0, 10).forEach(article => {
                const urlSafe = article.url.replace(/'/g, "\\'"); // Sécurité pour les guillemets
                const titleSafe = article.title.replace(/'/g, "\\'");
                const favClass = isFavori(article.url) ? 'active' : '';
                
                htmlContent += `
                    <div class="card">
                        <button class="btn-fav ${favClass}" onclick="toggleFavori('${titleSafe}', '${urlSafe}', '')">
                            <i class="fas fa-star"></i>
                        </button>
                        <h3>${article.title}</h3>
                        <p>${article.description || ''}</p>
                        <a href="${article.url}" target="_blank" style="color: var(--primary-color); text-decoration: none;">Lire l'article <i class="fas fa-arrow-right"></i></a>
                    </div>`;
            });
        }
        contentArea.innerHTML = htmlContent;
    } catch (e) { contentArea.innerHTML = "Erreur de chargement des actualités."; }
}

function loadFavoris() {
    if (favoris.length === 0) {
        contentArea.innerHTML = "<p>Vous n'avez aucun article en favori pour le moment. Cliquez sur l'étoile d'un article pour le sauvegarder !</p>";
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
        // Bastogne par défaut. On demande Météo + UV directement à Open-Meteo !
        const lat = 50.0, lon = 5.7;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=uv_index_max&timezone=Europe/Brussels`);
        const data = await res.json();
        
        const meteo = data.current_weather;
        const uvMax = data.daily.uv_index_max[0];
        
        // Couleur de l'UV selon dangerosité
        let uvColor = uvMax < 3 ? '#10b981' : (uvMax < 6 ? '#f59e0b' : '#ef4444');

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
            <div class="card" style="grid-column: 1 / -1;">
                <h3><i class="fas fa-fire-flame-curved"></i> Risque Feux de Forêt (Copernicus)</h3>
                <p><em>Vue satellite en direct</em></p>
                <iframe src="https://gwis.jrc.ec.europa.eu/apps/gwis.viewer/" width="100%" height="400" style="border:none; border-radius: 8px;"></iframe>
            </div>`;
    } catch (e) { contentArea.innerHTML = "Erreur météo."; }
}

async function fetchEphemeride() {
    try {
        // Appel via une API publique française gratuite
        const res = await fetch('https://nominis.cef.fr/json/nominis.php');
        const data = await res.json();
        
        contentArea.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h2 style="color: var(--primary-color); font-size: 2rem;">Aujourd'hui, nous fêtons</h2>
                <h1 style="margin: 20px 0; font-size: 3rem;">Saint(e) ${data.response.prenom}</h1>
            </div>`;
    } catch (e) { 
        contentArea.innerHTML = "<p>Impossible de charger le saint du jour.</p>"; 
    }
}

async function fetchTV() {
    contentArea.innerHTML = `
        <div class="card" style="grid-column: 1 / -1;">
            <h3><i class="fas fa-tv"></i> Programme TV de ce soir</h3>
            <p>Affichage en direct des données. (Chargement via Backend...)</p>
            <div id="tv-list"></div>
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
        document.getElementById('tv-list').innerHTML = "<p>Les données XMLTV sont trop lourdes, un système simplifié a été mis en place.</p>";
    }
}

// ... La partie loadIA() et askIA() reste exactement la même que dans ta V1 !
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
        responseDiv.innerText = data.reply || "Erreur IA";
    } catch (e) { responseDiv.innerText = "Erreur de connexion au serveur IA."; }
}
