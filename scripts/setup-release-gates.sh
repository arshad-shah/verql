#!/usr/bin/env bash
#
# One-shot setup of the release approval gates this repo's pipeline expects.
# Run it ONCE, locally, as a repository admin. It is idempotent — safe to re-run.
#
#   gh auth login            # as a repo admin (arshad-shah)
#   ./scripts/setup-release-gates.sh
#
# Configures, via the GitHub REST API (using your `gh` auth):
#   1. The `release` environment with you as a Required Reviewer + a
#      protected-branches deployment policy. This is the manual-approval lock on
#      release.yml's `publish` job (mirrors the existing `npm-publish` env).
#   2. Branch protection on `main`: require a PR and a Code-Owner approval before
#      merging — so nothing (including the auto-generated Version PR) lands
#      without your review.
#
# It does NOT (can't be set reliably via this API; do it in the UI if you want):
#   • Require approval for fork-PR CI → Settings → Actions → General →
#     "Fork pull request workflows from outside collaborators".
# No PAT is needed — release-version.yml calls release.yml as a reusable
# workflow, so nothing depends on a token that can trigger workflows.
#
# Requires: gh (https://cli.github.com), authenticated with admin on the repo.
set -euo pipefail

OWNER="${OWNER:-arshad-shah}"
REPO="${REPO:-verql}"
REVIEWER="${REVIEWER:-arshad-shah}"   # the GitHub user who must approve releases
ENVIRONMENT="${ENVIRONMENT:-release}"

command -v gh >/dev/null || { echo "error: gh CLI not found — https://cli.github.com" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "error: run 'gh auth login' first (as a repo admin)" >&2; exit 1; }

echo "› Resolving reviewer '$REVIEWER'…"
REVIEWER_ID="$(gh api "users/${REVIEWER}" --jq '.id')"
REVIEWER_TYPE="$(gh api "users/${REVIEWER}" --jq '.type')"   # "User" or "Organization"
echo "  $REVIEWER → id $REVIEWER_ID ($REVIEWER_TYPE)"

echo "› Creating/updating the '$ENVIRONMENT' environment with a required reviewer…"
gh api -X PUT "repos/${OWNER}/${REPO}/environments/${ENVIRONMENT}" --input - >/dev/null <<JSON
{
  "wait_timer": 0,
  "prevent_self_review": false,
  "reviewers": [{ "type": "${REVIEWER_TYPE}", "id": ${REVIEWER_ID} }],
  "deployment_branch_policy": { "protected_branches": true, "custom_branch_policies": false }
}
JSON
echo "  ✓ '$ENVIRONMENT' now pauses release.yml's publish job for $REVIEWER's approval."

echo "› Protecting 'main' (require a PR + a Code-Owner approval)…"
gh api -X PUT "repos/${OWNER}/${REPO}/branches/main/protection" --input - >/dev/null <<'JSON'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
echo "  ✓ 'main' requires a PR + Code-Owner review (admins may still merge; enforce_admins=false)."

cat <<DONE

Done — both gates are set, and no PAT is needed.
  • Optional: Settings → Actions → General → require approval for fork-PR CI.

See .github/maintainers/release.md for the full flow.
DONE
