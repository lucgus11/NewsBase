document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
});

const contentArea = document.getElementById('content-area');
const sectionTitle = document.getElementById('section-title');

function loadSection(section) {
    contentArea.innerHTML = '<div>Chargement des données...</div>';
    if(window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('active');

    switch(section) {
        case 'actu': sectionTitle.innerText = "Actualités"; fetchActualites(); break;
        case 'meteo': sectionTitle.innerText = "Météo, UV & Forêts"; fetchMeteo(); break;
        case 'ephemeride': sectionTitle.innerText = "Éphéméride"; fetchEphemeride(); break;
        case 'tv': sectionTitle.innerText = "Programme TV"; fetchTV(); break;
        case 'ia': sectionTitle.innerText = "Assistant Claude"; loadIA(); break;
    }
}

async function fetchActualites() {
    try {
        let htmlContent = '';
        const persoRes = await fetch('https://raw.githubusercontent.com/lucgus11/api-actu/main/news.json');
        if(persoRes.ok) {
            const persoData = await persoRes.json();
            htmlContent += `<div class="card"><h3>Actu Perso</h3><p>${persoData.title}</p></div>`;
        }
        // Appel au backend
        const newsRes = await fetch('/api/news');
        const newsData = await newsRes.json();
        if(newsData.articles) {
            newsData.articles.slice(0, 5).forEach(article => {
                htmlContent += `<div class="card"><h3>${article.title}</h3><p>${article.description || ''}</p><a href="${article.url}" target="_blank">Lire la suite</a></div>`;
            });
        }
        contentArea.innerHTML = htmlContent;
    } catch (e) { contentArea.innerHTML = "Erreur actus."; }
}

async function fetchMeteo() {
    try {
        const meteoRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=50.0&longitude=5.7&current_weather=true');
        const meteoData = await meteoRes.json();
        contentArea.innerHTML = `
            <div class="card"><h3>Météo (Open-Meteo)</h3><p>${meteoData.current_weather.temperature}°C</p></div>
            <div class="card"><h3>Indice UV</h3><p>Lien <a href="https://currentuvindex.com/" target="_blank">CurrentUVIndex</a></p></div>
            <div class="card"><h3>Feux de Forêt</h3><p>Lien <a href="https://forest-fire.emergency.copernicus.eu/" target="_blank">Copernicus</a></p></div>`;
    } catch (e) { contentArea.innerHTML = "Erreur météo."; }
}

function fetchEphemeride() {
    contentArea.innerHTML = `<div class="card" style="grid-column: 1 / -1;"><h3>Saint du Jour</h3><iframe src="https://nominis.cef.fr/widgets/nominis.php" width="100%" height="200" style="border:none;"></iframe></div>`;
}

function fetchTV() {
    contentArea.innerHTML = `<div class="card" style="grid-column: 1 / -1;"><h3>Programme TV</h3><p>Données brutes via <a href="https://xmltvfr.fr/xmltv.php" target="_blank">XMLTV FR</a></p></div>`;
}

function loadIA() {
    contentArea.innerHTML = `
        <div class="card" style="grid-column: 1 / -1;">
            <h3>Assistant Claude AI</h3>
            <textarea id="prompt" style="width: 100%; height: 100px; padding: 10px;" placeholder="Posez une question..."></textarea>
            <button onclick="askIA()" style="padding: 10px; background: #2563eb; color: white; border: none; cursor: pointer; margin-top: 10px;">Envoyer</button>
            <div id="ia-response" style="margin-top: 15px; white-space: pre-wrap;"></div>
        </div>`;
}

async function askIA() {
    const prompt = document.getElementById('prompt').value;
    const responseDiv = document.getElementById('ia-response');
    responseDiv.innerText = "Réflexion en cours...";
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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
