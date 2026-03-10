export default async function handler(req, res) {
  // On n'autorise que les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { messages } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'La clé API Groq est introuvable sur Vercel.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // 👇 Voici le nouveau modèle LLaMA 3.3 à jour !
        model: 'llama-3.3-70b-versatile', 
        messages: [
          { role: 'system', content: 'Tu es l\'assistant intelligent de NewsBase. Réponds de manière concise, utile et amicale en français.' },
          ...messages
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    // On gère les erreurs renvoyées par Groq proprement
    if (data.error) {
        return res.status(500).json({ error: data.error.message });
    }

    // On renvoie la réponse
    return res.status(200).json({ reply: data.choices[0].message.content });

  } catch (error) {
    return res.status(500).json({ error: 'Erreur réseau lors de la communication avec Groq.' });
  }
}
