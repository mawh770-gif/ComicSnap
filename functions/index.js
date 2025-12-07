// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(); // Initialize Admin SDK for Firestore access

// Initialize Firestore Database handle
const db = admin.firestore();

// Pass the database handle to the core logic function
const { fetchMetadataLogic } = require('./fetchMetadata'); 
// 🚨 CRITICAL CHANGE: processImageForMetadata.js now exports a function that must be called with (db)
const processImageForMetadataCreator = require('./processImageForMetadata').processImageForMetadata;

// --- 1. BARCODE METADATA LOOKUP FUNCTION ---
exports.fetchComicMetadata = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { titleCode, issueNumber, coverVariant } = data;
    // Extract the application ID (instanceId) from the context. This is vital for 
    // constructing the secure, shared Firestore path in fetchMetadata.js.
    const appId = context.instanceId || 'default-app-id'; 

    if (!titleCode || !issueNumber) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing title code or issue number.');
    }
    
    try {
        // Pass the Firestore handle (db) and the application ID (appId) 
        // to the core logic function, matching its required signature.
        const result = await fetchMetadataLogic(db, appId, titleCode, issueNumber, coverVariant);
        return result;
    } catch (error) {
        console.error("Error in fetchComicMetadata wrapper:", error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch comic metadata.');
    }
});


// --- 2. AI IMAGE PROCESSING FUNCTION ---
/**
 * HTTPS Callable function to handle image processing and lookup.
 * We call the creator function with 'db' to return the final Callable Function.
 */
// 🚨 CRITICAL CHANGE: We call the exported function with the db handle to define the final function
exports.processImageForMetadata = processImageForMetadataCreator(db);