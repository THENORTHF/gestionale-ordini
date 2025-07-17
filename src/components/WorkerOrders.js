// WorkerOrders.js – Pagina limitata per operai autenticati
import React, { useEffect, useState } from "react";

export default function WorkerOrders({ worker }) {
  const [ordini, setOrdini] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/orders")
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setOrdini(data) : [])
      .catch(console.error);
  }, []);

  const aggiornaStato = async (id, nuovoStato) => {
    try {
      await fetch(`http://localhost:5000/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nuovoStato, workerId: worker.id })
      });
      setOrdini(prev => prev.map(o => o.id === id ? { ...o, status: nuovoStato, assigned_worker_name: worker.username } : o));
    } catch (err) {
      console.error("Errore aggiornamento stato", err);
    }
  };

  const stampa = async (barcode, id) => {
    window.open(`/barcode/${barcode}`, "_blank");
    await aggiornaStato(id, "In lavorazione 1");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Ordini – Accesso Operaio: {worker.username}</h2>
      <table width="100%" border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th><th>Cliente</th><th>Tipo</th><th>Quantità</th><th>Stato</th><th>Operaio</th><th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {ordini.map(o => (
            <tr key={o.id} style={{ backgroundColor: o.status === "In lavorazione 1" ? "#fff89a" : "white" }}>
              <td>{o.id}</td>
              <td>{o.customer_name}</td>
              <td>{o.product_type_name}</td>
              <td>{o.quantity}</td>
              <td>{o.status}</td>
              <td>{o.assigned_worker_name || "-"}</td>
              <td>
                <select
                  value={o.status || "In attesa"}
                  onChange={e => aggiornaStato(o.id, e.target.value)}
                >
                  <option>In attesa</option>
                  <option>In lavorazione 1</option>
                  <option>In lavorazione 2</option>
                  <option>Pronto</option>
                  <option>Consegnato</option>
                </select>
                <button onClick={() => stampa(o.barcode, o.id)} style={{ marginLeft: 8 }}>
                  Stampa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
