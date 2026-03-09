const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

// Initialisation d'Anthropic (utilise la variable d'environnement de Vercel)
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// --- ROUTE IA (CLAUDE) ---
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Vérification de sécurité au cas où la clé API est mal configurée
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(500).json({ error: "Clé API Anthropic manquante dans les réglages Vercel." });
        }

        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307", // Le modèle le plus rapide pour éviter le Timeout Vercel
            max_tokens: 1024,
            messages: [{ role: "user", content: message }]
        });
        
        res.json({ reply: msg.content[0].text });
    } catch (error) {
        console.error("Erreur API:", error);
        // On renvoie l'erreur exacte au Frontend pour t'aider à débugger
        res.status(500).json({ error: "Erreur Claude : " + error.message });
    }
});

// --- ROUTE PROGRAMME TV ---
app.get('/api/tv', async (req, res) => {
    // Données de base pour que ton frontend affiche quelque chose.
    // Plus tard, on pourra connecter ça à une vraie API de programmes TV !
    const programmeTV = [
        { chaine: "TF1", titre: "Film du dimanche soir" },
        { chaine: "France 2", titre: "Journal de 20h" },
        { chaine: "M6", titre: "Zone Interdite" },
        { chaine: "Arte", titre: "Documentaire historique" }
    ];
    res.json(programmeTV);
});

// Exportation obligatoire pour que Vercel comprenne que c'est une API
module.exports = app;
