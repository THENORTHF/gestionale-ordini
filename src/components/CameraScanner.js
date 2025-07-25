import React, { useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function CameraScanner({ onDetected }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    BrowserMultiFormatReader
      .listVideoInputDevices()
      .then(deviceIds => {
        // CERCA BACK CAMERA
        const backCam = deviceIds.find(d =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("environment") ||
          d.label.toLowerCase().includes("rear")
        );
        const deviceId = backCam ? backCam.deviceId : deviceIds[0]?.deviceId;
        if (!deviceId) throw new Error("Nessuna camera trovata");
        return codeReader.decodeOnceFromVideoDevice(deviceId, videoRef.current);
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
