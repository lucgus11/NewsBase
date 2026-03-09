const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration de l'IA Claude avec la variable d'environnement
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});

// Route Backend pour News API
app.get('/api/news', async (req, res) => {
    try {
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=fr&apiKey=${process.env.NEWS_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Erreur NewsAPI: " + error.message });
    }
});

// Route Backend pour l'IA Claude
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

// EXPORT OBLIGATOIRE POUR VERCEL
module.exports = app;
