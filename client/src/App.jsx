// client/src/App.jsx - Wersja Safe Mode (Bezpieczna)
import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import './App.css';

function App() {
  // --- 1. HOOKI (Zawsze na górze, bez wyjątków) ---
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

  const API_URL = "https://marketing-agent-9q1l.onrender.com"; 

  // --- 2. EFEKTY ---
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

  useEffect(() => {
    const savedHistory = localStorage.getItem('campaignHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // --- 3. FUNKCJE ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setLoading(true);
    setResult('');
    setImageUrl('');
    try {
      const textResponse = await axios.post(`${API_URL}/api/campaign`, formData);
      setResult(textResponse.data.result);

      const imagePrompt = `Professional photo of ${formData.product}, style: ${formData.tone}, NO TEXT, clean look.`;
      const imageResponse = await axios.post(`${API_URL}/api/image`, { prompt: imagePrompt });
      setImageUrl(imageResponse.data.url);

      const newEntry = { id: Date.now(), date: new Date().toLocaleString(), formData: { ...formData }, result: textResponse.data.result, imageUrl: imageResponse.data.url };
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
  
  const clearHistory = () => { 
    if(confirm('Usunąć?')) { setHistory([]); localStorage.removeItem('campaignHistory'); } 
  };
  
  const loadFromHistory = (item) => { 
    setFormData(item.formData); setResult(item.result); setImageUrl(item.imageUrl); 
  };

  const handleCopy = () => { 
    navigator.clipboard.writeText(result); setCopySuccess('Skopiowano!'); setTimeout(() => setCopySuccess(''), 3000); 
  };
  
  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    html2pdf().from(element).save();
  };

  // --- 4. GŁÓWNY RETURN (Tylko jeden!) ---
  // Używamy operatorów trójargumentowych ( ? : ) zamiast if/return
  return (
    <>
      {loadingSession ? (
        /* STAN 1: ŁADOWANIE */
        <div className="container" style={{textAlign: 'center', marginTop: '50px'}}>
          <h2>Ładowanie... ⏳</h2>
        </div>
      ) : !session ? (
        /* STAN 2: NIE ZALOGOWANY */
        <Auth />
      ) : (
        /* STAN 3: APLIKACJA */
        <div className="app">
          <div style={{display: 'flex', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto 20px'}}>
            <h1>🚀 Agent AI</h1>
            <div style={{textAlign: 'right'}}>
              <small>{session?.user?.email}</small><br/>
              <button onClick={handleLogout} style={{background:'#ef4444', color:'white', border:'none', padding:'5px', marginTop:'5px'}}>Wyloguj</button>
            </div>
          </div>
          
          <div className="container">
            <div className="left-column">
              <div className="card input-section">
                <label>Produkt</label><input name="product" value={formData.product} onChange={handleChange} />
                <label>Odbiorcy</label><input name="audience" value={formData.audience} onChange={handleChange} />
                <label>Cel</label>
                <select name="goal" value={formData.goal} onChange={handleChange}><option>Sprzedaż</option><option>Leady</option></select>
                <label>Budżet</label>
                <select name="budget" value={formData.budget} onChange={handleChange}><option>Średni</option><option>Wysoki</option></select>
                <label>Platforma</label>
                <select name="platform" value={formData.platform} onChange={handleChange}><option value="Facebook">Facebook</option><option value="TikTok">TikTok</option><option value="LinkedIn">LinkedIn</option></select>
                <button onClick={handleSubmit} disabled={loading}>{loading ? 'Pracuję...' : 'Generuj ✨'}</button>
              </div>
              {history.length > 0 && <div className="card"><button onClick={clearHistory}>Wyczyść historię</button>
                {history.map(item => <div key={item.id} onClick={() => loadFromHistory(item)} style={{padding:'10px', borderBottom:'1px solid #eee', cursor:'pointer'}}>{item.formData.product}</div>)}
              </div>}
            </div>

            <div className="card result-section">
               <div id="report-content">
                 {result ? <ReactMarkdown>{result}</ReactMarkdown> : <p>Wyniki tutaj...</p>}
                 {imageUrl && <img src={imageUrl} style={{width:'100%', marginTop:'20px'}} />}
               </div>
               {result && <div style={{marginTop:'20px'}}><button onClick={handleCopy}>Kopiuj</button><button onClick={handleDownloadPDF}>PDF</button></div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;