const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- ROUTE IA (CLAUDE) VIA FETCH NATIF ---
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.CLAUDE_API_KEY;

        // 1. Vérification de la clé
        if (!apiKey) {
            return res.json({ reply: "⚠️ Erreur Vercel : Ta clé API Anthropic (ANTHROPIC_API_KEY) n'est pas configurée dans les variables d'environnement de Vercel." });
        }

        // 2. Appel direct à Anthropic sans SDK (Anti-crash Vercel)
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                model: "claude-3-haiku-20240307", // Ultra-rapide
                max_tokens: 1024,
                messages: [{ role: "user", content: message }]
            })
        });

        const data = await response.json();

        // 3. Gestion des erreurs renvoyées par Anthropic (ex: plus de crédits)
        if (data.error) {
            return res.json({ reply: "❌ Refus de l'API Claude : " + data.error.message });
        }

        // 4. Succès
        res.json({ reply: data.content[0].text });

    } catch (error) {
        console.error("Erreur Serveur:", error);
        res.json({ reply: "❌ Erreur interne du serveur : " + error.message });
    }
});

// --- ROUTE PROGRAMME TV ---
app.get('/api/tv', async (req, res) => {
    const programmeTV = [
        { chaine: "TF1", titre: "Film du dimanche soir" },
        { chaine: "France 2", titre: "Journal de 20h" },
        { chaine: "M6", titre: "Zone Interdite" },
        { chaine: "Arte", titre: "Documentaire historique" }
    ];
    res.json(programmeTV);
});

module.exports = app;
