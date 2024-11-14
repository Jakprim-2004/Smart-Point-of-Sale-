// components/Barcode.js
import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

const Barcode = ({ value, width = 1, height = 10 }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, value, {
        format: "CODE128",
        displayValue: true,
        width: width,
        height: height,
      });
    }
  }, [value, width, height]);

  return <svg ref={barcodeRef}></svg>;
};

export default Barcode;