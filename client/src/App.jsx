// client/src/App.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { supabase } from './supabaseClient'; // Baza danych
import Auth from './Auth'; // Ekran logowania
import './App.css';

function App() {
  // 1. Sprawdzanie sesji użytkownika
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // JEŚLI NIE ZALOGOWANY -> POKAŻ EKRAN LOGOWANIA
  if (!session) {
    return <Auth />;
  }

  // --- APLIKACJA WŁAŚCIWA (TYLKO DLA ZALOGOWANYCH) ---

  const [formData, setFormData] = useState({
    product: '',
    audience: '',
    goal: 'Sprzedaż',
    budget: 'Średni',
    tone: 'Profesjonalny',
    platform: 'Facebook'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [history, setHistory] = useState([]);

  // ADRES BACKENDU (Twoj Render)
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

    try {
      const textResponse = await axios.post(`${API_URL}/api/campaign`, formData);
      const generatedText = textResponse.data.result;
      setResult(generatedText);

      const imagePrompt = `Professional product photography of ${formData.product}, style: ${formData.tone}, cinematic lighting, 8k resolution, photorealistic. PURE IMAGE, NO TEXT, NO TYPOGRAPHY, NO WORDS, NO LOGOS, CLEAN BACKGROUND.`;
      
      const imageResponse = await axios.post(`${API_URL}/api/image`, { prompt: imagePrompt });
      const generatedImage = imageResponse.data.url;
      setImageUrl(generatedImage);

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
      setResult(`⚠️ Wystąpił błąd połączenia: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (entry) => {
    setFormData(entry.formData);
    setResult(entry.result);
    setImageUrl(entry.imageUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    if (confirm('Czy usunąć historię?')) {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="app">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto 20px auto'}}>
        <h1 style={{margin: 0}}>🚀 Agent Marketingowy AI</h1>
        <div style={{textAlign: 'right'}}>
           <small style={{color: '#64748b'}}>Użytkownik: {session.user.email}</small><br/>
           <button onClick={handleLogout} style={{padding: '5px 15px', fontSize: '0.8rem', width: 'auto', marginTop: '5px', backgroundColor: '#ef4444'}}>Wyloguj</button>
        </div>
      </div>
      
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
            <label>Platforma</label>
            <select name="platform" value={formData.platform} onChange={handleChange}>
                <option value="Facebook">Facebook / Instagram Ads</option>
                <option value="LinkedIn">LinkedIn (Post Ekspercki)</option>
                <option value="TikTok">TikTok / Reels (Scenariusz Wideo)</option>
                <option value="GoogleAds">Google Ads (Nagłówki)</option>
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