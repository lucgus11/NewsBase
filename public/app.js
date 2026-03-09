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
        
        const persoRes = await fetch('https://raw.githubusercontent.com/lucgus11/api-actu/main/news.json');
        
        if(persoRes.ok) {
            const persoData = await persoRes.json();
            
            // --- FONCTION MAGIQUE POUR TROUVER LA LISTE D'ARTICLES ---
            // Cette fonction fouille dans ton JSON pour trouver le vrai tableau qui contient les infos
            function trouverArticles(data) {
                if (Array.isArray(data)) return data;
                if (typeof data === 'object' && data !== null) {
                    // 1. Cherche un tableau au premier niveau
                    for (let key in data) {
                        if (Array.isArray(data[key])) return data[key];
                    }
                    // 2. Cherche un tableau plus en profondeur si caché dans d'autres sous-dossiers
                    for (let key in data) {
                        if (typeof data[key] === 'object') {
                            let resultat = trouverArticles(data[key]);
                            if (resultat) return resultat;
                        }
                    }
                }
                return [data]; // Cas extrême si aucun tableau n'est trouvé
            }
            
            let articles = trouverArticles(persoData);
            
            // On filtre pour enlever d'éventuels éléments vides du JSON
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
                            if(!isNaN(d)) {
                                dateFr = d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
                            } else {
                                dateFr = actu.published; // Garde la date brute si le format est spécial
                            }
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
        console.error("Erreur JSON :", e);
    }
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
        const lat = 50.0, lon = 5.7; // Bastogne
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=uv_index_max&timezone=Europe/Brussels`);
        const data = await res.json();
        
        const meteo = data.current_weather;
        const uvMax = data.daily.uv_index_max[0];
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
            <div class="card" style="grid-column: 1 / -1; background: #fff1f2; border: 1px solid #fecdd3;">
                <h3 style="color: #e11d48;"><i class="fas fa-fire-flame-curved"></i> Risque Feux de Forêt (Copernicus)</h3>
                <p>Pour des raisons de sécurité imposées par l'UE, la carte interactive s'ouvre sur un nouvel onglet sécurisé.</p>
                <a href="https://effis.jrc.ec.europa.eu/apps/effis.current_situation/" target="_blank" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: #e11d48; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    <i class="fas fa-map-marked-alt"></i> Ouvrir la carte satellite en direct
                </a>
            </div>`;
    } catch (e) { contentArea.innerHTML = "Erreur météo."; }
}

async function fetchEphemeride() {
    try {
        const res = await fetch('https://nominis.cef.fr/json/nominis.php');
        const data = await res.json();
        
        const prenomSaint = data.response.prenoms.majeur.prenom;
        
        contentArea.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h2 style="color: var(--primary-color); font-size: 2rem;">Aujourd'hui, nous fêtons</h2>
                <h1 style="margin: 20px 0; font-size: 3rem;">Saint(e) ${prenomSaint}</h1>
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
        responseDiv.innerText = data.reply || "Erreur IA";
    } catch (e) { responseDiv.innerText = "Erreur de connexion au serveur IA."; }
}

window.onload = () => {
    loadSection('actu');
};
