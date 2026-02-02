// src/components/SettingsPanel.js
import React, { useState, useEffect } from "react";
import WorkersPanel from "./WorkersPanel";
import CustomersPanel from "./CustomersPanel";

const API = process.env.REACT_APP_API_URL;

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState("productTypes");

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <h1>Impostazioni Gestionale</h1>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("productTypes")}>
          Tipi Prodotto
        </button>
        <button onClick={() => setActiveTab("subCategories")}>
          Sottocategorie
        </button>
        <button onClick={() => setActiveTab("colorIncrements")}>
          Colori
        </button>
        <button onClick={() => setActiveTab("priceLists")}>
          Listini
        </button>
        <button onClick={() => setActiveTab("customers")}>
          Clienti
        </button>
        <button onClick={() => setActiveTab("workers")}>
          Operai
        </button>
        <button onClick={() => setActiveTab("workStatuses")}>
          Stati lavorazione
        </button>
      </div>

      {activeTab === "productTypes" && <ProductTypesSection />}
      {activeTab === "subCategories" && <SubCategoriesSection />}
      {activeTab === "colorIncrements" && <ColorIncrementsSection />}
      {activeTab === "priceLists" && <PriceListsSection />}
      {activeTab === "customers" && <CustomersPanel />}
      {activeTab === "workers" && <WorkersPanel />}
      {activeTab === "workStatuses" && <WorkStatusesSection />}
    </div>
  );
}

// --- Tipi Prodotto
function ProductTypesSection() {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch(`${API}/api/product-types`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setItems(data) : setItems([]))
      .catch(console.error);
  }, []);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await fetch(`${API}/api/product-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const created = await res.json();
      setItems([created, ...items]);
      setNewName("");
    } catch (err) {
      console.error(err);
    }
  };


  const remove = async (id) => {
    const ok = window.confirm("Eliminare questo tipo di prodotto? (Se è usato in ordini o sottocategorie potrebbe non essere possibile)");
    if (!ok) return;
    try {
      const res = await fetch(`${API}/api/product-types/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        alert(msg.error || "Impossibile eliminare");
        return;
      }
      setItems(items.filter(x => x.id !== id));
    } catch (err) {
      console.error(err);
      alert("Errore eliminazione");
    }
  };

  return (
    <div>
      <h2>Tipi di Prodotto</h2>
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Nuovo tipo"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={add}>Aggiungi</button>
      </div>
      <ul>
        {items.length > 0
          ? items.map(pt => (
              <li key={pt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span>{pt.name}</span>
                <button onClick={() => remove(pt.id)} style={{ background: "#fee", border: "1px solid #f99" }}>Elimina</button>
              </li>
            ))
          : <li>Nessun tipo disponibile</li>
        }
      </ul>
    </div>
  );
}

// --- Sottocategorie
function SubCategoriesSection() {
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [subs, setSubs] = useState([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch(`${API}/api/product-types`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setTypes(data) : setTypes([]))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedType) return setSubs([]);
    fetch(`${API}/api/sub-categories?productTypeId=${selectedType}`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setSubs(data) : setSubs([]))
      .catch(console.error);
  }, [selectedType]);

  const add = async () => {
    const name = newName.trim();
    if (!name || !selectedType) return;
    try {
      const res = await fetch(`${API}/api/sub-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productTypeId: selectedType, name }),
      });
      const created = await res.json();
      setSubs([created, ...subs]);
      setNewName("");
    } catch (err) {
      console.error(err);
    }
  };


  const removeSub = async (id) => {
    const ok = window.confirm("Eliminare questa sottocategoria? (Se è usata in ordini o listini potrebbe non essere possibile)");
    if (!ok) return;
    try {
      const res = await fetch(`${API}/api/sub-categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        alert(msg.error || "Impossibile eliminare");
        return;
      }
      setSubs(subs.filter(x => x.id !== id));
    } catch (err) {
      console.error(err);
      alert("Errore eliminazione");
    }
  };

  return (
    <div>
      <h2>Sottocategorie</h2>
      <div style={{ marginBottom: 10 }}>
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          style={{ marginRight: 8 }}
        >
          <option value="">Seleziona tipo</option>
          {types.map(pt => (
            <option key={pt.id} value={pt.id}>{pt.name}</option>
          ))}
        </select>
        <input
          placeholder="Nuova sottocategoria"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={add}>Aggiungi</button>
      </div>
      <ul>
        {subs.length > 0
          ? subs.map(sc => (
              <li key={sc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span>{sc.name}</span>
                <button onClick={() => removeSub(sc.id)} style={{ background: "#fee", border: "1px solid #f99" }}>Elimina</button>
              </li>
            ))
          : <li>Nessuna sottocategoria</li>
        }
      </ul>
    </div>
  );
}

// --- Colori
function ColorIncrementsSection() {
  const [colors, setColors] = useState([]);
  const [newColor, setNewColor] = useState("");
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/color-increments`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setColors(data) : setColors([]))
      .catch(console.error);
  }, []);

  const add = async () => {
    const color = newColor.trim();
    if (!color) return;
    try {
      const res = await fetch(`${API}/api/color-increments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color, percentIncrement: percent }),
      });
      const created = await res.json();
      setColors([created, ...colors]);
      setNewColor("");
      setPercent(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Colori e Maggiorazioni</h2>
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Colore"
          value={newColor}
          onChange={e => setNewColor(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <input
          type="number"
          placeholder="Percent%"
          value={percent}
          onChange={e => setPercent(Number(e.target.value))}
          style={{ width: 80, marginRight: 8 }}
        />
        <button onClick={add}>Aggiungi</button>
      </div>
      <ul>
        {colors.length > 0
          ? colors.map(c => (
              <li key={c.id}>{c.color} – {c.percent_increment}%</li>
            ))
          : <li>Nessun colore configurato</li>
        }
      </ul>
    </div>
  );
}

// --- Listini
function PriceListsSection() {
  const [lists, setLists] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [productTypeId, setProductTypeId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [pricePerSqm, setPricePerSqm] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/price-lists`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setLists(data) : setLists([]))
      .catch(console.error);
  }, []);

  const add = async () => {
    if (!customerId || !productTypeId) return;
    try {
      const res = await fetch(`${API}/api/price-lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, productTypeId, subCategoryId, pricePerSqm }),
      });
      const created = await res.json();
      setLists([created, ...lists]);
      setCustomerId("");
      setProductTypeId("");
      setSubCategoryId("");
      setPricePerSqm(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Listini al mq</h2>
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Customer ID"
          value={customerId}
          onChange={e => setCustomerId(e.target.value)}
          style={{ marginRight: 8, width: 100 }}
        />
        <input
          placeholder="ProductType ID"
          value={productTypeId}
          onChange={e => setProductTypeId(e.target.value)}
          style={{ marginRight: 8, width: 120 }}
        />
        <input
          placeholder="SubCategory ID"
          value={subCategoryId}
          onChange={e => setSubCategoryId(e.target.value)}
          style={{ marginRight: 8, width: 120 }}
        />
        <input
          type="number"
          placeholder="Prezzo/m²"
          value={pricePerSqm}
          onChange={e => setPricePerSqm(Number(e.target.value))}
          style={{ marginRight: 8, width: 100 }}
        />
        <button onClick={add}>Aggiungi</button>
      </div>
      <ul>
        {lists.length > 0
          ? lists.map(pl => (
              <li key={pl.id}>
                Cust {pl.customer_id}, Tipo {pl.product_type_id}, Sub {pl.sub_category_id}, €{pl.price_per_sqm}/m²
              </li>
            ))
          : <li>Nessun listino configurato</li>
        }
      </ul>
    </div>
  );
}

// --- Stati di lavorazione personalizzati ---
function WorkStatusesSection() {
  const [types, setTypes] = useState([]);
  const [subs, setSubs] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [statuses, setStatuses] = useState(["In attesa","In lavorazione 1","In lavorazione 2","Pronto","Consegnato"]);
  const [statusInput, setStatusInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/product-types`)
      .then(res => res.json()).then(setTypes);
  }, []);

  useEffect(() => {
    if (!selectedType) return setSubs([]);
    fetch(`${API}/api/sub-categories?productTypeId=${selectedType}`)
      .then(res => res.json()).then(setSubs);
  }, [selectedType]);

  useEffect(() => {
    if (!selectedType) return;
    fetch(`${API}/api/work-statuses?productTypeId=${selectedType}&subCategoryId=${selectedSub}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.status_list) {
          let arr;
          try { arr = JSON.parse(data.status_list); } catch { arr = []; }
          setStatuses(Array.isArray(arr) && arr.length ? arr : ["In attesa","In lavorazione 1","In lavorazione 2","Pronto","Consegnato"]);
        }
      });
  }, [selectedType, selectedSub]);

  const addStatus = () => {
    const name = statusInput.trim();
    if (!name || statuses.includes(name)) return;
    setStatuses([...statuses, name]);
    setStatusInput("");
  };
  const removeStatus = (s) => {
    setStatuses(statuses.filter(x => x !== s));
  };
  const saveStatuses = async () => {
    await fetch(`${API}/api/work-statuses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productTypeId: selectedType,
        subCategoryId: selectedSub,
        statusList: statuses
      })
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div>
      <h2>Stati di lavorazione</h2>
      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
        <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{width:180}}>
          <option value="">Tipo prodotto</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={selectedSub} onChange={e => setSelectedSub(e.target.value)} style={{width:180}}>
          <option value="">Sottocategoria (opz.)</option>
          {subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:12 }}>
        {statuses.map(s =>
          <span key={s} style={{
            border:"1px solid #ccc", borderRadius:8, padding:"4px 10px", marginRight:8, display:"inline-block"
          }}>
            {s}
            <button onClick={()=>removeStatus(s)} style={{marginLeft:6}}>×</button>
          </span>
        )}
      </div>
      <div style={{marginBottom:12}}>
        <input
          placeholder="Nuovo stato"
          value={statusInput}
          onChange={e => setStatusInput(e.target.value)}
          style={{marginRight:8}}
        />
        <button onClick={addStatus}>Aggiungi</button>
      </div>
      <button onClick={saveStatuses}>Salva stati</button>
      {saved && <span style={{marginLeft:12, color:"green"}}>Salvato!</span>}
    </div>
  );
}
