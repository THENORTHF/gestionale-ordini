// src/components/CameraScanner.js
import React, { useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function CameraScanner({ onDetected }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls;

    codeReader
      .listVideoInputDevices()
      .then(deviceIds => {
        // scegli il primo device (la back camera su mobile)
        return codeReader.decodeOnceFromVideoDevice(deviceIds[0].deviceId, videoRef.current);
      })
      .then(result => {
        onDetected(result.text);
      })
      .catch(err => {
        console.error(err);
      });

    return () => {
      codeReader.reset();
      if (controls) controls.stop();
    };
  }, [onDetected]);

  return (
    <div>
      <video ref={videoRef} style={{ width: "100%" }} />
    </div>
  );
}
