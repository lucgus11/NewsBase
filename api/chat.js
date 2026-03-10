export default async function handler(req, res) {
  // On n'autorise que les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { messages } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API Groq manquante sur Vercel' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768', // Modèle rapide et efficace
        messages: [
          { role: 'system', content: 'Tu es l assistant intelligent de NewsBase. Réponds de manière concise et amicale en français.' },
          ...messages
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
        return res.status(500).json({ error: data.error.message });
    }

    return res.status(200).json({ reply: data.choices[0].message.content });

  } catch (error) {
    return res.status(500).json({ error: 'Erreur de connexion à Groq' });
  }
}
