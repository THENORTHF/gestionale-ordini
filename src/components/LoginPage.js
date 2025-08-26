// src/components/LoginPage.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const API = process.env.REACT_APP_API_URL;

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }               = useContext(AuthContext);
  const navigate                = useNavigate();

  const loginWorker = async (username, accessCode) => {
    const res = await fetch(`${API}/api/worker-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, access_code: accessCode })
    });
    if (res.status === 404) {
      throw new Error('Endpoint non trovato');
    }
    if (res.status === 401) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Credenziali errate');
    }
    if (!res.ok) {
      throw new Error('Errore durante il login');
    }
    return await res.json();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await loginWorker(username, code);

      // ✅ salva username in localStorage (serve per riconoscere l'admin nel FE)
      if (userData?.username) {
        localStorage.setItem('username', userData.username);
      }

      // mantieni il tuo flusso esistente
      login(userData);
      navigate('/list', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Login Operaio</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            required
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Codice Accesso</label>
          <input
            type="password"
            value={code}
            onChange={e => setCode(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 10,
            background: loading ? '#999' : '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Caricamento...' : 'Accedi'}
        </button>
      </form>
    </div>
  );
}
