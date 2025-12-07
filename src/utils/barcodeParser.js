// Folder: src/utils
// File: barcodeParser.js
// Version: 1.2
// Date: December 7, 2025

/**
 * Parses a 17-digit comic book UPC+extension code.
 *
 * @param {string} fullBarcode - The 17-digit raw code (e.g., 759606073399001110011).
 * @param {boolean} isDirectEditionBarcode - True if the "DIRECT EDITION" text is visible on the barcode box.
 * @returns {object|null} Parsed comic data, or null on failure.
 */
export const parseComicBarcode = (fullBarcode, isDirectEditionBarcode = false) => {
    if (typeof fullBarcode !== 'string' || fullBarcode.length < 16) {
        return null; 
    }

    const upc = fullBarcode.substring(0, 12); 
    const extension = fullBarcode.substring(12, 17);

    const publisherCode = upc.substring(1, 6);   
    const titleCode = upc.substring(6, 11);     
    
    const issueNumberRaw = extension.substring(0, 3); 
    const issueNumber = parseInt(issueNumberRaw, 10);
    
    let coverVariant = extension.substring(3, 4) || 'A';
    
    // Override variant if user indicates Direct Edition text is present
    if (isDirectEditionBarcode) {
        coverVariant = 'D0'; 
    } else if (coverVariant === '0') {
        coverVariant = 'A';
    }
    
    if (typeof coverVariant === 'string') {
        coverVariant = coverVariant.toUpperCase();
    }

    if (isNaN(issueNumber) || issueNumber < 1) {
        return null;
    }

    return {
        raw: fullBarcode,
        publisherCode,
        titleCode,
        issueNumber,
        coverVariant,
        isDirectEditionBarcode 
    };
};