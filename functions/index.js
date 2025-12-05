const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(); // <--- UNCOMMENTED: Initialize Admin SDK for Firestore access

// Initialize Firestore Database handle
const db = admin.firestore();

// Pass the database handle to the core logic function
const { fetchMetadataLogic } = require('./fetchMetadata'); 
const { processImageForMetadata } = require('./processImageForMetadata');


// --- 1. BARCODE METADATA LOOKUP FUNCTION ---
/**
 * HTTPS Callable function to fetch metadata using barcode data.
 */
exports.fetchComicMetadata = functions.https.onCall(async (data, context) => {
    // We now have the db handle available via closure or context if needed, 
    // but the best practice is to pass it to the logic file.

    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { titleCode, issueNumber, coverVariant } = data;

    if (!titleCode || !issueNumber) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing title code or issue number.');
    }
    
    try {
        // We now pass the Firestore handle (db) to the core logic function
        const result = await fetchMetadataLogic(db, titleCode, issueNumber, coverVariant);
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
exports.processImageForMetadata = (data, context) => {
    // You will need to wrap this if it requires the 'db' handle too, 
    // but for now, we leave the export as is and focus on fetchMetadata.
    return processImageForMetadata(data, context); 
};