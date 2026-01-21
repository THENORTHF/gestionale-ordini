import React, { useEffect, useMemo, useState } from "react";

const API = process.env.REACT_APP_API_URL;

export default function CustomersPanel() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // form (crea/modifica)
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const title = useMemo(
    () => (editingId ? "Modifica cliente" : "Nuovo cliente"),
    [editingId]
  );

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPhone("");
    setAddress("");
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${API}/api/customers`);
      if (search.trim()) url.searchParams.set("search", search.trim());
      const res = await fetch(url.toString());
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Impossibile caricare i clienti");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const payload = {
      name: name.trim(),
      phone_number: phone.trim() || null,
      address: address.trim() || null,
    };
    if (!payload.name) {
      alert("Inserisci il nome cliente");
      return;
    }

    try {
      const isEdit = Boolean(editingId);
      const res = await fetch(
        `${API}/api/customers${isEdit ? `/${editingId}` : ""}`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const msg = (await res.json())?.error || `Errore ${res.status}`;
        throw new Error(msg);
      }

      const saved = await res.json();
      if (isEdit) {
        setItems((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
      } else {
        setItems((prev) => [saved, ...prev]);
      }
      resetForm();
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const edit = (c) => {
    setEditingId(c.id);
    setName(c.name || "");
    setPhone(c.phone_number || "");
    setAddress(c.address || "");
  };

  const remove = async (id) => {
    if (!window.confirm("Vuoi eliminare questo cliente?")) return;
    try {
      const res = await fetch(`${API}/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(`Errore ${res.status}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) resetForm();
    } catch (e) {
      console.error(e);
      alert("Impossibile eliminare cliente");
    }
  };

  return (
    <div>
      <h2>Clienti</h2>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <input
          placeholder="Cerca cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={load} disabled={loading}>
          Cerca
        </button>
        <button onClick={resetForm}>
          Nuovo
        </button>
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <input
            placeholder="Nome cliente"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            placeholder="Telefono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            placeholder="Indirizzo"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ padding: 8 }}
          />
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <button onClick={save}>{editingId ? "Salva modifiche" : "Aggiungi cliente"}</button>
          {editingId && <button onClick={resetForm}>Annulla</button>}
        </div>
      </div>

      <h3>Elenco</h3>
      {loading ? (
        <div>Caricamento…</div>
      ) : (
        <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
          {items.length === 0 ? (
            <div style={{ padding: 12, opacity: 0.7 }}>Nessun cliente</div>
          ) : (
            items.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: 12,
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {(c.phone_number || "—") + " · " + (c.address || "—")}
                  </div>
                </div>
                <button onClick={() => edit(c)}>Modifica</button>
                <button onClick={() => remove(c.id)}>Elimina</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
