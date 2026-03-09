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
