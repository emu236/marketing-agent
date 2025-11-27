// client/src/App.jsx - PEŁNA WERSJA (GŁÓWNY PLIK)
import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import './App.css';

function App() {
  // --- SEKCJA 1: WSZYSTKIE HOOKI (Musi być na górze) ---

  // Stan sesji
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Stan formularza
  const [formData, setFormData] = useState({
    product: '', audience: '', goal: 'Sprzedaż', budget: 'Średni', tone: 'Profesjonalny', platform: 'Facebook'
  });
  
  // Stan widoku
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [history, setHistory] = useState([]);

  // URL BACKENDU
  const API_URL = "https://marketing-agent-9q1l.onrender.com"; 

  // Efekt: Sesja
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

  // Efekt: Historia
  useEffect(() => {
    const savedHistory = localStorage.getItem('campaignHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // --- SEKCJA 2: FUNKCJE ---

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setLoading(true);
    setResult('');
    setImageUrl('');
    try {
      const textResponse = await axios.post(`${API_URL}/api/campaign`, formData);
      const generatedText = textResponse.data.result;
      setResult(generatedText);

      // Obrazek bez napisów
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
  
  const clearHistory = () => { 
    if(confirm('Usunąć historię?')) { 
      setHistory([]); 
      localStorage.removeItem('campaignHistory'); 
    } 
  };
  
  const loadFromHistory = (entry) => { 
    setFormData(entry.formData); 
    setResult(entry.result); 
    setImageUrl(entry.imageUrl); 
  };

  const handleCopy = () => { 
    navigator.clipboard.writeText(result); 
    setCopySuccess('Skopiowano!'); 
    setTimeout(() => setCopySuccess(''), 3000); 
  };
  
  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    html2pdf().from(element).save();
  };


  // --- SEKCJA 3: GŁÓWNY WIDOK ---
  return (
    <>
      {/* SCENARIUSZ 1: Ładowanie */}
      {loadingSession ? (
         <div className="container" style={{textAlign:'center', marginTop:'50px', fontSize:'1.2rem'}}>
            Ładowanie aplikacji... ⏳
         </div>
      ) : !session ? (
         /* SCENARIUSZ 2: Nie zalogowany -> Pokaż Auth */
         <Auth />
      ) : (
         /* SCENARIUSZ 3: Zalogowany -> Pokaż Aplikację */
         <div className="app">
            <div style={{display: 'flex', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto 20px'}}>
              <h1>🚀 Agent AI</h1>
              <div style={{textAlign: 'right'}}>
                 <small>{session?.user?.email}</small><br/>
                 <button onClick={handleLogout} style={{padding: '5px 10px', background: '#ef4444', color:'white', border:'none', borderRadius:'4px', marginTop:'5px', cursor:'pointer'}}>Wyloguj</button>
              </div>
            </div>
            
            <div className="container">
              <div className="left-column">
                <div className="card input-section">
                  <label>Produkt</label><input name="product" value={formData.product} onChange={handleChange} placeholder="Co reklamujemy?" />
                  <label>Odbiorcy</label><input name="audience" value={formData.audience} onChange={handleChange} placeholder="Do kogo?" />
                  <label>Cel</label>
                  <select name="goal" value={formData.goal} onChange={handleChange}>
                    <option>Sprzedaż</option><option>Leady</option><option>Zasięg</option>
                  </select>
                  <label>Budżet</label>
                  <select name="budget" value={formData.budget} onChange={handleChange}>
                    <option>Niski</option><option>Średni</option><option>Wysoki</option>
                  </select>
                  <label>Platforma</label>
                  <select name="platform" value={formData.platform} onChange={handleChange}>
                      <option value="Facebook">Facebook</option><option value="LinkedIn">LinkedIn</option><option value="TikTok">TikTok</option>
                  </select>
                  <button onClick={handleSubmit} disabled={loading}>{loading ? 'Przetwarzanie...' : 'Generuj ✨'}</button>
                </div>
                {history.length > 0 && <div className="card history-section">
                   <div style={{display:'flex', justifyContent:'space-between'}}><h3>Historia</h3><button onClick={clearHistory} style={{width:'auto', padding:'5px', background:'#ef4444', fontSize:'0.8rem'}}>X</button></div>
                   {history.map(item => <div key={item.id} onClick={() => loadFromHistory(item)} style={{cursor:'pointer', borderBottom:'1px solid #eee', padding:'10px 0'}}>{item.formData.product}</div>)}
                </div>}
              </div>
              <div className="card result-section">
                <div id="report-content">
                  {result ? <div className="result-area"><ReactMarkdown>{result}</ReactMarkdown></div> : <p style={{color:'#888', fontStyle:'italic'}}>Wyniki pojawią się tutaj...</p>}
                  {imageUrl && <img src={imageUrl} style={{width:'100%', marginTop:'20px', borderRadius:'8px'}} />}
                </div>
                {result && <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
                  <button onClick={handleCopy} style={{background:'#64748b'}}>Kopiuj</button>
                  <button onClick={handleDownloadPDF} style={{background:'#64748b'}}>PDF</button>
                </div>}
                {copySuccess && <p style={{color:'green', marginTop:'10px'}}>{copySuccess}</p>}
              </div>
            </div>
         </div>
      )}
    </>
  );
}

export default App;