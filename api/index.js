const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- ROUTE IA (GROQ / LLAMA 3) ---
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.json({ reply: "⚠️ Erreur : Ta clé API Groq (GROQ_API_KEY) n'est pas configurée dans Vercel." });
        }

        // Appel direct à l'API gratuite de Groq
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Modèle super rapide et gratuit
                messages: [{ role: "user", content: message }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.json({ reply: "❌ Erreur Groq : " + data.error.message });
        }

        // Groq renvoie la réponse ici
        res.json({ reply: data.choices[0].message.content });

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
