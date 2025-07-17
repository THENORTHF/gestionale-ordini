// src/components/OrdersDashboard.js
import React, { useState, useEffect } from "react";

export default function OrdersDashboard() {
  const [cliente, setCliente] = useState("");
  const [quantita, setQuantita] = useState(1);
  const [productTypes, setProductTypes] = useState([]);
  const [tipoSelezionato, setTipoSelezionato] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [sottocategoria, setSottocategoria] = useState("");
  const [dimensioni, setDimensioni] = useState("");
  const [colore, setColore] = useState("");
  const [personalizzazioni, setPersonalizzazioni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [ordini, setOrdini] = useState([]);

  // Carica tipi prodotto
  useEffect(() => {
    fetch("http://localhost:5000/api/product-types")
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setProductTypes(data) : setProductTypes([]))
      .catch(console.error);
  }, []);

  // Carica sottocategorie al cambio tipo
  useEffect(() => {
    if (!tipoSelezionato) {
      setSubCategories([]);
      setSottocategoria("");
      return;
    }
    fetch(`http://localhost:5000/api/sub-categories?productTypeId=${tipoSelezionato}`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setSubCategories(data) : setSubCategories([]))
      .catch(console.error);
  }, [tipoSelezionato]);

  // Carica ordini esistenti
  useEffect(() => {
    fetch("http://localhost:5000/api/orders")
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setOrdini(data) : setOrdini([]))
      .catch(console.error);
  }, []);

  // Invia nuovo ordine
  const handleSubmit = async () => {
    if (!cliente.trim() || !tipoSelezionato || !dimensioni.trim() || quantita < 1) {
      alert("Compila almeno cliente, tipo, dimensioni e quantità");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: cliente,
          productTypeId: tipoSelezionato,
          subCategoryId: sottocategoria || null,
          dimensions: dimensioni,
          color: colore,
          customNotes: personalizzazioni,
          quantity: quantita,
          phoneNumber: telefono || null,
          address: indirizzo || null
        }),
      });
      if (!res.ok) throw new Error(`Errore ${res.status}`);
      const created = await res.json();
      setOrdini(prev => [created, ...prev]);
      // reset campi
      setCliente("");
      setQuantita(1);
      setTipoSelezionato("");
      setSottocategoria("");
      setDimensioni("");
      setColore("");
      setPersonalizzazioni("");
      setTelefono("");
      setIndirizzo("");
      alert(
        `Ordine aggiunto!\nID: ${created.id}\nPrezzo totale: €${Number(created.price_total).toFixed(2)}`
      );
    } catch (err) {
      console.error(err);
      alert("Impossibile salvare l'ordine: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>Nuovo Ordine</h1>

      <input
        placeholder="Nome Cliente"
        value={cliente}
        onChange={e => setCliente(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />

      <input
        type="number"
        min={1}
        placeholder="Quantità"
        value={quantita}
        onChange={e => setQuantita(Number(e.target.value))}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />

      <select
        value={tipoSelezionato}
        onChange={e => setTipoSelezionato(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      >
        <option value="">Seleziona tipo prodotto</option>
        {productTypes.map(pt => (
          <option key={pt.id} value={pt.id}>{pt.name}</option>
        ))}
      </select>

      {subCategories.length > 0 && (
        <select
          value={sottocategoria}
          onChange={e => setSottocategoria(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        >
          <option value="">Seleziona sottocategoria</option>
          {subCategories.map(sc => (
            <option key={sc.id} value={sc.id}>{sc.name}</option>
          ))}
        </select>
      )}

      <input
        placeholder="Dimensioni (es. 120x240)"
        value={dimensioni}
        onChange={e => setDimensioni(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />

      <input
        placeholder="Colore"
        value={colore}
        onChange={e => setColore(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />

      <input
        placeholder="Personalizzazioni"
        value={personalizzazioni}
        onChange={e => setPersonalizzazioni(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />

      <input
        placeholder="Telefono (opzionale)"
        value={telefono}
        onChange={e => setTelefono(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />

      <input
        placeholder="Indirizzo (opzionale)"
        value={indirizzo}
        onChange={e => setIndirizzo(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 20 }}
      />

      <button
        onClick={handleSubmit}
        style={{ padding: 10, width: "100%", marginBottom: 20 }}
      >
        Salva Ordine
      </button>

      <h2>Ordini Salvati</h2>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {ordini.map(o => (
          <li
            key={o.id}
            style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}
          >
            <strong>ID {o.id}</strong> – Cliente: {o.customer_name}
            {o.phone_number && ` – Tel: ${o.phone_number}`}
            {o.address && ` – Ind: ${o.address}`}
            – Tipo: {o.product_type_name}
            {o.sub_category_name && ` (${o.sub_category_name})`} – Qty: {o.quantity}
            <br />
            Colore: {o.color} – Dim: {o.dimensions}
            <br />
            Note: {o.custom_notes}
            <br />
            <strong>Prezzo:</strong> €{Number(o.price_total).toFixed(2)}
            <div style={{ marginTop: 8 }}>
              <button onClick={() => window.print()} style={{ marginRight: 8 }}>
                Stampa
              </button>
              <button onClick={async () => {
                await fetch(`http://localhost:5000/api/orders/${o.id}`, { method: 'DELETE' });
                setOrdini(prev => prev.filter(x => x.id !== o.id));
              }}>
                Elimina
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
