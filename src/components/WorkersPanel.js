// WorkersPanel.js – Gestione operai (admin)
import React, { useState, useEffect } from "react";

export default function WorkersPanel() {
  const [workers, setWorkers] = useState([]);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");

  // Carica lista operai
  useEffect(() => {
    fetch("http://localhost:5000/api/workers")
      .then(res => res.json())
      .then(setWorkers)
      .catch(console.error);
  }, []);

  // Aggiungi operaio
  const addWorker = async () => {
    if (!username.trim() || !code.trim()) return;
    const res = await fetch("http://localhost:5000/api/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, access_code: code })
    });
    const w = await res.json();
    setWorkers([w, ...workers]);
    setUsername("");
    setCode("");
  };

  // Elimina operaio
  const delWorker = async id => {
    await fetch(`http://localhost:5000/api/workers/${id}`, { method: "DELETE" });
    setWorkers(workers.filter(w => w.id !== id));
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 20 }}>
      <h2>Gestione Operai</h2>
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <input
          placeholder="Codice accesso"
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={addWorker}>Aggiungi</button>
      </div>
      <ul>
        {workers.map(w => (
          <li key={w.id}>
            {w.username}
            <button onClick={() => delWorker(w.id)} style={{ marginLeft: 8 }}>
              Elimina
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
