#!/bin/bash

# --- Comic Scan Pro Client Asset Copy Script ---
# This script is designed to copy the necessary modular JavaScript/JSX files 
# from the development source directory (src/) into the public/ directory,
# renaming the .jsx and general files to match the import paths used by the browser.

# 1. Define Source and Destination Directories
SRC_DIR="./src"
PUBLIC_DIR="./public"


echo "Starting client asset build for Comic Scan Pro..."

# 2. Define the files we need, specifying their source and desired public name
declare -a FILES_TO_SYNC=(
    # Source Path                               | Destination Name in public/
    "$SRC_DIR/App.jsx:$PUBLIC_DIR/app.js"
    "$SRC_DIR/context/AuthContext.jsx:$PUBLIC_DIR/auth.js"
    
    # NEW: Renames src/firebase.js to public/firebase-config.js to maintain internal import compatibility.
    "$SRC_DIR/firebase.js:$PUBLIC_DIR/firebase-config.js"

    # NEW: Added src/index.js, renaming it to index-module.js to avoid confusion with index.html.
    # If this is your true application entry point, you must adjust index.html.
    "$SRC_DIR/index.js:$PUBLIC_DIR/index-module.js"
)

# 3. Create public directory if it doesn't exist
if [ ! -d "$PUBLIC_DIR" ]; then
    mkdir -p "$PUBLIC_DIR"
    echo "Created directory: $PUBLIC_DIR"
fi

# 4. Copy each file, handling renaming
for file_pair in "${FILES_TO_SYNC[@]}"; do
    # Split the string at the colon
    SRC_PATH="${file_pair%%:*}"
    DEST_PATH="${file_pair##*:}"
    
    # Extract just the filename for logging
    FILENAME=$(basename "$SRC_PATH")

    if [ -f "$SRC_PATH" ]; then
        cp "$SRC_PATH" "$DEST_PATH"
        if [[ "$SRC_PATH" != "$DEST_PATH" ]]; then
            echo "Copied and Renamed: ${SRC_PATH#./src/} -> ${DEST_PATH#./public/}"
        else
            echo "Copied: ${SRC_PATH#./src/}"
        fi
    else
        echo "Error: Source file not found: $SRC_PATH. Please check your $SRC_DIR structure."
    fi
done

echo "Client asset build complete. Files are ready in $PUBLIC_DIR."