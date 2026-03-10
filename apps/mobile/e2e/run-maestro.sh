#!/usr/bin/env sh
set -eu

platform="${1:?platform is required}"
debug_output="${MAESTRO_DEBUG_OUTPUT:-e2e/artifacts/${platform}}"
run_suffix="$(date +%s)-$$"

mkdir -p "${debug_output}"

: "${E2E_PASSWORD:=Password123!}"
: "${E2E_EMAIL:=folo-e2e-${platform}-${run_suffix}@example.com}"

export E2E_EMAIL
export E2E_PASSWORD

resolve_ios_device() {
  if [ -n "${MAESTRO_IOS_DEVICE_ID:-}" ]; then
    printf '%s' "${MAESTRO_IOS_DEVICE_ID}"
    return
  fi

  xcrun simctl list devices booted | awk -F '[()]' '/Booted/ && $2 ~ /^[A-F0-9-]+$/ { print $2; exit }'
}

resolve_android_device() {
  if [ -n "${MAESTRO_ANDROID_DEVICE_ID:-}" ]; then
    printf '%s' "${MAESTRO_ANDROID_DEVICE_ID}"
    return
  fi

  adb devices | awk '$2 == "device" && $1 != "List" { print $1; exit }'
}

extract_ios_app_from_tar() {
  tar_path="$1"
  dest_dir="${2:?destination is required}"
  mkdir -p "${dest_dir}"
  tar -xzf "${tar_path}" -C "${dest_dir}"
  find "${dest_dir}" -maxdepth 3 -name 'Folo.app' | head -n1
}

resolve_ios_app_path() {
  if [ -n "${MAESTRO_IOS_APP_PATH:-}" ]; then
    if [ -d "${MAESTRO_IOS_APP_PATH}" ]; then
      printf '%s' "${MAESTRO_IOS_APP_PATH}"
      return
    fi

    if [ -f "${MAESTRO_IOS_APP_PATH}" ] && echo "${MAESTRO_IOS_APP_PATH}" | grep -q '\.tar\.gz$'; then
      extract_dir="$(mktemp -d /tmp/folo-ios-app-XXXXXX)"
      extract_ios_app_from_tar "${MAESTRO_IOS_APP_PATH}" "${extract_dir}"
      return
    fi
  fi

  latest_tar="$(find . -maxdepth 1 -name 'build-*.tar.gz' | sort | tail -n1)"
  if [ -n "${latest_tar}" ]; then
    extract_dir="$(mktemp -d /tmp/folo-ios-app-XXXXXX)"
    extract_ios_app_from_tar "${latest_tar}" "${extract_dir}"
    return
  fi

  find "$HOME/Library/Developer/Xcode/DerivedData" -path '*Build/Products/Release-iphonesimulator/Folo.app' | head -n1
}

wait_for_android_ready() {
  device_id="$1"

  for _ in $(seq 1 90); do
    boot_completed=$(adb -s "${device_id}" shell getprop sys.boot_completed 2>/dev/null | awk 'NF { print $1; exit }')
    if [ "$boot_completed" = "1" ] && adb -s "${device_id}" shell cmd package list packages >/dev/null 2>&1; then
      sleep 20
      return
    fi
    sleep 2
  done

  echo "Android device ${device_id} did not finish booting in time." >&2
  exit 1
}

prepare_ios_simulator() {
  device_id="$1"
  xcrun simctl shutdown "${device_id}" >/dev/null 2>&1 || true
  xcrun simctl erase "${device_id}" >/dev/null 2>&1 || true
  xcrun simctl boot "${device_id}" >/dev/null 2>&1 || true
  xcrun simctl bootstatus "${device_id}" -b >/dev/null 2>&1 || true
  xcrun simctl shutdown "${device_id}" >/dev/null 2>&1 || true

  simulator_data="$HOME/Library/Developer/CoreSimulator/Devices/${device_id}/data"
  for rel in \
    Containers/Shared/SystemGroup/systemgroup.com.apple.configurationprofiles/Library/ConfigurationProfiles/UserSettings.plist \
    Library/UserConfigurationProfiles/EffectiveUserSettings.plist \
    Library/UserConfigurationProfiles/PublicInfo/PublicEffectiveUserSettings.plist
  do
    file="${simulator_data}/${rel}"
    if [ -f "${file}" ]; then
      /usr/libexec/PlistBuddy -c 'Add :restrictedBool dict' "${file}" 2>/dev/null || true
      /usr/libexec/PlistBuddy -c 'Add :restrictedBool:allowPasswordAutoFill dict' "${file}" 2>/dev/null || true
      /usr/libexec/PlistBuddy -c 'Set :restrictedBool:allowPasswordAutoFill:value false' "${file}" 2>/dev/null \
        || /usr/libexec/PlistBuddy -c 'Add :restrictedBool:allowPasswordAutoFill:value bool false' "${file}" >/dev/null 2>&1 || true
    fi
  done

  xcrun simctl boot "${device_id}" >/dev/null 2>&1 || true
  xcrun simctl bootstatus "${device_id}" -b >/dev/null 2>&1 || true
}

case "${platform}" in
  ios)
    device_id="$(resolve_ios_device)"
    if [ -z "${device_id}" ]; then
      echo "No booted iOS simulator found. Set MAESTRO_IOS_DEVICE_ID or boot a simulator first." >&2
      exit 1
    fi

    app_path="$(resolve_ios_app_path)"
    if [ -z "${app_path}" ] || [ ! -d "${app_path}" ]; then
      echo "Unable to resolve a built iOS .app bundle. Set MAESTRO_IOS_APP_PATH or place a build-*.tar.gz in apps/mobile." >&2
      exit 1
    fi

    prepare_ios_simulator "${device_id}"
    xcrun simctl install "${device_id}" "${app_path}" >/dev/null 2>&1 || true
    xcrun simctl launch "${device_id}" is.follow >/dev/null 2>&1 || true

    maestro test --format junit --platform ios --device "${device_id}" --debug-output "${debug_output}/auth" \
      -e E2E_EMAIL="${E2E_EMAIL}" -e E2E_PASSWORD="${E2E_PASSWORD}" e2e/flows/ios/auth.yaml

    ;;
  android)
    flow_target="e2e/flows/${platform}/core.yaml"
    device_id="$(resolve_android_device)"
    if [ -z "${device_id}" ]; then
      echo "No booted Android emulator found. Set MAESTRO_ANDROID_DEVICE_ID or boot an emulator first." >&2
      exit 1
    fi
    wait_for_android_ready "${device_id}"
    adb -s "${device_id}" shell pm clear is.follow >/dev/null 2>&1 || true
    adb -s "${device_id}" shell monkey -p is.follow -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
    maestro test --format junit --platform android --device "${device_id}" --debug-output "${debug_output}" \
      -e E2E_EMAIL="${E2E_EMAIL}" -e E2E_PASSWORD="${E2E_PASSWORD}" "${flow_target}"
    ;;
  *)
    echo "Unsupported platform: ${platform}" >&2
    exit 1
    ;;
esac
