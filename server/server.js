// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Endpoint 1: Generowanie Tekstu (Strategia + Copy)
app.post('/api/campaign', async (req, res) => {
    try {
        // Pobieramy parametr 'tone' z frontendu
        const { product, audience, goal, budget, tone } = req.body;

        const systemPrompt = `
        Jesteś Senior Marketing Managerem.
        
        WAŻNE: Twój styl wypowiedzi (Tone of Voice) dla tej kampanii ma być: ${tone || 'Profesjonalny'}.
        Dostosuj słownictwo, entuzjazm i strukturę zdań do tego tonu.
        
        Twoje zadanie to wygenerować odpowiedź w formacie Markdown zawierającą:
        1. 🎯 Strategię reklamową dopasowaną do budżetu.
        2. ✍️ 3 Warianty tekstów reklamowych (zgodne z wybranym tonem).
        3. 🚀 3 Punkty optymalizacji oferty.
        4. 🎨 Dokładny opis (prompt) do wygenerowania grafiki.
        
        Używaj nagłówków i list.
        `;

        const userPrompt = `Produkt: ${product}, Odbiorcy: ${audience}, Cel: ${goal}, Budżet: ${budget}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo", // Możesz zmienić na gpt-3.5-turbo dla oszczędności
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });

        res.json({ result: completion.choices[0].message.content });
    } catch (error) {
        console.error("Błąd OpenAI:", error);
        res.status(500).json({ error: "Błąd generowania tekstu" });
    }
});

// Endpoint 2: Generowanie Grafiki (DALL-E)
app.post('/api/image', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        res.json({ url: response.data[0].url });
    } catch (error) {
        console.error("Błąd DALL-E:", error);
        res.status(500).json({ error: "Błąd generowania obrazu" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Serwer działa na porcie ${PORT}`);
});