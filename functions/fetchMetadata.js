// functions/fetchMetadata.js

// Import necessary modules for Cloud Functions and external API call
const functions = require('firebase-functions');
const fetch = require('node-fetch');
const { seriesCodeMap } = require('./seriesCodeMap');
const { publisherCodeMap } = require('./publisherCodeMap');

/**
 * Fetches and processes metadata for a comic issue based on barcode components.
 * * @param {string} titleCode - The 5-digit title code from the UPC (e.g., "00102").
 * @param {number} issueNumber - The issue number (e.g., 1).
 * @param {string} coverVariant - The cover variant ('A', 'B', or 'D0' for Direct).
 * @returns {object} { status: 'success' or 'error', metadata: {...} or message: "..." }
 */
exports.fetchMetadataLogic = async (titleCode, issueNumber, coverVariant) => {
    
    // --- 1. SETUP AND VALIDATION ---
    const COMICVINE_API_KEY = functions.config().comicvine.api_key;
    if (!COMICVINE_API_KEY) {
        // Use HttpsError instead of simple Error for callable functions
        throw new functions.https.HttpsError('internal', 'Comic Vine API key not configured.');
    }

    const seriesTitleLookup = seriesCodeMap[titleCode];
    if (!seriesTitleLookup) {
        return { status: 'error', message: `Title code ${titleCode} not found in local map.` };
    }

    // --- 2. API CALL ---
    const baseUrl = 'https://comicvine.gamespot.com/api/search/';
    const queryParams = new URLSearchParams({
        api_key: COMICVINE_API_KEY,
        format: 'json',
        // Search using the full series name including volume year (e.g., Avengers (1963 Series))
        query: seriesTitleLookup,
        resources: 'issue',
        // Select specific fields for smaller payload
        field_list: 'name,id,cover_date,api_detail_url,issue_number,description,person_credits,image,volume',
        filter: `issue_number:${issueNumber}`,
        limit: 1,
    });
    
    // Implement a brief delay to help adhere to Comic Vine's rate limits
    await new Promise(resolve => setTimeout(resolve, 300)); // Small delay added

    try {
        const response = await fetch(`${baseUrl}?${queryParams.toString()}`);
        const data = await response.json();

        if (data.status_code !== 1 || data.results.length === 0) {
            return { status: 'error', message: 'Metadata not found on Comic Vine.' };
        }

        const cvResult = data.results[0];
        
        // --- 3. DATA PROCESSING AND SKU GENERATION ---
        
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

        // --- 4. TITLE FORMATTING (Newstand Rule) ---
        let finalSeriesTitle = seriesTitleLookup; 
        
        // Rule: Only add "- Newstand" if 1982 or later AND NOT the Direct Edition ('D0')
        const IS_POST_1981 = releaseYear && releaseYear >= 1982;
        const IS_NEWSTAND_EDITION = coverVariant !== 'D0'; 
        
        if (IS_POST_1981 && IS_NEWSTAND_EDITION) {
            finalSeriesTitle += ' - Newstand';
        }
        
        // --- 5. CREATOR MAPPING ---
        const creators = { writer: [], penciller: [], inker: [], colorist: [] };
        if (cvResult.person_credits) {
            cvResult.person_credits.forEach(credit => {
                const role = credit.role.toLowerCase();
                if (creators[role]) {
                    creators[role].push(credit.name);
                }
            });
        }
        
        // --- 6. FINAL METADATA OBJECT ---
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