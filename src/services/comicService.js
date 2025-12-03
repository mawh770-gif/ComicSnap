// src/services/comicService.js

import { db, functions } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// 👇 CRITICAL: Used to call the secure Firebase Cloud Function
import { httpsCallable } from 'firebase/functions'; 

// Reference to the Cloud Function endpoint we defined in index.js
const callMetadataFunction = httpsCallable(functions, 'fetchComicMetadata');

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


/**
 * Calls the secure Firebase Cloud Function endpoint for metadata lookup.
 * This is the frontend interface for the backend logic defined in functions/index.js.
 * @param {string} titleCode - The 5-digit title code.
 * @param {number} issueNumber - The issue number.
 */
export const fetchMetadataFromCloud = async (titleCode, issueNumber) => {
    try {
        const result = await callMetadataFunction({ titleCode, issueNumber });
        // result.data contains { status, metadata } as returned by the Cloud Function
        return result.data; 
    } catch (error) {
        console.error("Error calling Cloud Function:", error);
        // This catches HttpsErrors (internal, unauthenticated, invalid-argument)
        return { status: 'error', message: error.message }; 
    }
};

/**
 * Legacy wrapper for the function that calls the secure Firebase Cloud Function endpoint.
 * This is used to resolve the build error from components referencing the old name (processImageForMetadata).
 * @deprecated Use fetchMetadataFromCloud instead.
 */
export const processImageForMetadata = async (imageDataPlaceholder) => {
    console.warn("processImageForMetadata is deprecated. Using fetchMetadataFromCloud instead.");
    // NOTE: This function's AI logic is a placeholder, so we return a clear error/stub.
    return { status: 'error', message: "AI recognition is a placeholder function." };
};