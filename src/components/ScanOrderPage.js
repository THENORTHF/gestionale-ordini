// src/components/ScanOrderPage.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
import domtoimage from 'dom-to-image-more';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { AuthContext } from '../AuthContext';

export default function ScanOrderPage() {
  const navigate        = useNavigate();
  const { user }        = useContext(AuthContext);
  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [order, setOrder]   = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes]   = useState('');
  const [error, setError]   = useState('');
  const videoRef         = useRef(null);
  const codeReader       = useRef(new BrowserMultiFormatReader());

  // 1) Scansione camera
  useEffect(() => {
    if (scannedBarcode) return;

    // prima prendo i device disponibili
    BrowserMultiFormatReader
      .listVideoInputDevices()
      .then(devices => {
        if (devices.length === 0) throw new Error('Nessuna camera trovata');
        // usa il primo device (tipicamente la back camera sui telefoni)
        return codeReader.current.decodeOnceFromVideoDevice(
          devices[0].deviceId,
          videoRef.current
        );
      })
      .then(result => {
        setScannedBarcode(result.text);
      })
      .catch(err => {
        console.error(err);
        setError('Impossibile accedere alla fotocamera o leggere il barcode');
      });

    return () => {
      codeReader.current.reset();
    };
  }, [scannedBarcode]);

  // 2) Fetch dettaglio ordine
  useEffect(() => {
    if (!scannedBarcode) return;
    fetch(`http://localhost:5000/api/orders/barcode/${scannedBarcode}`)
      .then(res => {
        if (!res.ok) throw new Error('Ordine non trovato');
        return res.json();
      })
      .then(o => {
        setOrder(o);
        setStatus(o.status || 'In attesa');
        setNotes(o.custom_notes || '');
      })
      .catch(err => {
        console.error(err);
        setError('Errore nel recupero dell’ordine');
      });
  }, [scannedBarcode]);

  // 3) Salvataggio modifiche
  const handleSave = async () => {
    if (!order) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/orders/${order.id}/status`,
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

  // 4) Stampa / download etichetta
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

  // Fase di scansione
  if (!scannedBarcode) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Inquadra il barcode con la fotocamera</h2>
        <video ref={videoRef} style={{ width: '100%' }} />
      </div>
    );
  }

  // Fase di caricamento ordine
  if (!order) {
    return <p style={{ padding: 20 }}>Caricamento ordine…</p>;
  }

  // Fase dettaglio + form
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
            <option>In attesa</option>
            <option>In lavorazione 1</option>
            <option>In lavorazione 2</option>
            <option>Pronto</option>
            <option>Consegnato</option>
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
