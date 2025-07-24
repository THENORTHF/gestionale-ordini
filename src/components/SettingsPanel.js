import React, { useState, useEffect } from "react";
import WorkersPanel from "./WorkersPanel";

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
        <button onClick={() => setActiveTab("workers")}>
          Operai
        </button>
      </div>

      {activeTab === "productTypes" && <ProductTypesSection />}
      {activeTab === "subCategories" && <SubCategoriesSection />}
      {activeTab === "colorIncrements" && <ColorIncrementsSection />}
      {activeTab === "priceLists" && <PriceListsSection />}
      {activeTab === "workers" && <WorkersPanel />}
    </div>
  );
}

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
          ? items.map(pt => <li key={pt.id}>{pt.name}</li>)
          : <li>Nessun tipo disponibile</li>
        }
      </ul>
    </div>
  );
}

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
    if (!selectedType) return;
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
          ? subs.map(sc => <li key={sc.id}>{sc.name}</li>)
          : <li>Nessuna sottocategoria</li>
        }
      </ul>
    </div>
  );
}

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
