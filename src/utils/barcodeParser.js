// src/utils/barcodeParser.js

/**
 * Parses a raw barcode string (UPC + 5-digit extension)
 * @param {string} barcodeStr - The full string scanned from the comic (e.g., "70985302978600111")
 * @returns {object | null} An object containing parsed identifiers or null if invalid.
 */
export const parseComicBarcode = (barcodeStr) => {
  // Remove any whitespace or dashes
  const cleanCode = barcodeStr.replace(/[\s-]/g, '');

  // A full Direct Market barcode must be 17 digits long
  if (cleanCode.length < 17) return null;

  // The last 5 digits are the extension (EAN-5)
  const extension = cleanCode.slice(-5);
  
  // Mapping for the 4th digit of the extension (Cover Variant)
  // This is a common mapping: 1=A, 2=B, etc.
  const variantMap = ['Unknown', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const variantDigit = parseInt(extension.substring(3, 4), 10);

  return {
    raw: cleanCode,
    // UPC Digits 2-6
    publisherCode: cleanCode.substring(1, 6),
    // UPC Digits 7-11 - used for the series lookup
    titleCode: cleanCode.substring(6, 11),
    // Issue number is the first 3 digits of the extension
    issueNumber: parseInt(extension.substring(0, 3), 10), 
    // Variant is determined by the 4th digit of the extension
    coverVariant: variantMap[variantDigit] || `Variant ${variantDigit}`, 
    // Printing is the 5th digit of the extension
    printing: parseInt(extension.substring(4, 5), 10), 
  };
};