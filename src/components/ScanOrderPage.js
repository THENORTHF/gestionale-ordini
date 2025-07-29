import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Barcode from 'react-barcode';
import domtoimage from 'dom-to-image-more';
import { AuthContext } from '../AuthContext';

const API = process.env.REACT_APP_API_URL;

export default function ScanOrderPage() {
  const { barcode: scannedBarcode } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [workStatuses, setWorkStatuses] = useState([
    "In attesa", "In lavorazione 1", "In lavorazione 2", "Pronto", "Consegnato"
  ]);

  // 1) Fetch dettaglio ordine
  useEffect(() => {
    if (!scannedBarcode) {
      setError("Barcode mancante!");
      return;
    }
    fetch(`${API}/api/orders/barcode/${scannedBarcode}`)
      .then(res => {
        if (!res.ok) throw new Error('Ordine non trovato');
        return res.json();
      })
      .then(o => {
        setOrder(o);
        setStatus(o.status || 'In attesa');
        setNotes(o.custom_notes || '');

        // Dopo aver caricato l'ordine, carica anche gli stati custom
        fetch(`${API}/api/work-statuses?productTypeId=${o.product_type_id}&subCategoryId=${o.sub_category_id || ""}`)
          .then(r => r.json())
          .then(data => {
            if (data.status_list) {
              setWorkStatuses(JSON.parse(data.status_list));
            }
          })
          .catch(() => {}); // Se errore, usa default
      })
      .catch(err => {
        setError('Errore nel recupero dell’ordine');
      });
  }, [scannedBarcode]);

  // 2) Salvataggio modifiche
  const handleSave = async () => {
    if (!order) return;
    try {
      const res = await fetch(
        `${API}/api/orders/${order.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            custom_notes: notes,
            workerId: user.id
          })
        }
      );
      if (!res.ok) throw new Error();
      navigate('/list');
    } catch {
      setError('Impossibile salvare le modifiche');
    }
  };

  // 3) Stampa / download etichetta (restano uguali)
  const printLabel = () => {
    const el = document.getElementById('scan-label');
    if (!el) return;
    const w = window.open('', '', 'width=400,height=200');
    w.document.write(`
      <html><head><title>Etichetta Ordine ${order.id}</title></head><body style="margin:0;">
      ${el.outerHTML}
      <script>window.onload=()=>{window.print();window.close();};</script>
      </body></html>
    `);
    w.document.close();
  };

  const downloadLabel = async () => {
    const node = document.getElementById('scan-label');
    if (!node) return;
    const scale = 2;
    try {
      const dataUrl = await domtoimage.toPng(node, {
        bgcolor: '#fff',
        width: node.offsetWidth * scale,
        height: node.offsetHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `etichetta-${order.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setError('Errore download etichetta');
    }
  };

  // --- RENDER ---

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate('/list')}>Torna agli ordini</button>
      </div>
    );
  }

  if (!order) {
    return <p style={{ padding: 20 }}>Caricamento ordine…</p>;
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>Ordine #{order.id}</h2>
      <p><strong>Cliente:</strong> {order.customer_name}</p>
      <p>
        <strong>Tipo:</strong> {order.product_type_name}
        {order.sub_category_name && ` (${order.sub_category_name})`}
      </p>
      <p><strong>Quantità:</strong> {order.quantity}</p>
      <p><strong>Dimensioni:</strong> {order.dimensions}</p>
      <p><strong>Colore:</strong> {order.color}</p>

      <div style={{ margin: '20px 0' }}>
        <label>
          Stato:
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{ marginLeft: 8, padding: 4 }}
          >
            {workStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>
          Note di lavorazione:
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            style={{ width: '100%', marginTop: 4, padding: 4 }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={printLabel} style={{ flex: 1 }}>Stampa Etichetta</button>
        <button onClick={downloadLabel} style={{ flex: 1 }}>Scarica Etichetta</button>
      </div>

      <button onClick={handleSave} style={{ padding: '8px 16px' }}>
        Salva e torna agli ordini
      </button>

      {/* Etichetta nascosta */}
      <div
        id="scan-label"
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '300px',
          minHeight: '180px',
          padding: '12px',
          boxSizing: 'border-box',
          border: '1px solid #000',
          background: '#fff',
          fontSize: '13px',
          overflow: 'visible'
        }}
      >
        <div><strong>Cliente:</strong> {order.customer_name}</div>
        <div><strong>Tipo:</strong> {order.product_type_name}</div>
        <div><strong>Sottocat.:</strong> {order.sub_category_name}</div>
        <div><strong>Colore:</strong> {order.color}</div>
        <div style={{ margin: '4px 0' }}><strong>Dim:</strong> {order.dimensions}</div>
        <div
          style={{
            alignSelf: 'center',
            position: 'relative',
            left: '-20px'
          }}
        >
          <Barcode
            value={order.barcode}
            format="CODE128"
            width={2}
            height={60}
            displayValue={false}
          />
        </div>
      </div>
    </div>
  );
}
