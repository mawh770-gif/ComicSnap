// functions/fetchMetadata.js

// Import necessary modules for Cloud Functions and external API call
const functions = require('firebase-functions');
const fetch = require('node-fetch');
// seriesCodeMap is now a fallback, but we keep it
const { seriesCodeMap } = require('./seriesCodeMap'); 
const { publisherCodeMap } = require('./publisherCodeMap');

// Collection name for series codes learned by the app
const SERIES_MAPPINGS_COLLECTION = 'series_mappings';

/**
 * Fetches and processes metadata for a comic issue based on barcode components.
 * * @param {object} db - The Firestore database handle from admin.firestore(). <--- NEW PARAMETER
 * @param {string} titleCode - The 5-digit title code from the UPC (e.g., "00102").
 * @param {number} issueNumber - The issue number (e.g., 1).
 * @param {string} coverVariant - The cover variant ('A', 'B', or 'D0' for Direct).
 * @returns {object} { status: 'success' or 'error', metadata: {...} or message: "..." }
 */
exports.fetchMetadataLogic = async (db, titleCode, issueNumber, coverVariant) => {
    
    // --- 1. SETUP AND VALIDATION ---
    const COMICVINE_API_KEY = functions.config().comicvine.api_key;
    if (!COMICVINE_API_KEY) {
        throw new functions.https.HttpsError('internal', 'Comic Vine API key not configured.');
    }

    let seriesTitleLookup = null; // Will be set by Firestore, local map, or API

    // --- 2. FIRESTORE CACHE CHECK (NEW) ---
    try {
        const cacheDocRef = db.collection(SERIES_MAPPINGS_COLLECTION).doc(titleCode);
        const cacheSnapshot = await cacheDocRef.get();

        if (cacheSnapshot.exists) {
            // 🟢 Found in Cache! Use the saved title and skip API lookup.
            const cachedData = cacheSnapshot.data();
            seriesTitleLookup = cachedData.series_title;
            // console.log(`Title code ${titleCode} found in Firestore cache.`);
        }
    } catch (error) {
        // If Firestore fails, log the error but proceed to the local map and API
        console.error("Firestore Cache Read Error:", error);
    }
    
    // --- 3. LOCAL MAP CHECK (Fallback) ---
    if (!seriesTitleLookup) {
        const localTitle = seriesCodeMap[titleCode];
        if (localTitle) {
            seriesTitleLookup = localTitle;
            // console.log(`Title code ${titleCode} found in local map.`);
        }
    }

    // --- 4. TITLE NOT FOUND ERROR ---
    if (!seriesTitleLookup) {
        return { status: 'error', message: `Title code ${titleCode} not found in database or local map. Cannot proceed to API.` };
    }


    // --- 5. API CALL ---
    const baseUrl = 'https://comicvine.gamespot.com/api/search/';
    const queryParams = new URLSearchParams({
        api_key: COMICVINE_API_KEY,
        format: 'json',
        // Search using the resolved series name
        query: seriesTitleLookup, 
        resources: 'issue',
        field_list: 'name,id,cover_date,api_detail_url,issue_number,description,person_credits,image,volume',
        filter: `issue_number:${issueNumber}`,
        limit: 1,
    });
    
    // Implement a brief delay to help adhere to Comic Vine's rate limits
    await new Promise(resolve => setTimeout(resolve, 300)); 

    try {
        const response = await fetch(`${baseUrl}?${queryParams.toString()}`);
        const data = await response.json();

        if (data.status_code !== 1 || data.results.length === 0) {
            return { status: 'error', message: 'Metadata not found on Comic Vine.' };
        }

        const cvResult = data.results[0];
        
        // --- 6. CACHING SUCCESSFUL API LOOKUP (NEW) ---
        // If the title was NOT found in the initial cache check, and the API returned a good result, 
        // save the mapping so we skip the API call next time.
        if (!cacheSnapshot.exists) {
            const cacheDocRef = db.collection(SERIES_MAPPINGS_COLLECTION).doc(titleCode);
            await cacheDocRef.set({
                series_title: seriesTitleLookup,
                volume_id: cvResult.volume.id,
                date_cached: admin.firestore.FieldValue.serverTimestamp(),
                source: 'API_DISCOVERY'
            }, { merge: true }); // Use merge to avoid overwriting the whole document if it already exists
            // console.log(`Successfully cached title code ${titleCode} to Firestore.`);
        }
        
        // --- 7. DATA PROCESSING AND SKU GENERATION ---
        
        const releaseDate = cvResult.cover_date || cvResult.date_added;
        const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : null;
        
        // Generate Base SKU (excluding sequential index)
        const skuVariantCode = coverVariant || 'A'; // Default to 'A' if null/empty
        let baseSKU = null;
        if (releaseYear) {
            // BASE SKU FORMAT: [Title Code]-[Release Year]-[Issue Number]-[Variant]
            baseSKU = `${titleCode}-${releaseYear}-${cvResult.issue_number}-${skuVariantCode}`;
        }
        
        // Lookup Publisher Name
        const publisherName = publisherCodeMap[cvResult.volume.publisher.id] || cvResult.volume.publisher.name || "Unknown Publisher";

        // --- 8. TITLE FORMATTING (Newstand Rule) ---
        let finalSeriesTitle = seriesTitleLookup; 
        
        // Rule: Only add "- Newstand" if 1982 or later AND NOT the Direct Edition ('D0')
        const IS_POST_1981 = releaseYear && releaseYear >= 1982;
        const IS_NEWSTAND_EDITION = coverVariant !== 'D0'; 
        
        if (IS_POST_1981 && IS_NEWSTAND_EDITION) {
            finalSeriesTitle += ' - Newstand';
        }
        
        // --- 9. CREATOR MAPPING ---
        const creators = { writer: [], penciller: [], inker: [], colorist: [] };
        if (cvResult.person_credits) {
            cvResult.person_credits.forEach(credit => {
                const role = credit.role.toLowerCase();
                if (creators[role]) {
                    creators[role].push(credit.name);
                }
            });
        }
        
        // --- 10. FINAL METADATA OBJECT ---
        const metadata = {
            details: {
                series_title: finalSeriesTitle, 
                publisher_name: publisherName,
                release_date: releaseDate,
                release_year: releaseYear,
                // Store the base SKU for sequential numbering in the client service layer
                base_sku: baseSKU, 
                volume_id: cvResult.volume.id,
                issue_id: cvResult.id,
                issue_number: cvResult.issue_number,
                image_url: cvResult.image.original_url,
                imageSource: 'BARCODE', 
            },
            creators: creators,
        };

        return { status: 'success', metadata: metadata };

    } catch (error) {
        console.error("Comic Vine Lookup Error:", error);
        // Throw a standard HttpsError for client handling
        throw new functions.https.HttpsError('internal', `External lookup failed: ${error.message}`);
    }
};