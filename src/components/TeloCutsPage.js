import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import domtoimage from "dom-to-image-more";
import TeloCutCard from "./TeloCutCard";
import "./TeloCutsPage.css";

const API = process.env.REACT_APP_API_URL;
const initialForm = {
  customerName: "",
  widthMm: "",
  heightMm: "",
  processingMode: "normale",
  teloType: "001",
  note: ""
};

export default function TeloCutsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [keepHeight, setKeepHeight] = useState(false);
  const [keepType, setKeepType] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [gallery, setGallery] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [scanValue, setScanValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const cardRef = useRef(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (status) query.set("status", status);
      const res = await fetch(`${API}/api/telo-cuts?${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore caricamento");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const updateForm = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const saveManual = async () => {
    if (!form.customerName.trim() || !(Number(form.widthMm) > 0) || !(Number(form.heightMm) > 0)) {
      setMessage("Inserisci cliente, larghezza e altezza.");
      return;
    }
    try {
      const res = await fetch(`${API}/api/telo-cuts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore salvataggio");
      setMessage("Misura salvata e barcode generato.");
      setForm(current => ({
        ...initialForm,
        heightMm: keepHeight ? current.heightMm : "",
        teloType: keepType ? current.teloType : "001",
        processingMode: current.processingMode
      }));
      await loadItems();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const toggle = id => setSelected(current => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const allVisibleSelected = items.length > 0 && items.every(item => selected.has(item.id));
  const toggleAll = () => setSelected(allVisibleSelected ? new Set() : new Set(items.map(item => item.id)));

  const markSelectedCut = async () => {
    if (!selected.size) return setMessage("Seleziona almeno un telo.");
    const res = await fetch(`${API}/api/telo-cuts/mark-cut`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] })
    });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Errore aggiornamento");
    setMessage(`${data.length} teli segnati come tagliati.`);
    setSelected(new Set());
    loadItems();
  };

  const openGallery = (list, startId = null) => {
    if (!list.length) return setMessage("Nessun barcode da visualizzare.");
    setGallery(list);
    const index = startId ? list.findIndex(item => item.id === startId) : 0;
    setGalleryIndex(index >= 0 ? index : 0);
  };

  const selectedItems = useMemo(() => items.filter(item => selected.has(item.id)), [items, selected]);
  const currentGalleryItem = gallery[galleryIndex];

  const handleScan = async event => {
    event.preventDefault();
    const value = scanValue.trim();
    if (!value) return;
    try {
      const res = await fetch(`${API}/api/telo-cuts/barcode/${encodeURIComponent(value)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Barcode non trovato");
      openGallery(data);
      setScanValue("");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const downloadCurrent = async () => {
    if (!cardRef.current || !currentGalleryItem) return;
    const dataUrl = await domtoimage.toPng(cardRef.current, { bgcolor: "white", quality: 1 });
    const link = document.createElement("a");
    link.download = `telo-${currentGalleryItem.id}-${currentGalleryItem.barcode_value}.png`;
    link.href = dataUrl;
    link.click();
  };

  const exportCsv = () => {
    const rows = selectedItems.length ? selectedItems : items;
    const escape = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [
      ["Stato","ID","Ordine","Cliente","Larghezza input","Altezza input","Larghezza taglio","Altezza taglio","Tipo","Nota","Barcode","Data"],
      ...rows.map(item => [item.status,item.id,item.order_id,item.customer_name,item.input_width_mm,item.input_height_mm,item.cut_width_mm,item.cut_height_mm,item.telo_type,item.note,item.barcode_value,item.created_at])
    ].map(row => row.map(escape).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = "taglio-teli.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importOrders = async () => {
    if (!window.confirm("Generare i barcode mancanti dagli ordini TSB e Zanzariera già esistenti?")) return;
    const res = await fetch(`${API}/api/telo-cuts/import-orders`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Errore importazione");
    setMessage(`${data.created} barcode mancanti generati dagli ordini.`);
    loadItems();
  };

  const removeItem = async id => {
    if (!window.confirm("Nascondere questo telo dall’archivio?")) return;
    const res = await fetch(`${API}/api/telo-cuts/${id}`, { method: "DELETE" });
    if (!res.ok) return setMessage("Impossibile eliminare il telo.");
    setSelected(current => { const next = new Set(current); next.delete(id); return next; });
    loadItems();
  };

  const editItem = async item => {
    const customerName = window.prompt("Nome cliente", item.customer_name);
    if (customerName === null) return;
    const widthMm = window.prompt("Larghezza inserita (mm)", item.input_width_mm);
    if (widthMm === null) return;
    const heightMm = window.prompt("Altezza inserita (mm)", item.input_height_mm);
    if (heightMm === null) return;
    const teloType = window.prompt("Tipo/modello (001 o 002)", item.telo_type);
    if (teloType === null) return;
    const note = window.prompt("Nota", item.note || "");
    if (note === null) return;
    const res = await fetch(`${API}/api/telo-cuts/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, widthMm, heightMm, teloType, note })
    });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Impossibile modificare il telo.");
    setMessage("Misura e barcode aggiornati.");
    loadItems();
  };

  return (
    <main className="telo-page">
      <header className="telo-page-header">
        <div>
          <p className="telo-kicker">ITALFLEX</p>
          <h1>Taglio teli</h1>
          <p>Inserimento manuale e barcode automatici dagli ordini.</p>
        </div>
        <button className="secondary" onClick={importOrders}>Importa ordini esistenti</button>
      </header>

      {message && <div className="telo-message" onClick={() => setMessage("")}>{message}</div>}

      <section className="telo-manual-panel">
        <div className="telo-mode-tabs">
          <button className={form.processingMode === "normale" ? "active" : ""} onClick={() => updateForm("processingMode", "normale")}>Misura normale</button>
          <button className={form.processingMode === "zanzariera" ? "active" : ""} onClick={() => updateForm("processingMode", "zanzariera")}>Misura zanzariera</button>
        </div>
        <div className="telo-form-grid">
          <label>Nome cliente<input value={form.customerName} onChange={e => updateForm("customerName", e.target.value)} /></label>
          <label>Larghezza (mm)<input type="number" value={form.widthMm} onChange={e => updateForm("widthMm", e.target.value)} /></label>
          <label>Altezza (mm)<input type="number" value={form.heightMm} onChange={e => updateForm("heightMm", e.target.value)} /></label>
          <label>{form.processingMode === "zanzariera" ? "Modello" : "Tipo telo"}
            <select value={form.teloType} onChange={e => updateForm("teloType", e.target.value)}>
              <option value="001">001</option><option value="002">002</option>
            </select>
          </label>
          <label className="wide">Nota<input value={form.note} onChange={e => updateForm("note", e.target.value)} /></label>
        </div>
        {form.processingMode === "zanzariera" && <p className="calculation-note">Modello 001: larghezza −33 mm. Modello 002: larghezza −25 mm. L’altezza viene arrotondata secondo le regole della vecchia app.</p>}
        <div className="telo-form-actions">
          <label><input type="checkbox" checked={keepHeight} onChange={e => setKeepHeight(e.target.checked)} /> Altezza fissa</label>
          <label><input type="checkbox" checked={keepType} onChange={e => setKeepType(e.target.checked)} /> Tipo fisso</label>
          <button className="primary" onClick={saveManual}>Salva e genera barcode</button>
        </div>
      </section>

      <section className="telo-toolbar">
        <form onSubmit={handleScan} className="scan-form">
          <input autoComplete="off" placeholder="Scansiona o digita il barcode" value={scanValue} onChange={e => setScanValue(e.target.value)} />
          <button>Apri</button>
        </form>
        <input placeholder="Cerca cliente, barcode o nota" value={search} onChange={e => setSearch(e.target.value)} />
        <select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tutti gli stati</option><option value="nuovo">Da tagliare</option><option value="tagliato">Tagliati</option></select>
      </section>

      <section className="telo-batch-actions">
        <label><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} /> Seleziona tutti</label>
        <span>{selected.size} selezionati</span>
        <button className="success" onClick={markSelectedCut}>Segna come tagliati</button>
        <button onClick={() => openGallery(selectedItems.length ? selectedItems : items)}>Visualizza e scorri</button>
        <button onClick={exportCsv}>Esporta CSV</button>
      </section>

      <section className="telo-table-wrap">
        {loading ? <p>Caricamento…</p> : (
          <table className="telo-table">
            <thead><tr><th></th><th>Stato</th><th>Cliente</th><th>Origine</th><th>Misura inserita</th><th>Misura taglio</th><th>Tipo</th><th>Nota</th><th>Barcode</th><th></th></tr></thead>
            <tbody>{items.map(item => (
              <tr key={item.id} className={item.status === "tagliato" ? "cut" : ""}>
                <td><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} /></td>
                <td><span className={`status ${item.status}`}>{item.status === "tagliato" ? "Tagliato" : "Da tagliare"}</span></td>
                <td><strong>{item.customer_name}</strong>{item.order_id && <small>Ordine #{item.order_id} · {item.piece_number}</small>}</td>
                <td>{item.source_mode === "ordine" ? `${item.product_type_name || "Ordine"} / ${item.sub_category_name || ""}` : "Manuale"}</td>
                <td>{item.input_width_mm} × {item.input_height_mm} mm</td>
                <td><strong>{item.cut_width_mm} × {item.cut_height_mm} mm</strong></td>
                <td>{item.telo_type}</td><td>{item.note || "—"}</td><td><code>{item.barcode_value}</code></td>
                <td className="row-actions"><button onClick={() => openGallery(items, item.id)}>Apri</button><button onClick={() => editItem(item)}>Modifica</button><button className="danger-link" onClick={() => removeItem(item.id)}>Elimina</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>

      {currentGalleryItem && (
        <div className="telo-modal" role="dialog" aria-modal="true">
          <div className="telo-modal-content">
            <button className="modal-close" onClick={() => setGallery([])}>×</button>
            <div className="gallery-count">{galleryIndex + 1} di {gallery.length}</div>
            <TeloCutCard ref={cardRef} item={currentGalleryItem} />
            <div className="gallery-actions">
              <button disabled={galleryIndex === 0} onClick={() => setGalleryIndex(i => i - 1)}>← Precedente</button>
              <button onClick={downloadCurrent}>Scarica PNG</button>
              <button className="success" onClick={async () => { setSelected(new Set([currentGalleryItem.id])); await fetch(`${API}/api/telo-cuts/mark-cut`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ids:[currentGalleryItem.id]}) }); loadItems(); }}>Segna tagliato</button>
              <button disabled={galleryIndex === gallery.length - 1} onClick={() => setGalleryIndex(i => i + 1)}>Successivo →</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
