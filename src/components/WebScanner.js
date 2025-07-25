import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function WebScanner() {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices()
      .then(devices => {
        setDevices(devices);
        // Pre-seleziona la back camera se la trova, altrimenti la prima
        const backCam = devices.find(d =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("environment") ||
          d.label.toLowerCase().includes("rear")
        );
        setSelectedDevice(backCam ? backCam.deviceId : devices[0]?.deviceId || "");
      })
      .catch(err => {
        console.error(err);
        setError("Impossibile trovare le videocamere");
      });
  }, []);

  useEffect(() => {
     if (!selectedDevice) return;
  const codeReader = new BrowserMultiFormatReader();
  let active = true;
  let stream;

  // Prima rilascia qualunque stream già attivo
  if (videoRef.current && videoRef.current.srcObject) {
    stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    videoRef.current.srcObject = null;
  }

  codeReader
    .decodeOnceFromVideoDevice(selectedDevice, videoRef.current)
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
    // Chiudi anche qui eventuali stream rimasti
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
}, [selectedDevice, navigate]);

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20, textAlign: "center" }}>
      <h2>Scannerizza QR / Barcode</h2>
      {devices.length > 1 && (
        <select
          value={selectedDevice}
          onChange={e => setSelectedDevice(e.target.value)}
          style={{ marginBottom: 12, width: "100%" }}
        >
          {devices.map(d =>
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Camera ${d.deviceId}`}
            </option>
          )}
        </select>
      )}
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
