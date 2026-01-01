#!/bin/bash

# Build script for AppleAuthHelper
# This script compiles the Swift helper for Sign in with Apple

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}"
OUTPUT_NAME="AppleAuthHelper"

echo "Building AppleAuthHelper..."

# Compile for both architectures (universal binary)
swiftc \
    -O \
    -target arm64-apple-macos11.0 \
    -o "${OUTPUT_DIR}/${OUTPUT_NAME}-arm64" \
    "${SCRIPT_DIR}/AppleAuthHelper.swift"

swiftc \
    -O \
    -target x86_64-apple-macos11.0 \
    -o "${OUTPUT_DIR}/${OUTPUT_NAME}-x86_64" \
    "${SCRIPT_DIR}/AppleAuthHelper.swift"

# Create universal binary
lipo -create \
    "${OUTPUT_DIR}/${OUTPUT_NAME}-arm64" \
    "${OUTPUT_DIR}/${OUTPUT_NAME}-x86_64" \
    -output "${OUTPUT_DIR}/${OUTPUT_NAME}"

# Clean up architecture-specific binaries
rm "${OUTPUT_DIR}/${OUTPUT_NAME}-arm64" "${OUTPUT_DIR}/${OUTPUT_NAME}-x86_64"

# Make executable
chmod +x "${OUTPUT_DIR}/${OUTPUT_NAME}"

echo "Build complete: ${OUTPUT_DIR}/${OUTPUT_NAME}"
