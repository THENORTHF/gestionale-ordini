// src/components/CameraScanner.js
import React, { useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function CameraScanner({ onDetected }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    codeReader
      .listVideoInputDevices()
      .then(deviceIds => {
        // Scegli la prima camera (di solito quella posteriore su mobile)
        return codeReader.decodeOnceFromVideoDevice(deviceIds[0].deviceId, videoRef.current);
      })
      .then(result => {
        if (onDetected) onDetected(result.text);
      })
      .catch(console.error);

    return () => {
      codeReader.reset();
    };
  }, [onDetected]);

  return (
    <div>
      <video ref={videoRef} style={{ width: "100%" }} />
    </div>
  );
}
