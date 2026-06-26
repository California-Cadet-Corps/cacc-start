#!/usr/bin/env bash
#
# Roll back start.cacadets.org to the previous (or a specific) release.
# Run ON THE SERVER as the deploy user:
#
#   ./rollback.sh                 # roll back to the previous release
#   ./rollback.sh <commit-sha>    # roll back to a specific release dir
#   ./rollback.sh --list          # list available releases
#
set -euo pipefail

APP_NAME="cacc-start"
BASE="${LINODE_DEPLOY_PATH:-/var/www/${APP_NAME}}"
RELEASES="${BASE}/releases"

list_releases() {
  echo "Available releases (newest first):"
  ls -1dt "${RELEASES}"/*/ | sed 's#.*/releases/##; s#/##'
  echo "Currently active: $(basename "$(readlink -f "${BASE}/current")")"
}

if [ "${1:-}" = "--list" ]; then
  list_releases
  exit 0
fi

CURRENT="$(basename "$(readlink -f "${BASE}/current")")"

if [ -n "${1:-}" ]; then
  TARGET="$1"
else
  # Pick the most recent release that is NOT the current one.
  TARGET="$(ls -1dt "${RELEASES}"/*/ | sed 's#.*/releases/##; s#/##' | grep -v "^${CURRENT}$" | head -n1 || true)"
fi

if [ -z "${TARGET:-}" ] || [ ! -d "${RELEASES}/${TARGET}" ]; then
  echo "ERROR: no valid rollback target found (${TARGET:-none})." >&2
  list_releases
  exit 1
fi

echo ">> Rolling back: ${CURRENT}  ->  ${TARGET}"
ln -sfn "${RELEASES}/${TARGET}" "${BASE}/current"
sudo systemctl restart "${APP_NAME}"

# Verify health.
for i in $(seq 1 10); do
  if curl -fsS http://127.0.0.1:3000/healthz >/dev/null; then
    echo ">> Rollback OK — ${TARGET} is live and healthy."
    exit 0
  fi
  sleep 3
done

echo "ERROR: service did not become healthy after rollback." >&2
exit 1
