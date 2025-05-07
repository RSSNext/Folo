#!/bin/bash

LAST_DEPLOY_COMMIT=$(git rev-parse HEAD^)

CHANGED_FILES=$(git diff --name-only $LAST_DEPLOY_COMMIT HEAD)

ONLY_SERVER_CHANGES=true
for file in $CHANGED_FILES; do
  if [[ $file != apps/ssr/* ]]; then
    ONLY_SERVER_CHANGES=false
    break
  fi
done

if [ "$ONLY_SERVER_CHANGES" = true ]; then

  echo "skip"
  exit 0
else
  echo "continue"
  exit 1
fi
