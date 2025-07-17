// src/components/OrderStatusPage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function OrderStatusPage() {
  const { barcode } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes]   = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/orders/barcode/${barcode}`)
      .then(res => res.json())
      .then(o => {
        setOrder(o);
        setStatus(o.status);
        setNotes(o.custom_notes || "");
      })
      .catch(console.error);
  }, [barcode]);

  const onSave = async () => {
    await fetch(`http://localhost:5000/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, custom_notes: notes })
    });
    navigate("/orders");
  };

  if (!order) return <div>Caricamento…</div>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>Ordine #{order.id}</h2>
      <p><strong>Cliente:</strong> {order.customer_name}</p>
      <p><strong>Barcode:</strong> {order.barcode}</p>
      {/* altri dettagli se vuoi */}
      
      <div style={{ marginTop: 20 }}>
        <label>
          Stato:
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option>In lavorazione 1</option>
            <option>In lavorazione 2</option>
            <option>Completato</option>
            {/* …altre opzioni */}
          </select>
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>
          Note di lavorazione:
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            style={{ width: "100%", marginTop: 4 }}
          />
        </label>
      </div>

      <button onClick={onSave} style={{ marginTop: 16 }}>
        Salva modifiche e torna indietro
      </button>
    </div>
  );
}
