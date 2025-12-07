#!/bin/bash

# Folder: .
# File: build.sh
# Version: 2.0
# Date: December 7, 2025
# Time: 2:15 PM EST

# --- Comic Scan Pro Full Build Script ---
# This script bundles the entire client application into a single file 
# for the browser, resolving all imports (React, Firebase, Services).

echo "--- Starting Full Asset Build for Comic Scan Pro ---"

# =========================================================================
# 1. SETUP BUILD ENVIRONMENT
# =========================================================================
SRC_DIR="./src"
TEMP_DIR="./_temp_build"
PUBLIC_DIR="./public"

# Clean up previous builds
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
mkdir -p "$PUBLIC_DIR"

echo "1. Preparing source files..."

# Copy all source files to temp directory so we can modify them safely
cp -r "$SRC_DIR"/* "$TEMP_DIR/"

# =========================================================================
# 2. RESOLVE CONFIGURATION MAPPING
# =========================================================================
# Your AuthContext imports '../firebase.js', but the source file is 'firebase-config.js'.
# We rename it in the temp directory so the import resolves correctly during bundling.

if [ -f "$TEMP_DIR/firebase-config.js" ]; then
    mv "$TEMP_DIR/firebase-config.js" "$TEMP_DIR/firebase.js"
    echo "   Mapped: firebase-config.js -> firebase.js (for bundling)"
fi

# =========================================================================
# 3. BUNDLE CLIENT ASSETS
# =========================================================================
echo "2. Bundling Application..."

# We use esbuild to bundle everything starting from index.jsx.
# This automatically pulls in App.jsx, comicService.js, constants.js, etc.
# We do NOT need to manually copy those files anymore.

if [ -f "$TEMP_DIR/index.jsx" ]; then
    npx esbuild "$TEMP_DIR/index.jsx" \
        --bundle \
        --outfile="$PUBLIC_DIR/index-module.js" \
        --format=esm \
        --loader:.js=jsx \
        --loader:.jsx=jsx \
        --sourcemap \
        --minify
    
    echo "   Bundled: index-module.js (Includes all dependencies)"
else
    echo "   Error: Entry point index.jsx not found in temp build."
    exit 1
fi

# =========================================================================
# 4. FUNCTIONS ASSET CHECK
# =========================================================================
echo "3. Functions Assets..."
# Functions files are expected to be in ./functions/ already. 
# No action needed here for this workflow.

# Cleanup temp files
rm -rf "$TEMP_DIR"

echo "--- Full Asset Build Succeeded ---"