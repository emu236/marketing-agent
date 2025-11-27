// server/server.js - Zaktualizowany endpoint

app.post('/api/campaign', async (req, res) => {
    try {
        // Dodajemy nową zmienną: platform
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
            Użyj mądrych hashtagów.
            `;
        } else {
            // Domyślnie (Facebook / Instagram)
            formatInstruction = `
            Stwórz 3 warianty tekstów reklamowych (Krótki, Storytelling, Sprzedażowy).
            Dodaj sekcję z pomysłami na optymalizację oferty.
            `;
        }

        const systemPrompt = `
        Jesteś Senior Marketing Managerem.
        Twój styl: ${tone || 'Profesjonalny'}.
        Wybrana platforma: ${platform || 'Facebook'}.

        ${formatInstruction}

        Na samym końcu odpowiedzi, zawsze dodaj:
        "🎨 PROMPT DO GRAFIKI:" i stwórz opis sceny lub grafiki pasujący do tej platformy.
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