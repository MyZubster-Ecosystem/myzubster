#!/usr/bin/env bash
set -u

# Vercel interprets exit 0 as "ignore this build" and exit 1 as "continue building".
# Be deliberately conservative: skip only documentation and known deployment-neutral operational tooling.
BASE_SHA="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"

if ! git rev-parse "$BASE_SHA" >/dev/null 2>&1; then
  echo "Unable to resolve previous deployment SHA; continue with build."
  exit 1
fi

CHANGED_FILES="$(git diff --name-only "$BASE_SHA" HEAD 2>/dev/null || true)"

if [ -z "$CHANGED_FILES" ]; then
  echo "Unable to determine a non-empty change set; continue with build."
  exit 1
fi

while IFS= read -r file; do
  [ -z "$file" ] && continue
  case "$file" in
    *.md|*.mdx|README|README.*|CHANGELOG|CHANGELOG.*|CONTRIBUTING|CONTRIBUTING.*|CODE_OF_CONDUCT|CODE_OF_CONDUCT.*|SECURITY|SECURITY.*|LICENSE|LICENSE.*|docs/*|documentation/*|.github/ISSUE_TEMPLATE/*|.github/PULL_REQUEST_TEMPLATE*|.github/workflows/operational-smoke.yml|scripts/production-smoke.js|scripts/vercel-ignore-build.sh)
      ;;
    *)
      echo "Runtime-affecting change detected: $file"
      exit 1
      ;;
  esac
done <<EOF
$CHANGED_FILES
EOF

echo "Deployment-neutral change detected; skipping Vercel build."
exit 0
