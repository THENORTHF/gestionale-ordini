import React, { forwardRef } from "react";
import Barcode from "react-barcode";

const TeloCutCard = forwardRef(function TeloCutCard({ item, compact = false }, ref) {
  if (!item) return null;
  const created = item.created_at ? new Date(item.created_at).toLocaleString("it-IT") : "";
  return (
    <div ref={ref} className={`telo-barcode-card${compact ? " compact" : ""}`}>
      <div className="telo-barcode-graphic">
        <Barcode
          value={item.barcode_value}
          format="CODE128"
          width={compact ? 1.35 : 2}
          height={compact ? 55 : 95}
          margin={8}
          fontSize={compact ? 12 : 16}
        />
      </div>
      <div className="telo-barcode-info">
        <strong>{item.customer_name}</strong>
        <span>Larghezza: {item.cut_width_mm} mm</span>
        <span>Altezza: {item.cut_height_mm} mm</span>
        <span>Tipo: {item.telo_type}</span>
        {item.note && <span>Nota: {item.note}</span>}
        {item.order_id && <span>Ordine: #{item.order_id} · pezzo {item.piece_number}</span>}
        <small>{created}</small>
      </div>
    </div>
  );
});

export default TeloCutCard;
