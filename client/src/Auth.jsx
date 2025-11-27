// client/src/Auth.jsx
import { useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    
    // 1. Pobieramy aktualny adres strony (np. https://twoja-app.vercel.app)
    // Dzięki temu Supabase wie, gdzie wrócić po kliknięciu w maila
    const currentUrl = window.location.origin;

    // 2. Wysyłamy prośbę o Magic Link z instrukcją powrotu
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: currentUrl, 
      },
    })

    if (error) {
      setMessage(`Błąd: ${error.message}`)
    } else {
      setMessage('✅ Sprawdź skrzynkę mailową! Kliknij w link, aby się zalogować.')
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px' }}>
        <h1 style={{fontSize: '2rem', marginBottom: '10px'}}>🔐 Zaloguj się</h1>
        <p style={{color: '#64748b', marginBottom: '30px'}}>Uzyskaj dostęp do Agenta AI i zapisuj swoje kampanie.</p>
        
        {message ? (
          <div className="success-msg" style={{ margin: '20px 0', padding: '15px', background: '#f0fdf4', borderRadius: '8px' }}>
            {message}
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label style={{textAlign: 'left'}}>Twój Email</label>
            <input
              type="email"
              placeholder="np. jan@firma.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{marginBottom: '20px'}}
            />
            <button disabled={loading}>
              {loading ? 'Wysyłanie...' : 'Wyślij magiczny link ✨'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}