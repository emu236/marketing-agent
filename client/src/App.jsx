// Wersja Ostateczna - Próba naprawy
// client/src/App.jsx - Wersja naprawcza
import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    product: '',
    audience: '',
    goal: 'Sprzedaż',
    budget: 'Średni',
    tone: 'Profesjonalny'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [history, setHistory] = useState([]);

  // --- ADRES TWOJEGO BACKENDU (Na sztywno) ---
  const API_URL = "https://marketing-agent-9q1l.onrender.com"; 

  useEffect(() => {
    const savedHistory = localStorage.getItem('campaignHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult('');
    setImageUrl('');
    setCopySuccess('');

    console.log("🚀 Wysyłam zapytanie do:", API_URL);

    try {
      // 1. Wysyłanie tekstu (z poprawną końcówką /api/campaign)
      const textResponse = await axios.post(`${API_URL}/api/campaign`, formData);
      const generatedText = textResponse.data.result;
      setResult(generatedText);

      // 2. Wysyłanie obrazka (z poprawną końcówką /api/image)
      const imagePrompt = `Professional advertisement photo for ${formData.product}, style: ${formData.tone}, high quality`;
      const imageResponse = await axios.post(`${API_URL}/api/image`, { prompt: imagePrompt });
      const generatedImage = imageResponse.data.url;
      setImageUrl(generatedImage);

      // Zapis do historii
      const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        formData: { ...formData },
        result: generatedText,
        imageUrl: generatedImage
      };
      const updatedHistory = [newEntry, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('campaignHistory', JSON.stringify(updatedHistory));

    } catch (error) {
      console.error("❌ BŁĄD:", error);
      // Wyświetl dokładny błąd na ekranie
      setResult(`⚠️ Wystąpił błąd połączenia: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funkcje pomocnicze (bez zmian)
  const loadFromHistory = (entry) => {
    setFormData(entry.formData);
    setResult(entry.result);
    setImageUrl(entry.imageUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    if (confirm('Czy na pewno usunąć historię?')) {
      setHistory([]);
      localStorage.removeItem('campaignHistory');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopySuccess('Skopiowano! ✅');
    setTimeout(() => setCopySuccess(''), 3000);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    const opt = { margin: 1, filename: `Kampania_${formData.product}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="app">
      <h1>🚀 Agent Marketingowy AI</h1>
      <div className="container">
        <div className="left-column">
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
            <label>Styl (Ton)</label>
            <select name="tone" value={formData.tone} onChange={handleChange}>
              <option value="Profesjonalny">Profesjonalny</option>
              <option value="Luźny">Luźny</option>
              <option value="Agresywny">Agresywny 🔥</option>
            </select>
            <button onClick={handleSubmit} disabled={loading}>{loading ? 'Przetwarzanie...' : 'Generuj Kampanię ✨'}</button>
          </div>
          {history.length > 0 && (
            <div className="card history-section">
              <div style={{display: 'flex', justifyContent: 'space-between'}}><h2>📜 Historia</h2><button className="btn-small-danger" onClick={clearHistory}>Wyczyść</button></div>
              <div className="history-list">{history.map((item) => (<div key={item.id} className="history-item" onClick={() => loadFromHistory(item)}><strong>{item.formData.product}</strong><span className="history-date">{item.date}</span></div>))}</div>
            </div>
          )}
        </div>
        <div className="card result-section">
          <h2>Twój Plan Marketingowy</h2>
          {loading && <div className="loader">Tworzę strategię... Może to potrwać do minuty 🤖</div>}
          {!loading && !result && <p className="placeholder-text">Wypełnij formularz, aby zobaczyć wynik.</p>}
          {result && ( <><div className="action-buttons"><button className="btn-secondary" onClick={handleCopy}>📋 Kopiuj</button><button className="btn-secondary" onClick={handleDownloadPDF}>📄 PDF</button></div>{copySuccess && <p className="success-msg">{copySuccess}</p>}</>)}
          <div id="report-content">
            {result && <div className="result-area"><ReactMarkdown>{result}</ReactMarkdown></div>}
            {imageUrl && <div className="image-container"><h3>Kreacja Graficzna:</h3><img src={imageUrl} alt="Ad" className="generated-image" /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;