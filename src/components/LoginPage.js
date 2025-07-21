// src/components/LoginPage.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const { login }               = useContext(AuthContext);
  const navigate                = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      // 👇 endpoint corretto per il login workers
        const res = await fetch(`${API}/api/worker-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code })
      });
      if (!res.ok) {
        // prova a leggere l’errore dal body; fallback generico
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || 'Login fallito');
      }
      const userData = await res.json();
      login(userData);
      navigate('/list', { replace: true });
    } catch (err) {
      setError(err.message);
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
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: 10,
            background: '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Accedi
        </button>
      </form>
    </div>
  );
}
