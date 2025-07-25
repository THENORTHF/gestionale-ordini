import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function WebScanner() {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;

    codeReader
      .listVideoInputDevices()
      .then(deviceIds => {
        setLoading(false);
        if (!active) return;
        const firstDevice = deviceIds[0]?.deviceId;
        if (!firstDevice) throw new Error("Nessuna camera trovata");
        return codeReader.decodeOnceFromVideoDevice(firstDevice, videoRef.current);
      })
      .then(result => {
        if (active && result?.getText()) navigate(`/scan/${result.getText()}`);
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
        setError("Impossibile accedere o leggere dalla fotocamera");
      });

    return () => {
      active = false;
      codeReader.reset();
    };
  }, [navigate]);

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20, textAlign: "center" }}>
      <h2>Scannerizza QR / Barcode</h2>
      {loading && <p>Caricamento fotocamera...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <video
        ref={videoRef}
        style={{ width: "100%", border: "1px solid #ccc", borderRadius: 4 }}
        muted
        playsInline
        autoPlay
      />
      <p>Inquadra un QR o un codice a barre per procedere.</p>
    </div>
  );
}
