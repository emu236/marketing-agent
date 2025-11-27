// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

// Sprawdzamy czy klucz jest podany (zabezpieczenie przed błędem)
if (!process.env.OPENAI_API_KEY) {
    console.error("BŁĄD: Brak klucza OPENAI_API_KEY!");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// --- DLA RENDERA (Health Check) ---
app.get('/', (req, res) => {
    res.send("Serwer działa! 🚀");
});

// Endpoint 1: Kampania
app.post('/api/campaign', async (req, res) => {
    try {
        const { product, audience, goal, budget, tone } = req.body;
        const systemPrompt = `Jesteś ekspertem marketingu. Styl: ${tone || 'Profesjonalny'}. Stwórz strategię, 3 posty, 3 porady i prompt do grafiki. Format Markdown.`;
        const userPrompt = `Produkt: ${product}, Odbiorcy: ${audience}, Cel: ${goal}, Budżet: ${budget}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        });
        res.json({ result: completion.choices[0].message.content });
    } catch (error) {
        console.error("Błąd OpenAI:", error);
        res.status(500).json({ error: error.message || "Błąd generowania" });
    }
});

// Endpoint 2: Obrazek
app.post('/api/image', async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await openai.images.generate({ model: "dall-e-3", prompt: prompt, n: 1, size: "1024x1024" });
        res.json({ url: response.data[0].url });
    } catch (error) {
        console.error("Błąd DALL-E:", error);
        res.status(500).json({ error: "Błąd generowania obrazu" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serwer działa na porcie ${PORT}`);
});