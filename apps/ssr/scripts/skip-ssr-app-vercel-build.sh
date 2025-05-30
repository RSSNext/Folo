#!/bin/bash

LAST_DEPLOY_COMMIT=$(git rev-parse HEAD^)

CHANGED_FILES=$(git diff --name-only $LAST_DEPLOY_COMMIT HEAD)

echo "Changed files: $CHANGED_FILES"

# Define an array of paths and files to check
CHECK_PATHS_AND_FILES=("apps/ssr/" "packages/" "apps/ssr/package.json" "pnpm-lock.yaml" "locales/common" "locales/errors" "locales/external")

ONLY_SERVER_OR_PACKAGES_CHANGES=false
for file in $CHANGED_FILES; do
  MATCH_FOUND=false
  for path in "${CHECK_PATHS_AND_FILES[@]}"; do

    if [[ "$file" =~ ^"$path" ]]; then

      echo "Match file: $file"
      MATCH_FOUND=true
      break
    fi
  done
  if [ "$MATCH_FOUND" = true ]; then
    ONLY_SERVER_OR_PACKAGES_CHANGES=true
    break
  fi
done

if [ "$ONLY_SERVER_OR_PACKAGES_CHANGES" = true ]; then
  echo "continue"
  exit 1
else
  echo "skip"
  exit
fi
