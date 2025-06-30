const { AndroidConfig, withAndroidManifest } = require("@expo/config-plugins")
const { Paths } = require("@expo/config-plugins/build/android")
const path = require("pathe")
const fs = require("node:fs")

const fsPromises = fs.promises

const { getMainApplicationOrThrow } = AndroidConfig.Manifest

const withTrustLocalCerts = (config) => {
  return withAndroidManifest(config, async (config) => {
    config.modResults = await setCustomConfigAsync(config, config.modResults)
    return config
  })
}

async function setCustomConfigAsync(config, androidManifest) {
  const src_file_pat = path.join(__dirname, "network_security_config.xml")
  const res_file_path = path.join(
    await Paths.getResourceFolderAsync(config.modRequest.projectRoot),
    "xml",
    "network_security_config.xml",
  )

  const res_dir = path.resolve(res_file_path, "..")

  if (!fs.existsSync(res_dir)) {
    await fsPromises.mkdir(res_dir)
  }

  await fsPromises.copyFile(src_file_pat, res_file_path)

  const mainApplication = getMainApplicationOrThrow(androidManifest)
  mainApplication.$["android:networkSecurityConfig"] = "@xml/network_security_config"

  return androidManifest
}

module.exports = withTrustLocalCerts
