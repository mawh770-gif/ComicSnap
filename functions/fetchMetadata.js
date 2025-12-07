/**
 * fetchMetadata.js
 * Contains the core logic for checking Firestore cache and calling the mock external API.
 * This function is designed to be called from the main index.js wrapper.
 */
const { HttpsError } = require('firebase-functions/v1/https'); // Use HttpsError for consistency in v1 environment

// Helper function to simulate fetching data from a real, external comic book metadata API.
function fetchMetadataFromExternalAPI(titleCode, issueNumber, coverVariant) {
    // Simulate latency of an external API call
    return new Promise(resolve => setTimeout(() => {
        const key = `${titleCode}-${issueNumber}-${coverVariant}`;
        
        // --- Mock Data Logic ---
        let details = {};
        let creators = { writer: [], penciller: [], colorist: [] };
        let imageSource = 'Mock API';

        if (key === '00102-1-A') {
            details = {
                series_title: "Amazing Spider-Man",
                issue_number: 1,
                publisher_name: "Marvel Comics",
                release_date: "2018-07-11",
                base_sku: "MAY180796",
                volume_id: "6807",
                image_url: "https://placehold.co/200x300/1E3A8A/FFFFFF?text=ASM+1+A"
            };
            creators = {
                writer: ["Nick Spencer"],
                penciller: ["Ryan Ottley"],
                colorist: ["Laura Martin"]
            };
        } else if (key === '00121-1-B') {
            details = {
                series_title: "Batman",
                issue_number: 121,
                publisher_name: "DC Comics",
                release_date: "2022-03-01",
                base_sku: "OCT217036",
                volume_id: "6753",
                image_url: "https://placehold.co/200x300/4B5563/FFFFFF?text=Batman+121+B"
            };
            creators = {
                writer: ["Joshua Williamson"],
                penciller: ["Jorge Molina"],
                colorist: ["Tomeu Morey"]
            };
        } else {
            // Simulate a "Not Found" error
            return resolve(null);
        }

        resolve({
            details,
            creators,
            imageSource: 'Mock API'
        });

    }, 1500)); // 1.5 second delay
}

/**
 * Core logic for fetching and caching comic metadata.
 */
async function fetchMetadataLogic(db, appId, titleCode, issueNumber, coverVariant) {
    if (!titleCode || typeof issueNumber !== 'number' || !coverVariant) {
        throw new HttpsError('invalid-argument', 'Missing parameters for core logic.');
    }

    const cacheKey = `${titleCode}-${issueNumber}-${coverVariant.toUpperCase()}`;
    const cacheCollectionPath = `/artifacts/${appId}/public/data/comic_metadata_cache`;
    const cacheDocRef = db.collection(cacheCollectionPath).doc(cacheKey);

    // 1. Cache Lookup
    try {
        const cacheSnapshot = await cacheDocRef.get();
        if (cacheSnapshot.exists) {
            const cachedData = cacheSnapshot.data();
            const now = Date.now();
            const cacheDurationMs = 7 * 24 * 60 * 60 * 1000;

            if (now < cachedData.cachedAt + cacheDurationMs) {
                console.log(`[CacheLogic] Cache HIT for ${cacheKey}.`);
                return { 
                    status: 'success', 
                    message: 'Data retrieved from cache.', 
                    metadata: {
                        ...cachedData.metadata,
                        details: {
                            ...cachedData.metadata.details,
                            imageSource: 'Firestore Cache'
                        }
                    }
                };
            }
        }
    } catch (e) {
        console.error(`[CacheLogic] Error checking cache for ${cacheKey}:`, e);
    }

    // 2. External API Call (Simulated)
    const metadata = await fetchMetadataFromExternalAPI(titleCode, issueNumber, coverVariant);

    if (!metadata) {
        return { status: 'error', message: `No comic found for the given code and issue number: ${cacheKey}` };
    }
    
    // 3. Cache Write
    try {
        const cacheData = {
            metadata: metadata,
            cachedAt: Date.now(),
            ttl: 7 // Days
        };
        await cacheDocRef.set(cacheData, { merge: false });
    } catch (e) {
        console.error(`[CacheLogic] Error writing to cache for ${cacheKey}:`, e);
    }

    // 4. Return Data
    return { status: 'success', message: 'Data fetched from external API and cached.', metadata: metadata };
}

module.exports = {
    fetchMetadataLogic,
};