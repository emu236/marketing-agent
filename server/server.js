// server/server.js - WERSJA KOMPLETNA
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

// Konfiguracja OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// --- WAŻNE DLA RENDERA (Health Check) ---
app.get('/', (req, res) => {
    res.send("Serwer działa poprawnie! 🚀");
});

// --- ENDPOINT 1: Kampania (Z obsługą TikTok/LinkedIn) ---
app.post('/api/campaign', async (req, res) => {
    try {
        // Pobieramy dane, w tym nową zmienną 'platform'
        const { product, audience, goal, budget, tone, platform } = req.body;

        // Logika wyboru formatu w zależności od platformy
        let formatInstruction = "";
        
        if (platform === 'TikTok' || platform === 'Reels') {
            formatInstruction = `
            To ma być SCENARIUSZ WIDEO (krótkie wideo pionowe).
            Sformatuj odpowiedź jako tabelę lub listę z podziałem na:
            - Czas (sekundy)
            - Obraz (co widać)
            - Dźwięk (co słychać/lektor)
            Dodaj propozycję chwytliwego nagłówka na wideo (Hook).
            `;
        } else if (platform === 'LinkedIn') {
            formatInstruction = `
            To ma być POST NA LINKEDIN.
            Użyj krótkich akapitów, profesjonalnego ale angażującego tonu.
            Zadbaj o "Hook" (pierwsze zdanie) i "Call to Action" na końcu.
            Użyj mądrych hashtagów biznesowych.
            `;
        } else if (platform === 'GoogleAds') {
            formatInstruction = `
            To ma być ZESTAW REKLAM GOOGLE ADS (Search).
            Przygotuj:
            - 5 chwytliwych Nagłówków (do 30 znaków)
            - 3 Teksty reklamowe (do 90 znaków)
            - Listę 10 słów kluczowych.
            `;
        } else {
            // Domyślnie (Facebook / Instagram)
            formatInstruction = `
            To ma być POST NA FACEBOOKA / INSTAGRAMA.
            Stwórz 3 warianty tekstów reklamowych (Krótki, Storytelling, Sprzedażowy).
            Dodaj emoji pasujące do stylu.
            Dodaj sekcję z pomysłami na optymalizację oferty.
            `;
        }

        const systemPrompt = `
        Jesteś Senior Marketing Managerem.
        Twój styl: ${tone || 'Profesjonalny'}.
        Wybrana platforma: ${platform || 'Facebook'}.

        ${formatInstruction}

        Na samym końcu odpowiedzi, zawsze dodaj:
        "🎨 PROMPT DO GRAFIKI:" i stwórz opis sceny lub grafiki pasujący do tej platformy (dla wideo opisz miniaturkę).
        `;

        const userPrompt = `Produkt: ${product}, Odbiorcy: ${audience}, Cel: ${goal}, Budżet: ${budget}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });

        res.json({ result: completion.choices[0].message.content });

    } catch (error) {
        console.error("Błąd OpenAI:", error);
        res.status(500).json({ error: error.message || "Błąd generowania" });
    }
});

// --- ENDPOINT 2: Generowanie Grafik ---
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

// --- START SERWERA (Z adresem 0.0.0.0 dla Rendera) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serwer działa na porcie ${PORT}`);
});