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
    contentArea.innerHTML = `
        <div class="card" style="grid-column: 1 / -1;">
            <h3><i class="fas fa-tv"></i> Programme TV</h3>
            <div id="tv-list"><i class="fas fa-spinner fa-spin"></i> Connexion à TVMaze...</div>
        </div>`;
        
    try {
        // On récupère le programme "mondial" (sans country=FR) pour vérifier que l'API répond
        // Cela évite les erreurs si le programme FR est vide à cette heure précise
        const res = await fetch(`https://api.tvmaze.com/schedule`);
        
        if (!res.ok) throw new Error("Réponse serveur : " + res.status);
        const data = await res.json();

        const tvListDiv = document.getElementById('tv-list');

        if (!data || data.length === 0) {
            tvListDiv.innerHTML = "<p>Aucun programme mondial trouvé actuellement.</p>";
            return;
        }

        // Tri par heure
        data.sort((a, b) => a.airtime.localeCompare(b.airtime));

        let html = '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 15px;">';
        
        // On prend les 20 premiers
        data.slice(0, 20).forEach(prog => {
            const heure = prog.airtime || "??:??";
            const chaine = (prog.show && prog.show.network) ? prog.show.network.name : "Streaming";
            const titre = prog.show ? prog.show.name : "Émission";
            const pays = (prog.show && prog.show.network && prog.show.network.country) ? `(${prog.show.network.country.code})` : "";

            html += `
                <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 15px;">
                    <span style="font-weight: bold; color: var(--primary-color); min-width: 60px;">${heure}</span>
                    <div style="flex-grow: 1;">
                        <small style="color: #9ca3af; display: block;">${chaine} ${pays}</small>
                        <strong style="color: #374151;">${titre}</strong>
                    </div>
                </div>`;
        });
        
        html += '</div>';
        tvListDiv.innerHTML = html;

    } catch(e) {
        console.error("Erreur détaillée:", e);
        document.getElementById('tv-list').innerHTML = `
            <p style="color: #ef4444;">Erreur : ${e.message}</p>
            <p style="font-size: 0.8rem; margin-top: 10px;">Note : Si vous utilisez un bloqueur de pub (AdBlock), il bloque peut-être l'accès à l'API.</p>`;
    }
}
