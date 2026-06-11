// Maintain the "Version Packages" PR from pending changesets, so releasing is
// just: merge that PR (your approval is the gate), and the tag + build happen
// automatically. Run on every push to main (release-version.yml).
//
// If there are pending changesets, this (re)generates the version bump +
// CHANGELOG on a side branch and opens/updates a PR. If there are none, it's a
// no-op. No third-party action — just the changesets CLI + `gh` (both present
// on the runner), to keep the pipeline SHA-pinned and self-owned.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const run = (cmd) => execSync(cmd, { stdio: 'inherit' })
const out = (cmd) => execSync(cmd, { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim()
const ok = (cmd) => { try { execSync(cmd, { stdio: 'ignore' }); return true } catch { return false } }

const BRANCH = 'changeset-release/main'

// Pending changesets = any .md in .changeset besides the README.
const pending = readdirSync('.changeset').filter((f) => f.endsWith('.md') && f !== 'README.md')
if (pending.length === 0) {
  console.log('No pending changesets — no Version PR needed.')
  process.exit(0)
}

run('git config user.name "github-actions[bot]"')
run('git config user.email "github-actions[bot]@users.noreply.github.com"')
run(`git checkout -B ${BRANCH}`)
run('pnpm changeset version')

if (!out('git status --porcelain')) {
  console.log('`changeset version` produced no changes — skipping.')
  process.exit(0)
}

const version = JSON.parse(readFileSync('package.json', 'utf-8')).version
run('git add -A')
run(`git commit -m "chore(release): version packages (v${version})"`)
run(`git push -f origin ${BRANCH}`)

const title = `chore(release): v${version}`
const body = [
  `Merging this PR releases **v${version}**.`,
  '',
  'It consumes the pending changesets, bumps the version, and updates the',
  'changelog. On merge, `release-version.yml` auto-creates the `v' + version + '`',
  'tag, which triggers `release.yml` to build the binaries — and the publish',
  'job waits for your approval in the `release` environment.',
  '',
  'Review the version bump + changelog, then merge to cut the release.',
].join('\n')

if (ok(`gh pr view ${BRANCH} --json number`)) {
  run(`gh pr edit ${BRANCH} --title ${JSON.stringify(title)} --body ${JSON.stringify(body)}`)
  console.log('Updated the existing Version PR.')
} else {
  run(`gh pr create --base main --head ${BRANCH} --title ${JSON.stringify(title)} --body ${JSON.stringify(body)}`)
  console.log('Opened the Version PR.')
}
