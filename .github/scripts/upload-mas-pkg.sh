#!/usr/bin/env bash

set -euo pipefail

pkg_path="${1:-}"

if [[ -z "$pkg_path" ]]; then
  echo "Usage: $0 <pkg-path>" >&2
  exit 1
fi

if [[ ! -f "$pkg_path" ]]; then
  echo "Mac App Store package not found: $pkg_path" >&2
  exit 1
fi

if ! command -v xcrun >/dev/null 2>&1; then
  echo "xcrun is required to upload a Mac App Store package." >&2
  exit 1
fi

upload_cmd=(
  xcrun
  altool
  --upload-package
  "$pkg_path"
  --wait
  --show-progress
  --output-format
  json
)

if [[ -z "${APPLE_ID:-}" || -z "${APPLE_PASSWORD:-}" ]]; then
  echo "APPLE_ID and APPLE_PASSWORD must be set." >&2
  exit 1
fi

upload_cmd+=(
  -u
  "$APPLE_ID"
  -p
  "@env:APPLE_PASSWORD"
)

run_upload() {
  local output
  local exit_code

  set +e
  output="$("${upload_cmd[@]}" 2>&1)"
  exit_code=$?
  set -e

  printf '%s\n' "$output"
  return "$exit_code"
}

echo "Uploading Mac App Store package with Apple ID: ${pkg_path}"
if run_upload; then
  exit 0
fi

echo "Upload failed without provider selection. Checking App Store Connect providers..."
set +e
providers_output="$(
  xcrun altool --list-providers -u "$APPLE_ID" -p "@env:APPLE_PASSWORD" 2>&1
)"
providers_exit=$?
set -e

printf '%s\n' "$providers_output"

if [[ $providers_exit -ne 0 ]]; then
  echo "Failed to list providers after upload failure." >&2
  exit 1
fi

mapfile -t provider_ids < <(
  printf '%s\n' "$providers_output" \
    | perl -ne 'print "$1\n" if /publicid[^[:alnum:]]+([[:alnum:]-]+)/i' \
    | awk '!seen[$0]++'
)

if [[ ${#provider_ids[@]} -ne 1 ]]; then
  cat >&2 <<'EOF'
Unable to infer a single App Store Connect provider for this Apple ID.
Use an Apple ID that only belongs to one provider, or upload once manually to confirm which provider should receive the build.
EOF
  exit 1
fi

upload_cmd+=(
  --provider-public-id
  "${provider_ids[0]}"
)

echo "Retrying upload with detected provider: ${provider_ids[0]}"
run_upload
