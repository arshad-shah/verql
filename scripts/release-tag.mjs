// Auto-create release tags when a version bump lands on `main`, so nobody has to
// push tags by hand. Run on every push to main (release-version.yml).
//
// Handles BOTH releasable packages:
//   • the app  → `vX.Y.Z`        from package.json
//   • the SDK  → `sdk-vX.Y.Z`    from packages/plugin-sdk/package.json
//
// For each, it tags ONLY when this push actually changed that package's version
// (i.e. the merged "Version Packages" PR) AND no matching tag exists yet — so
// ordinary pushes, and re-runs, are no-ops. Tags are pushed with the default
// GITHUB_TOKEN (no PAT): release-version.yml invokes release.yml / publish-sdk.yml
// directly as reusable workflows, so nothing depends on a tag triggering a run.
//
// Emits Actions outputs per target: `app_tagged`/`app_tag` and
// `sdk_tagged`/`sdk_tag`, so the workflow knows which reusable workflow to call.
import { execSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'

const sh = (cmd) => execSync(cmd, { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim()
const tryGet = (cmd) => { try { return sh(cmd) } catch { return null } }

/** Emit a GitHub Actions step output (no-op when run locally). */
function setOutput(key, value) {
  const file = process.env.GITHUB_OUTPUT
  if (file) appendFileSync(file, `${key}=${value}\n`)
}

const versionOf = (path) => {
  try { return JSON.parse(readFileSync(path, 'utf-8')).version } catch { return null }
}
const prevVersionOf = (path) => {
  const prev = tryGet(`git show HEAD^:${path}`)
  try { return prev ? JSON.parse(prev).version : null } catch { return null }
}

const TARGETS = [
  { id: 'app', pkg: 'package.json', tag: (v) => `v${v}` },
  { id: 'sdk', pkg: 'packages/plugin-sdk/package.json', tag: (v) => `sdk-v${v}` },
]

// Annotated tags (`git tag -a`) need a committer identity, and CI runners have
// none configured. Set one (locally, only when missing) so tagging never dies
// with "empty ident name". Mirrors the bot identity the rest of the flow uses.
if (!tryGet('git config user.email')) {
  execSync('git config user.name "github-actions[bot]"', { stdio: 'inherit' })
  execSync('git config user.email "github-actions[bot]@users.noreply.github.com"', { stdio: 'inherit' })
}

for (const t of TARGETS) {
  const version = versionOf(t.pkg)
  const tag = version ? t.tag(version) : null
  setOutput(`${t.id}_tag`, tag ?? '')

  if (!version) { console.log(`[${t.id}] no package — skipping.`); setOutput(`${t.id}_tagged`, 'false'); continue }

  // Did THIS push bump the version? Compare HEAD's package.json to its first
  // parent (old `main` on a Version-PR merge; unchanged on an ordinary push).
  const prev = prevVersionOf(t.pkg)
  if (prev === null || prev === version) {
    console.log(`[${t.id}] version unchanged (${version}) — nothing to tag.`)
    setOutput(`${t.id}_tagged`, 'false')
    continue
  }
  // Already tagged? (idempotent / re-run safe)
  if (tryGet(`git ls-remote --tags origin refs/tags/${tag}`)) {
    console.log(`[${t.id}] tag ${tag} already exists on origin — nothing to do.`)
    setOutput(`${t.id}_tagged`, 'false')
    continue
  }

  console.log(`[${t.id}] version bumped ${prev} → ${version}. Creating tag ${tag}…`)
  execSync(`git tag -a ${tag} -m "Release ${tag}"`, { stdio: 'inherit' })
  try {
    execSync(`git push origin ${tag}`, { stdio: 'inherit' })
  } catch (err) {
    // The usual culprit is a repository ruleset that "restricts tag creations":
    // the push is rejected with GH013 "Cannot create ref due to creations being
    // restricted". The github-actions[bot] is a system bot and can't be added to
    // a ruleset's bypass list, so the fix isn't a token — it's the ruleset.
    console.error(
      `\n[${t.id}] Failed to push tag ${tag}.\n` +
        `If the error above is a ruleset violation (GH013 "creations being\n` +
        `restricted"), a repository ruleset is blocking tag creation. Release\n` +
        `tags no longer trigger anything, so that restriction only blocks this\n` +
        `auto-tagger. Fix it by running scripts/setup-release-gates.sh (it drops\n` +
        `the creation restriction and keeps release tags immutable instead).\n` +
        `See .github/maintainers/release.md → "Tag protection".\n`
    )
    throw err
  }
  console.log(`[${t.id}] pushed ${tag}.`)
  setOutput(`${t.id}_tagged`, 'true')
}
