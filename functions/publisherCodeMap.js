// functions/publisherCodeMap.js

/**
 * Maps the Comic Vine Publisher ID (volume.publisher.id) to a detailed object 
 * containing the display name and associated Barcode Prefixes (UPC 5-7 digits).
 * This combined map allows for cross-referencing between Comic Vine data and UPC data.
 * * KEY: Comic Vine Publisher ID (string)
 * VALUE: { 
 * name: String, 
 * barcode_prefixes: Array of common Barcode Publisher Prefixes (5-7 digits) 
 * }
 */
exports.publisherCodeMap = {
    // =======================================================
    // 👑 THE MAJORS
    // =======================================================
    "40": { // Marvel Comics
        name: "Marvel Comics",           
        barcode_prefixes: ["759606", "07339"] // Modern and Legacy 5-digit
    },
    "10": { // DC Comics
        name: "DC Comics",              
        barcode_prefixes: ["761941", "761942", "61941"] // New 52, Rebirth, and Legacy
    },
    "17": { // Image Comics
        name: "Image Comics",           
        barcode_prefixes: ["709853"]
    },
    "31": { // Dark Horse Comics
        name: "Dark Horse Comics",
        barcode_prefixes: ["761568"]
    },
    "21": { // IDW Publishing
        name: "IDW Publishing",
        barcode_prefixes: ["827714"]
    },
    "28": { // Valiant Comics
        name: "Valiant Comics",
        barcode_prefixes: ["858992"]
    },
    "142": { // Boom! Studios
        name: "Boom! Studios",
        barcode_prefixes: ["844284"]
    },
    "20": { // Archie Comics
        name: "Archie Comics",
        barcode_prefixes: ["688847"]
    },
    "49": { // Dynamite Entertainment
        name: "Dynamite Entertainment",
        barcode_prefixes: ["251929"]
    },
    "115": { // Titan Comics
        name: "Titan Comics",
        barcode_prefixes: ["812230"]
    },
    
    // =======================================================
    // 🏛️ DC IMPRINTS & AFFILIATES
    // =======================================================
    "34": { // Vertigo (DC)
        name: "Vertigo (DC)",
        barcode_prefixes: ["761941"] // Uses DC's primary prefix
    },
    "60": { // WildStorm (DC)
        name: "WildStorm (DC)",
        barcode_prefixes: ["761941"] // Uses DC's primary prefix
    },
    "57": { // Milestone Media (DC)
        name: "Milestone Media (DC)",
        barcode_prefixes: ["761941"]
    },
    "138": { // DC Black Label (DC)
        name: "DC Black Label",
        barcode_prefixes: ["761941"]
    },
    
    // =======================================================
    // 🌟 INDEPENDENT & MINOR PUBLISHERS (A-C)
    // =======================================================
    "160": { // AfterShock Comics
        name: "AfterShock Comics",
        barcode_prefixes: ["856475"]
    },
    "360": { // Scout Comics
        name: "Scout Comics",
        barcode_prefixes: ["793591"]
    },
    "176": { // Source Point Press
        name: "Source Point Press",
        barcode_prefixes: ["753807"]
    },
    "26": { // Antarctic Press
        name: "Antarctic Press",
        barcode_prefixes: ["680572"]
    },
    "106": { // Aspen Comics
        name: "Aspen Comics",
        barcode_prefixes: ["893268"]
    },
    "153": { // Caliber Comics
        name: "Caliber Comics",
        barcode_prefixes: ["716186"]
    },
    
    // =======================================================
    // 🌍 INTERNATIONAL
    // =======================================================
    "41": { // Viz Media
        name: "Viz Media",
        barcode_prefixes: ["782009"]
    },
    "180": { // Kodansha Comics
        name: "Kodansha Comics",
        barcode_prefixes: ["704988"]
    },
    
    // ... (Add the remaining 80+ publishers in this object format) ...
    // Note: The rest of the list should be compiled in the same object format.
};