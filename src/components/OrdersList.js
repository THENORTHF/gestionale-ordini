import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import domtoimage from "dom-to-image-more";
import QRCode from "react-qr-code";

const API = process.env.REACT_APP_API_URL;

export default function OrdersList() {
  const [ordini, setOrdini] = useState([]);
  const [selezionati, setSelezionati] = useState(new Set());
  const [filters, setFilters] = useState({
    cliente: "",
    tipo: "",
    colore: "",
    dim: "",
    startDate: "",
    endDate: ""
  });
  const [workStatusMap, setWorkStatusMap] = useState({}); // <-- CACHE STATI

  // 1) Carica ordini
  useEffect(() => {
    fetch(`${API}/api/orders`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setOrdini(data) : setOrdini([]))
      .catch(console.error);
  }, []);

  // 1b) Carica STATI personalizzati (cache per chiave prodotto+sottocategoria)
  useEffect(() => {
    if (!ordini.length) return;
    const toFetch = [];
    const keyList = [];

    ordini.forEach(o => {
      // Usa gli ID, non i nomi
      const key = `${o.product_type_name || o.product_type_id}_${o.sub_category_name || o.sub_category_id || ""}`;
      keyList.push(key);
      if (!workStatusMap[key]) {
        toFetch.push({
          productTypeId: o.product_type_id,
          subCategoryId: o.sub_category_id
        });
      }
    });

    if (!toFetch.length) return;
    (async () => {
      const updated = { ...workStatusMap };
      for (const k of toFetch) {
        // Prendi la lista dal backend (se non esiste, torna default)
        const res = await fetch(
          `${API}/api/work-statuses?productTypeId=${k.productTypeId}&subCategoryId=${k.subCategoryId || ""}`
        );
        const data = await res.json();
        const list = data.status_list
          ? JSON.parse(data.status_list)
          : ["In attesa", "In lavorazione 1", "In lavorazione 2", "Pronto", "Consegnato"];
        const cacheKey = `${k.productTypeId}_${k.subCategoryId || ""}`;
        updated[cacheKey] = list;
      }
      setWorkStatusMap(updated);
    })();
    // eslint-disable-next-line
  }, [ordini]);

  // 2) Filtri
  const filtrati = ordini.filter(o => {
    const created = new Date(o.created_at).toISOString().slice(0, 10);
    return (
      (!filters.cliente   || o.customer_name?.toLowerCase().includes(filters.cliente.toLowerCase())) &&
      (!filters.tipo      || o.product_type_name?.toLowerCase().includes(filters.tipo.toLowerCase())) &&
      (!filters.colore    || o.color?.toLowerCase().includes(filters.colore.toLowerCase())) &&
      (!filters.dim       || o.dimensions?.toLowerCase().includes(filters.dim.toLowerCase())) &&
      (!filters.startDate || created >= filters.startDate) &&
      (!filters.endDate   || created <= filters.endDate)
    );
  });

  // 3) Toggle selezione
  const toggleSelezione = id => {
    const nuovo = new Set(selezionati);
    if (nuovo.has(id)) nuovo.delete(id);
    else nuovo.add(id);
    setSelezionati(nuovo);
  };

  // 4) Aggiorna stato via API
  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
      setOrdini(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch {
      alert("Impossibile aggiornare lo stato");
    }
  };

  // 5) Print / Download label
  const printLabel = id => {
    const el = document.getElementById(`label-${id}`);
    if (!el) return;
    const w = window.open("", "_blank", "width=300,height=200");
    w.document.write(`
      <html><head><title>Etichetta ${id}</title></head>
      <body style="margin:0;">${el.outerHTML}
      <script>window.onload=()=>{window.print();window.close();};</script>
      </body></html>
    `);
    w.document.close();
  };

  const azioneMultipla = async azione => {
    const arr = Array.from(selezionati);
    if (!arr.length) return;

    if (azione === "stampa") {
      arr.forEach(printLabel);
    }
    if (azione === "scarica") {
      for (const id of arr) {
        const node = document.getElementById(`label-${id}`);
        if (!node) continue;
        await new Promise(r => setTimeout(r, 200));
        const scale = 2;
        const dataUrl = await domtoimage.toPng(node, {
          bgcolor: "#fff",
          width: node.offsetWidth * scale,
          height: node.offsetHeight * scale,
          style: { transform: `scale(${scale})`, transformOrigin: "top left" }
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `etichetta-${id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
    if (azione === "elimina") {
      await Promise.all(arr.map(id =>
        fetch(`${API}/api/orders/${id}`, { method: "DELETE" })
      ));
      setOrdini(prev => prev.filter(o => !selezionati.has(o.id)));
      setSelezionati(new Set());
    }
  };

  // --- RENDER
  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: 20 }}>
      <h1>Elenco Ordini</h1>

      {/* Filtri */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {["cliente","tipo","colore","dim"].map(key => (
          <input
            key={key}
            placeholder={key.charAt(0).toUpperCase()+key.slice(1)}
            value={filters[key]}
            onChange={e => setFilters({ ...filters, [key]: e.target.value })}
          />
        ))}
        <input type="date" value={filters.startDate}
          onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" value={filters.endDate}
          onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
      </div>

      {/* Azioni Multiple */}
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => azioneMultipla("stampa")}>Stampa</button>
        <button onClick={() => azioneMultipla("scarica")} style={{ marginLeft: 8 }}>
          Scarica
        </button>
        <button onClick={() => azioneMultipla("elimina")} style={{ marginLeft: 8 }}>
          Elimina
        </button>
      </div>

      {/* Tabella */}
      <table width="100%" border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th><input
              type="checkbox"
              onChange={e =>
                setSelezionati(e.target.checked
                  ? new Set(filtrati.map(o => o.id))
                  : new Set()
                )
              }
            /></th>
            <th>ID</th><th>Cliente</th><th>Tel</th><th>Indirizzo</th><th>Tipo</th>
            <th>Sottocat.</th><th>Qty</th><th>Colore</th><th>Dim</th><th>Prezzo</th>
            <th>Note</th><th>Data</th><th>Stato</th><th>QR</th>
          </tr>
        </thead>
        <tbody>
          {filtrati.map(o => {
            // Chiave cache: usa gli ID!
            const cacheKey = `${o.product_type_id}_${o.sub_category_id || ""}`;
            const statusList = workStatusMap[cacheKey] || [
              "In attesa",
              "In lavorazione 1",
              "In lavorazione 2",
              "Pronto",
              "Consegnato"
            ];
            return (
              <tr key={o.id} style={{
                backgroundColor: o.status?.includes("In lavorazione") ? "#fff9c4" : undefined
              }}>
                <td>
                  <input
                    type="checkbox"
                    checked={selezionati.has(o.id)}
                    onChange={() => toggleSelezione(o.id)}
                  />
                </td>
                <td>{o.id}</td>
                <td>{o.customer_name}</td>
                <td>{o.phone_number||"-"}</td>
                <td>{o.address||"-"}</td>
                <td>{o.product_type_name}</td>
                <td>{o.sub_category_name}</td>
                <td>{o.quantity}</td>
                <td>{o.color}</td>
                <td>{o.dimensions}</td>
                <td>€{Number(o.price_total).toFixed(2)}</td>
                <td>{o.custom_notes}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={e => updateStatus(o.id, e.target.value)}
                  >
                    {statusList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td style={{ textAlign: "center" }}>
                  <Link to={`/scan/${o.barcode}`}>
                    <QRCode value={o.barcode} size={80} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Etichette nascoste */}
      {filtrati.map(o => (
        <div
          key={o.id}
          id={`label-${o.id}`}
          style={{
            position:"absolute", top:"-9999px", left:"-9999px",
            width:"300px", minHeight:"180px",
            padding:"12px", boxSizing:"border-box",
            border:"1px solid #000", background:"#fff", fontSize:"13px"
          }}
        >
          <div><strong>Cliente:</strong> {o.customer_name}</div>
          <div><strong>Tel:</strong> {o.phone_number||"-"}</div>
          <div><strong>Indirizzo:</strong> {o.address||"-"}</div>
          <div><strong>Tipo:</strong> {o.product_type_name}</div>
          <div><strong>Sottocat.:</strong> {o.sub_category_name}</div>
          <div><strong>Colore:</strong> {o.color}</div>
          <div style={{margin:"4px 0"}}><strong>Dim:</strong> {o.dimensions}</div>
          <div style={{textAlign:"center", marginTop:8}}>
            <QRCode value={o.barcode} size={120} />
          </div>
        </div>
      ))}
    </div>
  );
}
