let latest_version = (open package.json | get version)
let changelog_version = (open CHANGELOG.md | lines | first 1 | split column ' ' | get column1 | str trim '[##]')
let release_version = $env.GITHUB_EVENT_RELEASE_TAG_NAME
let release_name = $env.GITHUB_EVENT_RELEASE_NAME

if ($latest_version != $changelog_version) {
  echo "failure_reason=Changelog version ($changelog_version) does not match package version ($latest_version)" >> $env.GITHUB_OUTPUT
  exit 1
}
if ($latest_version != $release_version) {
  echo "failure_reason=Release version ($release_version) does not match package version ($latest_version)" >> $env.GITHUB_OUTPUT
  exit 1
}
if ($latest_version != $release_name) {
  echo "failure_reason=Release name ($release_name) does not match package version ($latest_version)" >> $env.GITHUB_OUTPUT
  exit 1
}