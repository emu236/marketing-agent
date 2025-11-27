import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import './App.css';

function App() {
  // ----------------------------------------------------
  // SEKJA 1: WSZYSTKIE HOOKI (Musi być zawsze na górze)
  // ----------------------------------------------------

  // 1. Hooki stanu (useState)
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [formData, setFormData] = useState({
    product: '', audience: '', goal: 'Sprzedaż', budget: 'Średni', tone: 'Profesjonalny', platform: 'Facebook'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [history, setHistory] = useState([]);

  // Adres API
  const API_URL = "https://marketing-agent-9q1l.onrender.com";

  // 2. Hooki efektów (useEffect) - Sesja
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 3. Hooki efektów (useEffect) - Historia
  useEffect(() => {
    const savedHistory = localStorage.getItem('campaignHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // ----------------------------------------------------
  // SEKJA 2: FUNKCJE POMOCNICZE
  // ----------------------------------------------------

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setLoading(true);
    setResult('');
    setImageUrl('');
    try {
      const textResponse = await axios.post(`${API_URL}/api/campaign`, formData);
      const generatedText = textResponse.data.result;
      setResult(generatedText);

      const imagePrompt = `Professional product photography of ${formData.product}, style: ${formData.tone}, NO TEXT, clean background.`;
      const imageResponse = await axios.post(`${API_URL}/api/image`, { prompt: imagePrompt });
      const generatedImage = imageResponse.data.url;
      setImageUrl(generatedImage);

      const newEntry = { id: Date.now(), date: new Date().toLocaleString(), formData: { ...formData }, result: generatedText, imageUrl: generatedImage };
      const updatedHistory = [newEntry, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('campaignHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error(error);
      setResult(`Błąd: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => await supabase.auth.signOut();
  const clearHistory = () => { if(confirm('Usunąć?')) { setHistory([]); localStorage.removeItem('campaignHistory'); } };
  const loadFromHistory = (entry) => { setFormData(entry.formData); setResult(entry.result); setImageUrl(entry.imageUrl); };
  const handleCopy = () => { navigator.clipboard.writeText(result); setCopySuccess('Skopiowano!'); setTimeout(() => setCopySuccess(''), 3000); };
  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    html2pdf().from(element).save();
  };

  // ----------------------------------------------------
  // SEKJA 3: WARUNKOWE WYŚWIETLANIE (Dopiero tutaj!)
  // ----------------------------------------------------

  if (loadingSession) return <div className="container" style={{textAlign:'center', marginTop:'50px'}}>Ładowanie...</div>;
  if (!session) return <Auth />;

  // ----------------------------------------------------
  // SEKJA 4: GŁÓWNY INTERFEJS (Dla zalogowanych)
  // ----------------------------------------------------
  return (
    <div className="app">
      <div style={{display: 'flex', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto 20px'}}>
        <h1>🚀 Agent AI</h1>
        <div style={{textAlign: 'right'}}>
           <small>{session?.user?.email}</small><br/>
           <button onClick={handleLogout} style={{padding: '5px 10px', background: '#ef4444'}}>Wyloguj</button>
        </div>
      </div>
      
      <div className="container">
        <div className="left-column">
          <div className="card input-section">
            <label>Produkt</label><input name="product" value={formData.product} onChange={handleChange} />
            <label>Odbiorcy</label><input name="audience" value={formData.audience} onChange={handleChange} />
            <label>Cel</label>
            <select name="goal" value={formData.goal} onChange={handleChange}>
              <option>Sprzedaż</option><option>Leady</option><option>Zasięg</option>
            </select>
            <label>Platforma</label>
            <select name="platform" value={formData.platform} onChange={handleChange}>
                <option value="Facebook">Facebook</option><option value="LinkedIn">LinkedIn</option><option value="TikTok">TikTok</option>
            </select>
            <button onClick={handleSubmit} disabled={loading}>{loading ? '...' : 'Generuj'}</button>
          </div>
          {history.length > 0 && <div className="card"><button onClick={clearHistory}>Wyczyść historię</button>
            {history.map(item => <div key={item.id} onClick={() => loadFromHistory(item)} style={{cursor:'pointer', borderBottom:'1px solid #eee', padding:'5px'}}>{item.formData.product}</div>)}
          </div>}
        </div>
        <div className="card result-section">
          <div id="report-content">
            {result && <ReactMarkdown>{result}</ReactMarkdown>}
            {imageUrl && <img src={imageUrl} style={{width:'100%', marginTop:'20px'}} />}
          </div>
          {result && <button onClick={handleDownloadPDF}>Pobierz PDF</button>}
        </div>
      </div>
    </div>
  );
}

export default App;