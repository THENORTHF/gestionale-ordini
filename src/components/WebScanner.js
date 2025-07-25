import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function WebScanner() {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;

    BrowserMultiFormatReader
      .listVideoInputDevices()
      .then(deviceIds => {
        if (!active) return;
        // CERCA BACK CAMERA
        const backCam = deviceIds.find(d =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("environment") ||
          d.label.toLowerCase().includes("rear")
        );
        const deviceId = backCam ? backCam.deviceId : deviceIds[0]?.deviceId;
        if (!deviceId) throw new Error("Nessuna camera trovata");
        return codeReader.decodeOnceFromVideoDevice(
          deviceId,
          videoRef.current
        );
      })
      .then(result => {
        if (active && result?.getText()) {
          navigate(`/scan/${result.getText()}`);
        }
      })
      .catch(err => {
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
