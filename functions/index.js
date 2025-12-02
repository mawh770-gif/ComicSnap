// functions/index.js

const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// admin.initializeApp(); 

const { fetchMetadataLogic } = require('./fetchMetadata'); 
const { processImageForMetadata } = require('./processImageForMetadata');

// --- 1. BARCODE METADATA LOOKUP FUNCTION ---
/**
 * HTTPS Callable function to fetch metadata using barcode data.
 */
exports.fetchComicMetadata = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { titleCode, issueNumber, coverVariant } = data;

    if (!titleCode || !issueNumber) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing title code or issue number.');
    }
    
    try {
        // Calls the core logic, which now returns the base_sku
        const result = await fetchMetadataLogic(titleCode, issueNumber, coverVariant);
        return result;
    } catch (error) {
        console.error("Error in fetchComicMetadata wrapper:", error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch comic metadata.');
    }
});


// --- 2. AI IMAGE PROCESSING FUNCTION ---
/**
 * HTTPS Callable function to handle image processing and lookup.
 * This is defined in its own file and relies on fetchMetadataLogic.
 */
exports.processImageForMetadata = processImageForMetadata;