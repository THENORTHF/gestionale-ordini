import React, { useEffect, useRef, useState } from "react";

const API = process.env.REACT_APP_API_URL;

function useDebounced(value, delay = 200) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

/**
 * Autocomplete clienti.
 * - value: string
 * - onChange: (string) => void
 * - onSelect: (customer) => void
 */
export default function CustomerAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Nome Cliente",
  minChars = 1,
}) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounced(value, 200);
  const rootRef = useRef(null);

  useEffect(() => {
    const q = (debounced || "").trim();
    if (q.length < minChars) {
      setItems([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API}/api/customers/suggest?q=${encodeURIComponent(q)}&limit=10`
        );
        const data = await res.json();
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          setOpen(true);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setItems([]);
          setOpen(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced, minChars]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => items.length && setOpen(true)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #ddd",
            zIndex: 100,
            maxHeight: 240,
            overflow: "auto",
            borderRadius: 6,
          }}
        >
          {loading && (
            <div style={{ padding: 10, opacity: 0.7 }}>Caricamento…</div>
          )}

          {!loading && items.length === 0 && (
            <div style={{ padding: 10, opacity: 0.7 }}>
              Nessun cliente trovato
            </div>
          )}

          {!loading &&
            items.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onChange(c.name);
                  onSelect?.(c);
                  setOpen(false);
                }}
                style={{
                  padding: 10,
                  cursor: "pointer",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {(c.phone_number || "—") + " · " + (c.address || "—")}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
