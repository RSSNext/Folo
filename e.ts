const commitMessage = 'chore: Release v1.11.1'
const semverRegex =
  /chore: Release (v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z-.]+)?)/;
const match = commitMessage.match(semverRegex);
if (match) {
  console.log(`::set-output name=version::${match[1]}`);
} else {
  console.log("No SemVer found in commit body.");
}
 