#!/bin/bash

# Build script for AppleAuthHelper
# This script compiles the Swift helper for Sign in with Apple and packages it as an .app bundle

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}"
OUTPUT_NAME="AppleAuthHelper"
APP_BUNDLE="${OUTPUT_DIR}/${OUTPUT_NAME}.app"

echo "Building AppleAuthHelper..."

# Clean up old bundle if exists
rm -rf "${APP_BUNDLE}"

# Create .app bundle structure
mkdir -p "${APP_BUNDLE}/Contents/MacOS"

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

# Create universal binary directly in the bundle
lipo -create \
    "${OUTPUT_DIR}/${OUTPUT_NAME}-arm64" \
    "${OUTPUT_DIR}/${OUTPUT_NAME}-x86_64" \
    -output "${APP_BUNDLE}/Contents/MacOS/${OUTPUT_NAME}"

# Clean up architecture-specific binaries
rm "${OUTPUT_DIR}/${OUTPUT_NAME}-arm64" "${OUTPUT_DIR}/${OUTPUT_NAME}-x86_64"

# Remove old standalone binary if exists
rm -f "${OUTPUT_DIR}/${OUTPUT_NAME}"

# Copy Info.plist to bundle
cp "${SCRIPT_DIR}/Info.plist" "${APP_BUNDLE}/Contents/"

# Make executable
chmod +x "${APP_BUNDLE}/Contents/MacOS/${OUTPUT_NAME}"

echo "Build complete: ${APP_BUNDLE}"
