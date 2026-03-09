const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- ROUTE IA (GROQ / LLAMA 3.1) ---
app.post('/api/chat', async (req, res) => {
    try {
        // On récupère "messages" (un tableau) au lieu de "message" (un texte simple)
        const { messages } = req.body; 
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.json({ reply: "⚠️ Erreur : Ta clé API Groq (GROQ_API_KEY) n'est pas configurée dans Vercel." });
        }

        // On ajoute les instructions de base avant l'historique de l'utilisateur
        const systemInstruction = { 
            role: "system", 
            content: "Tu es l'assistant intelligent de l'application NewsBase. Tu dois répondre de manière claire, utile et toujours en français. Sois concis." 
        };
        const conversationComplete = [systemInstruction, ...messages];

        // Appel à l'API de Groq
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: conversationComplete
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.json({ error: data.error.message });
        }

        res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error("Erreur Serveur:", error);
        res.json({ error: error.message });
    }
});

// --- ROUTE PROGRAMME TV ---
    async function fetchTV() {
    // 1. On prépare l'affichage
    contentArea.innerHTML = `
        <div class="card" style="grid-column: 1 / -1;">
            <h3><i class="fas fa-tv"></i> Programme TV (Aujourd'hui)</h3>
            <div id="tv-list"><i class="fas fa-spinner fa-spin"></i> Chargement des programmes...</div>
        </div>`;
        
    try {
        // 2. On récupère la date du jour au format AAAA-MM-JJ
        const today = new Date().toISOString().split('T')[0];
        
        // 3. APPEL DIRECT à TVMaze (on utilise 'FR' pour les chaînes francophones ou 'BE' pour la Belgique)
        // Je mets 'FR' ici car l'API TVMaze a beaucoup plus de données pour ce pays
        const res = await fetch(`https://api.tvmaze.com/schedule?country=FR&date=${today}`);
        
        if (!res.ok) throw new Error("Erreur réseau");
        const data = await res.json();

        const tvListDiv = document.getElementById('tv-list');

        if (!data || data.length === 0) {
            tvListDiv.innerHTML = "<p>Aucun programme trouvé pour aujourd'hui.</p>";
            return;
        }

        // 4. On trie les programmes par heure
        data.sort((a, b) => a.airtime.localeCompare(b.airtime));

        // 5. On génère le HTML
        let html = '<div style="display: flex; flex-direction: column; gap: 5px; margin-top: 15px;">';
        
        // On limite aux 25 premiers résultats pour la clarté
        data.slice(0, 25).forEach(prog => {
            const heure = prog.airtime;
            const chaine = prog.show.network ? prog.show.network.name : "Web";
            const titre = prog.show.name;

            html += `
                <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 15px;">
                    <span style="font-weight: bold; color: var(--primary-color); min-width: 55px;">${heure}</span>
                    <div style="flex-grow: 1;">
                        <strong style="color: #374151;">${chaine}</strong> : 
                        <span style="color: #4b5563;">${titre}</span>
                    </div>
                </div>`;
        });
        
        html += '</div>';
        tvListDiv.innerHTML = html;

    } catch(e) {
        console.error("Erreur TVMaze:", e);
        document.getElementById('tv-list').innerHTML = "<p>Service TV temporairement indisponible (Erreur de connexion).</p>";
    }
}
