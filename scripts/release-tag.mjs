// Auto-create the `vX.Y.Z` release tag when a version bump lands on `main`, so
// nobody has to push tags by hand. Run on every push to main (release-version.yml).
//
// It tags ONLY when this push actually changed package.json's version (i.e. the
// merged "Version Packages" PR) AND no matching tag exists yet — so ordinary
// pushes, and re-runs, are no-ops. The tag is pushed with the default
// GITHUB_TOKEN (no PAT needed): release-version.yml invokes release.yml directly
// as a reusable workflow, so nothing depends on the tag triggering a workflow.
//
// Emits Actions outputs `tagged` (true/false) and `tag` so the workflow can
// decide whether to call release.yml.
import { execSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'

const sh = (cmd) => execSync(cmd, { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim()
const tryGet = (cmd) => { try { return sh(cmd) } catch { return null } }

const version = JSON.parse(readFileSync('package.json', 'utf-8')).version
const tag = `v${version}`

/** Emit a GitHub Actions step output (no-op when run locally). */
function setOutput(key, value) {
  const file = process.env.GITHUB_OUTPUT
  if (file) appendFileSync(file, `${key}=${value}\n`)
}

function done(tagged) {
  setOutput('tagged', String(tagged))
  setOutput('tag', tag)
  process.exit(0)
}

// Did THIS push bump the version? Compare HEAD's package.json against its first
// parent. On a Version-PR merge the parent is old `main` (old version); on an
// ordinary push the version is unchanged.
const prevPkg = tryGet('git show HEAD^:package.json')
const prevVersion = prevPkg ? JSON.parse(prevPkg).version : null
if (prevVersion === null) {
  console.log('No parent commit to compare — skipping tag.')
  done(false)
}
if (prevVersion === version) {
  console.log(`Version unchanged (${version}) — nothing to tag.`)
  done(false)
}

// Already tagged? (idempotent / re-run safe)
if (tryGet(`git ls-remote --tags origin refs/tags/${tag}`)) {
  console.log(`Tag ${tag} already exists on origin — nothing to do.`)
  done(false)
}

console.log(`Version bumped ${prevVersion} → ${version}. Creating release tag ${tag}…`)
execSync(`git tag -a ${tag} -m "Release ${tag}"`, { stdio: 'inherit' })
execSync(`git push origin ${tag}`, { stdio: 'inherit' })
console.log(`Pushed ${tag}. release.yml will build + publish (gated by the release environment).`)
done(true)
