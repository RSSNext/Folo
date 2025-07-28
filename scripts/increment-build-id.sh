#!/bin/bash

# Script to check if the current branch is a release branch and if there are staged changes in apps/mobile/src
# If both conditions are met, automatically increment the iOS and Android build ID

set -e

# Get the current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Check if it is a release branch
if [[ ! "$CURRENT_BRANCH" =~ ^release/ ]]; then
  exit 0
fi

# Check if there are staged changes in apps/mobile/src
MOBILE_SRC_CHANGES=$(git diff --cached --name-only | grep "^apps/mobile/src" || true)

if [ -z "$MOBILE_SRC_CHANGES" ]; then
  echo "No changes in apps/mobile/src, skipping build ID increment"
  exit 0
fi

echo "Found changes in apps/mobile/src on release branch, incrementing build ID..."

# iOS Info.plist path
IOS_INFO_PLIST="apps/mobile/ios/Folo/Info.plist"

if [ -f "$IOS_INFO_PLIST" ]; then
  # Get the current build ID
  CURRENT_BUILD=$(plutil -extract CFBundleVersion raw "$IOS_INFO_PLIST")
  
  # Increment build ID
  NEW_BUILD=$((CURRENT_BUILD + 1))
  
  # Update Info.plist
  plutil -replace CFBundleVersion -string "$NEW_BUILD" "$IOS_INFO_PLIST"
  
  echo "iOS build ID updated from $CURRENT_BUILD to $NEW_BUILD"
  
  # Add the updated Info.plist to the staged area
  git add "$IOS_INFO_PLIST"
else
  echo "Warning: iOS Info.plist not found at $IOS_INFO_PLIST"
fi


echo "Build ID increment completed" 