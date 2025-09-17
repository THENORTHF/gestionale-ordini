import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import domtoimage from "dom-to-image-more";
import QRCode from "react-qr-code";

const API = process.env.REACT_APP_API_URL;

// helper ruolo (semplice): usa username salvato al login
const isAdmin = () => localStorage.getItem("username") === "admin";

export default function OrdersList() {
  const [ordini, setOrdini] = useState([]);
  const [selezionati, setSelezionati] = useState(new Set());
  const [filters, setFilters] = useState({
    cliente: "",
    tipo: "",
    sottocat: "", // <-- nuovo filtro sottocategoria
    colore: "",
    dim: "",
    startDate: "",
    endDate: ""
  });
  const [workStatusMap, setWorkStatusMap] = useState({});

  // drag selection
  const [isDragging, setIsDragging] = useState(false);
  const dragTargetStateRef = useRef(true); // true = seleziona, false = deseleziona durante il drag

  // carica ordini
  useEffect(() => {
    fetch(`${API}/api/orders`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setOrdini(data) : setOrdini([]))
      .catch(console.error);
  }, []);

  // carica stati lavorazione (cache per coppia tipo+sottocat)
  useEffect(() => {
    if (!ordini.length) return;
    const toFetch = [];
    ordini.forEach(o => {
      const key = `${o.product_type_id}_${o.sub_category_id || ""}`;
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
        if (!k.productTypeId) continue;
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
  }, [ordini, workStatusMap]);

  // opzioni sottocategoria per filtro (derivate dai dati)
  const sottocategorieOptions = useMemo(() => {
    const set = new Set();
    ordini.forEach(o => {
      if (o.sub_category_name) set.add(o.sub_category_name);
    });
    return Array.from(set).sort();
  }, [ordini]);

  // lista filtrata
  const filtrati = useMemo(() => {
    return ordini.filter(o => {
      const created = new Date(o.created_at).toISOString().slice(0, 10);
      return (
        (!filters.cliente   || o.customer_name?.toLowerCase().includes(filters.cliente.toLowerCase())) &&
        (!filters.tipo      || o.product_type_name?.toLowerCase().includes(filters.tipo.toLowerCase())) &&
        (!filters.sottocat  || o.sub_category_name === filters.sottocat) &&
        (!filters.colore    || o.color?.toLowerCase().includes(filters.colore.toLowerCase())) &&
        (!filters.dim       || o.dimensions?.toLowerCase().includes(filters.dim.toLowerCase())) &&
        (!filters.startDate || created >= filters.startDate) &&
        (!filters.endDate   || created <= filters.endDate)
      );
    });
  }, [ordini, filters]);

  // selezione toggle
  const toggleSelezione = id => {
    const nuovo = new Set(selezionati);
    if (nuovo.has(id)) nuovo.delete(id);
    else nuovo.add(id);
    setSelezionati(nuovo);
  };

  // drag: mousedown su riga
  const handleRowMouseDown = (id) => {
    const currentlySelected = selezionati.has(id);
    dragTargetStateRef.current = !currentlySelected; // se non era selezionata, drag seleziona; se era, drag deseleziona
    setIsDragging(true);

    const nuovo = new Set(selezionati);
    if (dragTargetStateRef.current) nuovo.add(id);
    else nuovo.delete(id);
    setSelezionati(nuovo);
  };

  // drag: mouseenter su riga
  const handleRowMouseEnter = (id) => {
    if (!isDragging) return;
    const nuovo = new Set(selezionati);
    if (dragTargetStateRef.current) nuovo.add(id);
    else nuovo.delete(id);
    setSelezionati(nuovo);
  };

  // drag: mouseup globale
  useEffect(() => {
    const onUp = () => setIsDragging(false);
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

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

  const markDownloaded = async id => {
    try {
      const res = await fetch(`${API}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Scaricato" })
      });
      if (!res.ok) throw new Error();
      setOrdini(prev => prev.map(o => o.id === id ? { ...o, status: "Scaricato" } : o));
    } catch {}
  };

  const printLabel = async id => {
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
    await markDownloaded(id);
  };

  const azioneMultipla = async azione => {
    const arr = Array.from(selezionati);
    if (!arr.length) return;

    if (azione === "stampa") {
      for (const id of arr) await printLabel(id);
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
        await markDownloaded(id);
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

  // PATCH manual price (solo admin)
  async function patchManualPrice(id, value) {
    try {
      const body = { manualPrice: value === "" ? null : Number(value) };
      const res = await fetch(`${API}/api/orders/${id}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Errore aggiornamento prezzo");
      }
      setOrdini(prev => prev.map(o => {
        if (o.id !== id) return o;
        const newManual = (value === "" ? null : Number(value));
        const eff = (newManual != null) ? newManual : Number(o.price_total || 0);
        return { ...o, manual_price: newManual, effective_price: eff };
      }));
    } catch (e) {
      alert(e.message || "Errore aggiornamento prezzo");
    }
  }

  // ESPORTA selezionati → CSV (compatibile Numbers/Excel)
  const exportSelezionatiCSV = () => {
    const ids = Array.from(selezionati);
    if (!ids.length) {
      alert("Seleziona almeno un ordine da esportare.");
      return;
    }
    const rows = filtrati.filter(o => selezionati.has(o.id));

    // definisci le colonne che vuoi esportare
    const headers = [
      "ID",
      "Cliente",
      "Telefono",
      "Indirizzo",
      "Tipo",
      "Sottocategoria",
      "Qty",
      "Colore",
      "Dimensioni",
      "Prezzo_calcolato",
      "Prezzo_manuale",
      "Prezzo_effettivo",
      "Note",
      "Data",
      "Stato",
      "Barcode"
    ];

    const csvLines = [headers.join(",")];
    rows.forEach(o => {
      const prezzoCalcolato = Number(o.price_total || 0);
      const prezzoManuale = o.manual_price != null ? Number(o.manual_price) : null;
      const prezzoEff = prezzoManuale != null ? prezzoManuale :
                        Number(o.effective_price != null ? o.effective_price : o.price_total || 0);

      const line = [
        o.id,
        csvEscape(o.customer_name),
        csvEscape(o.phone_number || ""),
        csvEscape(o.address || ""),
        csvEscape(o.product_type_name || ""),
        csvEscape(o.sub_category_name || ""),
        o.quantity ?? 1,
        csvEscape(o.color || ""),
        csvEscape(o.dimensions || ""),
        prezzoCalcolato.toFixed(2),
        prezzoManuale != null ? prezzoManuale.toFixed(2) : "",
        prezzoEff.toFixed(2),
        csvEscape(o.custom_notes || ""),
        new Date(o.created_at).toLocaleDateString(),
        csvEscape(o.status || ""),
        csvEscape(o.barcode || "")
      ].join(",");
      csvLines.push(line);
    });

    const csvContent = "\ufeff" + csvLines.join("\n"); // BOM per Numbers/Excel
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ordini-selezionati-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const csvEscape = (value) => {
    const s = String(value ?? "");
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  // UI
  return (
    <div style={{ maxWidth: 1100, margin: "auto", padding: 20 }}>
      <h1>Elenco Ordini</h1>

      {/* FILTRI */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <input
          placeholder="Cliente"
          value={filters.cliente}
          onChange={e => setFilters({ ...filters, cliente: e.target.value })}
        />
        <input
          placeholder="Tipo"
          value={filters.tipo}
          onChange={e => setFilters({ ...filters, tipo: e.target.value })}
        />
        {/* filtro sottocategoria */}
        <select
          value={filters.sottocat}
          onChange={e => setFilters({ ...filters, sottocat: e.target.value })}
        >
          <option value="">Tutte le sottocategorie</option>
          {sottocategorieOptions.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <input
          placeholder="Colore"
          value={filters.colore}
          onChange={e => setFilters({ ...filters, colore: e.target.value })}
        />
        <input
          placeholder="Dim"
          value={filters.dim}
          onChange={e => setFilters({ ...filters, dim: e.target.value })}
        />
        <input
          type="date"
          value={filters.startDate}
          onChange={e => setFilters({ ...filters, startDate: e.target.value })}
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={e => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>

      {/* AZIONI */}
      <div style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => azioneMultipla("stampa")}>Stampa</button>
        <button onClick={() => azioneMultipla("scarica")}>Scarica</button>
        <button onClick={() => azioneMultipla("elimina")}>Elimina</button>
        <button onClick={exportSelezionatiCSV} style={{ marginLeft: "auto" }}>
          Esporta selezionati (CSV)
        </button>
      </div>

      {/* TABELLA */}
      <table width="100%" border="1" cellPadding="6" style={{ borderCollapse: "collapse", userSelect: "none" }}>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={e =>
                  setSelezionati(e.target.checked
                    ? new Set(filtrati.map(o => o.id))
                    : new Set()
                  )
                }
                checked={filtrati.length > 0 && filtrati.every(o => selezionati.has(o.id))}
                aria-label="Seleziona tutti filtrati"
              />
            </th>
            <th>ID</th>
            <th>Cliente</th>
            <th>Tel</th>
            <th>Indirizzo</th>
            <th>Tipo</th>
            <th>Sottocat.</th>
            <th>Qty</th>
            <th>Colore</th>
            <th>Dim</th>
            {isAdmin() ? <th>Prezzo (Manuale / Eff.)</th> : <th>Prezzo</th>}
            <th>Note</th>
            <th>Data</th>
            <th>Stato</th>
            <th>QR</th>
          </tr>
        </thead>
        <tbody
          onMouseLeave={() => setIsDragging(false)}
        >
          {filtrati.map(o => {
            const cacheKey = `${o.product_type_id}_${o.sub_category_id || ""}`;
            const statusList = workStatusMap[cacheKey] || [
              "In attesa","In lavorazione 1","In lavorazione 2","Pronto","Consegnato"
            ];
            const effective = (o.manual_price != null)
              ? Number(o.manual_price)
              : Number(o.effective_price != null ? o.effective_price : o.price_total || 0);

            const isRowSelected = selezionati.has(o.id);

            return (
              <tr
                key={o.id}
                style={{
                  backgroundColor: isRowSelected
                    ? "#e0f3ff"
                    : o.status === "Scaricato"
                      ? "orange"
                      : o.status?.includes("In lavorazione")
                        ? "#fff9c4"
                        : undefined,
                  cursor: "default"
                }}
                onMouseDown={() => handleRowMouseDown(o.id)}
                onMouseEnter={() => handleRowMouseEnter(o.id)}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={isRowSelected}
                    onChange={() => toggleSelezione(o.id)}
                    onMouseDown={e => e.stopPropagation()}
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
                {isAdmin() ? (
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={o.manual_price ?? ""}
                        placeholder={o.manual_price == null ? (o.price_total ?? "") : ""}
                        onBlur={(e) => patchManualPrice(o.id, e.target.value)}
                        style={{ width: 120 }}
                        onMouseDown={e => e.stopPropagation()}
                      />
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        eff.: {effective.toFixed(2)} €
                      </div>
                    </div>
                  </td>
                ) : (
                  <td>€{effective.toFixed(2)}</td>
                )}
                <td>{o.custom_notes}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={e => updateStatus(o.id, e.target.value)}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    {statusList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td style={{ textAlign: "center" }}>
                  <Link to={`/scan/${o.barcode}`} onMouseDown={e => e.stopPropagation()}>
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
