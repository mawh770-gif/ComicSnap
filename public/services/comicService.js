// Folder: src/services
// File: comicService.js
// Version: 1.6
// Date: December 7, 2025
// Time: 1:55 PM EST

// We use CDN imports here so this file works directly in the browser after the build script copies it.
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js';

// Corrected path: '../' moves up from 'services' to 'src' to find 'firebase-config.js'.
// The build script renames firebase-config.js to firebase.js in public/, so we import that relative path.
// However, since this file stays in /services/ in public, and firebase.js is in root public/,
// the import '../firebase.js' is correct for the deployed version.
// For the local src version, we point to the config file.
import { db, functions } from '../firebase-config.js'; 

// --- Cloud Function Utilities ---

/**
 * Implements exponential backoff for retrying Firebase Function calls.
 * This pattern ensures resilience against transient network or server errors.
 * @param {functions.HttpsCallable} callable - The Firebase callable function wrapper.
 * @param {object} data - The payload to send to the function.
 * @param {number} maxRetries - Maximum number of retry attempts.
 * @param {number} initialDelay - Initial delay in milliseconds before the first retry.
 * @returns {Promise<object>} The function response data.
 */
async function callFunctionWithBackoff(callable, data, maxRetries, initialDelay) {
    let response = null;
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
        try {
            response = await callable(data);
            return response; 
        } catch (error) {
            if (i < maxRetries - 1) {
                // Wait for the calculated delay before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; 
            } else {
                // Throw the error if max retries are exceeded
                throw error; 
            }
        }
    }
}


/**
 * Calls the secure Firebase Cloud Function endpoint for metadata lookup (Manual Lookup).
 * @param {string} titleCode - The title identifier (e.g., the first 5 digits of a barcode).
 * @param {number} issueNumber - The issue number.
 * @param {string} coverVariant - The cover variant code (e.g., "A").
 * @returns {Promise<object>} The result from the Cloud Function.
 */
export async function fetchMetadataFromCloud(titleCode, issueNumber, coverVariant) {
    if (!titleCode || isNaN(issueNumber)) {
        throw new Error("Invalid Title Code or Issue Number.");
    }
    
    // The callable wrapper for the 'fetchComicMetadata' function
    const callable = httpsCallable(functions, 'fetchComicMetadata');
    
    // Call the function with backoff logic
    return callFunctionWithBackoff(callable, {
        titleCode: titleCode,
        issueNumber: issueNumber,
        coverVariant: coverVariant
    }, 3, 1000);
}

/**
 * Calls the Cloud Function for AI image analysis (First step in the Waterfall).
 * @param {string} base64Image - Base64 string of the image (without MIME prefix).
 * @param {string} imageMimeType - MIME type of the image.
 * @returns {Promise<object>} The result from the Cloud Function containing extracted data.
 */
export async function processImageForMetadata(base64Image, imageMimeType) {
    if (!base64Image || !imageMimeType) {
        throw new Error("Missing image data or mime type for analysis.");
    }
    
    // The callable wrapper for the 'processImageForMetadata' function
    const callable = httpsCallable(functions, 'processImageForMetadata');
    
    // Call the function with backoff logic
    return callFunctionWithBackoff(callable, {
        base64Image: base64Image,
        imageMimeType: imageMimeType
    }, 3, 1000);
}


// --- Firestore Inventory Utilities ---

/**
 * Helper function to save a document to a specified collection.
 * This handles the common logic for both inventory and staging.
 */
const saveComicDocument = async (userId, data, collectionPath) => {
    // Prepare the base data structure for Firestore
    const comicDocument = {
        uid: userId,
        addedAt: serverTimestamp(), // Use Firestore's server timestamp
        
        // Barcode data is saved as is
        barcodeData: data.barcodeData, 
        
        // Initialize with default or placeholder values
        details: {
            // These placeholders will be overwritten by metadata if available
            series_title: "TITLE PENDING LOOKUP",
            publisher_name: data.barcodeData.publisherCode,
            release_date: null,
            
            // User inputs
            condition_grade: data.userInputs.condition_grade || "Not Graded",
            my_value: data.userInputs.my_value || null,
            storage_box: "Unsorted",
        },
        
        // Placeholder for creators
        creators: { writer: [], penciller: [], inker: [], colorist: [] }
    };
    
    // 1. Overwrite defaults with metadata if a successful lookup occurred
    if (data.metadata) {
        // Merge the details found from Comic Vine lookup
        Object.assign(comicDocument.details, data.metadata.details); 
        // Assign the creators data
        comicDocument.creators = data.metadata.creators;
    }

    // 2. Save the complete document to the user's subcollection
    try {
        // Use the private data path convention: /artifacts/{appId}/users/{userId}/{collectionPath}
        const docRef = await addDoc(collection(db, 'users', userId, collectionPath), comicDocument);
        return { success: true, id: docRef.id };
    } catch (e) {
        console.error(`Error adding document to ${collectionPath}: `, e);
        return { success: false, error: e };
    }
}


/**
 * Saves a new comic entry into the user's main Firestore inventory.
 * @param {string} userId - The authenticated user's ID.
 * @param {object} data - Contains barcodeData, metadata, and userInputs.
 */
export const addComicToInventory = async (userId, data) => {
    return saveComicDocument(userId, data, 'inventory');
};

/**
 * Saves a new comic entry into the user's STAGING area for review (typically for AI recognized items).
 * @param {string} userId - The authenticated user's ID.
 * @param {object} data - Contains barcodeData, metadata, and userInputs.
 */
export const addComicToStaging = async (userId, data) => {
    return saveComicDocument(userId, data, 'staging');
};