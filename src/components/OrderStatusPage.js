// src/components/OrderStatusPage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL;

export default function OrderStatusPage() {
  const { barcode } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes]   = useState("");
  const [statusOptions, setStatusOptions] = useState([
    "In attesa","In lavorazione 1","In lavorazione 2","Pronto","Consegnato"
  ]);
  const [loading, setLoading] = useState(true);

  // 1) Carico ordine per barcode
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/orders/barcode/${barcode}`);
        const o = await res.json();
        setOrder(o);
        setStatus(o.status);
        setNotes(o.custom_notes || "");

        // 2) Carico le possibili opzioni stato (se ho type e sub-cat)
        if (o?.product_type_id) {
          const qs = new URLSearchParams({
            productTypeId: o.product_type_id,
            subCategoryId: o.sub_category_id || ""
          }).toString();
          const wsRes = await fetch(`${API}/api/work-statuses?${qs}`);
          const wsData = await wsRes.json();
          const list = wsData.status_list
            ? JSON.parse(wsData.status_list)
            : ["In attesa","In lavorazione 1","In lavorazione 2","Pronto","Consegnato"];
          setStatusOptions(list);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [barcode]);

  const onSave = async () => {
    if (!order) return;
    // NB: il backend aggiorna solo lo stato (non le note); evito di inviare notes
    await fetch(`${API}/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    navigate("/orders");
  };

  if (loading || !order) return <div>Caricamento…</div>;

  const prezzoCalcolato = Number(order.price_total || 0);
  const prezzoManuale = order.manual_price != null ? Number(order.manual_price) : null;
  const prezzoEffettivo = prezzoManuale != null ? prezzoManuale : prezzoCalcolato;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>Ordine #{order.id}</h2>
      <p><strong>Cliente:</strong> {order.customer_name}</p>
      <p><strong>Barcode:</strong> {order.barcode}</p>

      <div style={{ marginTop: 10 }}>
        <p><strong>Prezzo calcolato:</strong> €{prezzoCalcolato.toFixed(2)}</p>
        {prezzoManuale != null && (
          <p><strong>Prezzo manuale:</strong> €{prezzoManuale.toFixed(2)}</p>
        )}
        <p><strong>Prezzo effettivo:</strong> €{prezzoEffettivo.toFixed(2)}</p>
      </div>

      <div style={{ marginTop: 20 }}>
        <label>
          Stato:
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>
          Note di lavorazione (sola lettura qui):
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            style={{ width: "100%", marginTop: 4 }}
            readOnly
          />
        </label>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          Le note non si aggiornano da questa pagina.
        </div>
      </div>

      <button onClick={onSave} style={{ marginTop: 16 }}>
        Salva stato e torna indietro
      </button>
    </div>
  );
}
