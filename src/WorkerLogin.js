// WorkerLogin.js – Pagina login per operai
import React, { useState } from "react";

export default function WorkerLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/worker-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code })
      });
      if (!res.ok) throw new Error("Credenziali non valide");
      const data = await res.json();
      onLogin(data); // salva info operaio loggato (id, nome)
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Accesso Operaio</h2>
      <input
        placeholder="Nome utente"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />
      <input
        placeholder="Codice accesso"
        value={code}
        onChange={e => setCode(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
        type="password"
      />
      {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}
      <button onClick={handleLogin} style={{ padding: 10, width: "100%" }}>
        Accedi
      </button>
    </div>
  );
}
