#!/usr/bin/env bash
set -u

# Vercel interprets exit 0 as "ignore this build" and exit 1 as "continue building".
# Be deliberately conservative: only skip when every changed file is clearly documentation-only.
BASE_SHA="${VERCEL_GIT_PREVIOUS_SHA:-}"

# Vercel can expose the previous successful deployment SHA even when that commit is
# not present in the local clone used by the Ignored Build Step. In that case,
# fall back to the immediate parent, which is the comparison form shown in Vercel's
# official ignoreCommand example. If neither ref is resolvable, build safely.
if [ -n "$BASE_SHA" ] && ! git rev-parse "$BASE_SHA" >/dev/null 2>&1; then
  echo "Previous deployment SHA is not available in this clone; falling back to HEAD^."
  BASE_SHA=""
fi

if [ -z "$BASE_SHA" ] && git rev-parse HEAD^ >/dev/null 2>&1; then
  BASE_SHA="HEAD^"
fi

if [ -z "$BASE_SHA" ]; then
  echo "Unable to resolve a comparison SHA; continue with build."
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
    *.md|*.mdx|README|README.*|CHANGELOG|CHANGELOG.*|CONTRIBUTING|CONTRIBUTING.*|CODE_OF_CONDUCT|CODE_OF_CONDUCT.*|SECURITY|SECURITY.*|LICENSE|LICENSE.*|docs/*|documentation/*|.github/ISSUE_TEMPLATE/*|.github/PULL_REQUEST_TEMPLATE*)
      ;;
    *)
      echo "Runtime-affecting change detected: $file"
      exit 1
      ;;
  esac
done <<EOF
$CHANGED_FILES
EOF

echo "Documentation-only change detected; skipping Vercel build."
exit 0
