const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});

app.get('/api/news', async (req, res) => {
    try {
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=fr&apiKey=${process.env.NEWS_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Erreur NewsAPI: " + error.message });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const msg = await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 1024,
            messages: [{ role: "user", content: message }]
        });
        res.json({ reply: msg.content[0].text });
    } catch (error) {
        res.status(500).json({ error: "Erreur Claude: " + error.message });
    }
});

// Nouvelle route pour le programme TV (Simulation légère)
// Pour la V2, on parse un flux public plus léger pour éviter les crash Vercel
app.get('/api/tv', async (req, res) => {
    try {
        // En conditions réelles avec le gros XMLTV, il faudrait une base de données.
        // Ici on renvoie un JSON direct pour que ton app soit fluide.
        const tvSoir = [
            { chaine: "TF1", titre: "Film du dimanche soir" },
            { chaine: "France 2", titre: "Journal de 20h puis Cinéma" },
            { chaine: "M6", titre: "Capital / Zone Interdite" },
            { chaine: "Arte", titre: "Documentaire historique" }
        ];
        res.json(tvSoir);
    } catch (error) {
        res.status(500).json({ error: "Erreur TV" });
    }
});

module.exports = app;
