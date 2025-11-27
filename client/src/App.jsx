// client/src/App.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import './App.css';

function App() {
  // 1. Stan formularza
  const [formData, setFormData] = useState({
    product: '',
    audience: '',
    goal: 'Sprzedaż',
    budget: 'Średni',
    tone: 'Profesjonalny'
  });

  // 2. Stan wyników i aplikacji
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  
  // 3. NOWY STAN: Historia
  const [history, setHistory] = useState([]);

  // Ładowanie historii przy starcie aplikacji
  useEffect(() => {
    const savedHistory = localStorage.getItem('campaignHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Obsługa wpisywania danych
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Główna funkcja generująca
  const handleSubmit = async () => {
    setLoading(true);
    setResult('');
    setImageUrl('');
    setCopySuccess('');

    try {
      // Zapytanie do backendu
      const textResponse = await axios.post('http://localhost:3000/api/campaign', formData);
      const generatedText = textResponse.data.result;
      setResult(generatedText);

      const imagePrompt = `Professional advertisement photo for ${formData.product}, style: ${formData.tone}, high quality`;
      const imageResponse = await axios.post('http://localhost:3000/api/image', { prompt: imagePrompt });
      const generatedImage = imageResponse.data.url;
      setImageUrl(generatedImage);

      // --- ZAPISYWANIE DO HISTORII ---
      const newEntry = {
        id: Date.now(), // Unikalne ID (czas)
        date: new Date().toLocaleString(), // Data zapisu
        formData: { ...formData }, // Kopia danych formularza
        result: generatedText,
        imageUrl: generatedImage
      };

      const updatedHistory = [newEntry, ...history]; // Dodaj nowe na górę
      setHistory(updatedHistory);
      localStorage.setItem('campaignHistory', JSON.stringify(updatedHistory)); // Zapisz w przeglądarce

    } catch (error) {
      console.error(error);
      setResult('Wystąpił błąd. Sprawdź czy serwer backendu działa.');
    } finally {
      setLoading(false);
    }
  };

  // Funkcja przywracania historii
  const loadFromHistory = (entry) => {
    setFormData(entry.formData);
    setResult(entry.result);
    setImageUrl(entry.imageUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Przewiń do góry
  };

  // Funkcja czyszczenia historii
  const clearHistory = () => {
    if (confirm('Czy na pewno chcesz usunąć całą historię?')) {
      setHistory([]);
      localStorage.removeItem('campaignHistory');
    }
  };

  // Funkcje pomocnicze (Kopiuj / PDF)
  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopySuccess('Skopiowano! ✅');
    setTimeout(() => setCopySuccess(''), 3000);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    const opt = {
      margin: 1,
      filename: `Kampania_${formData.product}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="app">
      <h1>🚀 Agent Marketingowy AI</h1>
      
      <div className="container">
        {/* LEWA KOLUMNA: FORMULARZ + HISTORIA */}
        <div className="left-column">
          
          {/* Sekcja Formularza */}
          <div className="card input-section">
            <h2>Nowa Kampania</h2>
            
            <label>Produkt/Usługa</label>
            <input name="product" value={formData.product} placeholder="np. Kurs Jogi" onChange={handleChange} />

            <label>Grupa docelowa</label>
            <input name="audience" value={formData.audience} placeholder="np. Zapracowane mamy" onChange={handleChange} />

            <label>Cel</label>
            <select name="goal" value={formData.goal} onChange={handleChange}>
              <option>Sprzedaż online</option>
              <option>Leady</option>
              <option>Zasięg</option>
            </select>

            <label>Budżet</label>
            <select name="budget" value={formData.budget} onChange={handleChange}>
              <option>Niski</option>
              <option>Średni</option>
              <option>Wysoki</option>
            </select>

            <label>Styl komunikacji (Ton)</label>
            <select name="tone" value={formData.tone} onChange={handleChange}>
              <option value="Profesjonalny">Profesjonalny</option>
              <option value="Luźny">Luźny</option>
              <option value="Agresywny">Agresywny 🔥</option>
              <option value="Storytelling">Storytelling</option>
              <option value="Minimalistyczny">Minimalistyczny</option>
            </select>

            <button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Przetwarzanie...' : 'Generuj Kampanię ✨'}
            </button>
          </div>

          {/* NOWA SEKCJA: HISTORIA */}
          {history.length > 0 && (
            <div className="card history-section">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h2>📜 Historia</h2>
                <button className="btn-small-danger" onClick={clearHistory}>Wyczyść</button>
              </div>
              
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item" onClick={() => loadFromHistory(item)}>
                    <strong>{item.formData.product}</strong>
                    <span className="history-date">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* PRAWA KOLUMNA: WYNIKI */}
        <div className="card result-section">
          <h2>Twój Plan Marketingowy</h2>
          
          {loading && <div className="loader">Tworzę strategię i grafikę... 🤖</div>}
          
          {!loading && !result && <p className="placeholder-text">Wypełnij formularz lub wybierz coś z historii, aby zobaczyć wynik.</p>}

          {result && (
            <>
              <div className="action-buttons">
                <button className="btn-secondary" onClick={handleCopy}>📋 Kopiuj</button>
                <button className="btn-secondary" onClick={handleDownloadPDF}>📄 PDF</button>
              </div>
              {copySuccess && <p className="success-msg">{copySuccess}</p>}
            </>
          )}

          <div id="report-content">
            {result && (
              <div className="result-area">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            )}

            {imageUrl && (
              <div className="image-container">
                <h3>Kreacja Graficzna:</h3>
                <img src={imageUrl} alt="Ad" className="generated-image" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;