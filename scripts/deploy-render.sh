#!/usr/bin/env bash
#
# deploy-render.sh — create/trigger the Render Blueprint deploy for the
# leetcards backend via the Render REST API (https://api.render.com/v1).
#
# Usage:
#   RENDER_API_KEY=rnd_xxx bash scripts/deploy-render.sh
#
# Behaviour:
#   - If RENDER_API_KEY is unset, this is a no-op (prints a message, exits 0)
#     so the script is safe to run in CI without credentials.
#   - Otherwise it finds the service named "$RENDER_SERVICE_NAME" (default
#     "leetcards-backend") and triggers a deploy. The render.yaml blueprint
#     itself is connected once via the Render dashboard ("New > Blueprint").
#
# No secrets are hardcoded — everything comes from the environment.

set -euo pipefail

RENDER_API="https://api.render.com/v1"
SERVICE_NAME="${RENDER_SERVICE_NAME:-leetcards-backend}"

# --- No-op when credentials are absent --------------------------------------
if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "[deploy-render] RENDER_API_KEY is not set — nothing to do."
  echo "[deploy-render] Set RENDER_API_KEY and re-run, or connect the repo as a"
  echo "[deploy-render] Blueprint in the Render dashboard (uses render.yaml)."
  exit 0
fi

# Require a JSON parser; the API returns JSON we need to read.
if ! command -v curl >/dev/null 2>&1; then
  echo "[deploy-render] error: 'curl' is required but not installed." >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "[deploy-render] error: 'python3' is required but not installed." >&2
  exit 1
fi

auth_header="Authorization: Bearer ${RENDER_API_KEY}"

# --- Look up the service id by name -----------------------------------------
echo "[deploy-render] Looking up service '${SERVICE_NAME}'..."
services_json="$(curl -fsS \
  -H "${auth_header}" \
  -H "Accept: application/json" \
  "${RENDER_API}/services?name=${SERVICE_NAME}&limit=20")"

# The list endpoint returns an array of { "service": { ... } } wrappers.
service_id="$(printf '%s' "${services_json}" | python3 -c '
import json, sys
name = sys.argv[1]
try:
    data = json.load(sys.stdin)
except json.JSONDecodeError:
    data = []
for item in data:
    svc = item.get("service", item)
    if svc.get("name") == name:
        print(svc.get("id", ""))
        break
' "${SERVICE_NAME}")"

if [ -z "${service_id}" ]; then
  echo "[deploy-render] No service named '${SERVICE_NAME}' found." >&2
  echo "[deploy-render] Connect this repo as a Blueprint in the Render dashboard" >&2
  echo "[deploy-render] first (it reads render.yaml), then re-run this script." >&2
  exit 1
fi

echo "[deploy-render] Found service id: ${service_id}"

# --- Trigger a deploy --------------------------------------------------------
# clearCache: do_not_clear keeps the build cache for faster deploys.
echo "[deploy-render] Triggering deploy..."
deploy_json="$(curl -fsS -X POST \
  -H "${auth_header}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"clearCache":"do_not_clear"}' \
  "${RENDER_API}/services/${service_id}/deploys")"

deploy_id="$(printf '%s' "${deploy_json}" | python3 -c '
import json, sys
try:
    print(json.load(sys.stdin).get("id", ""))
except json.JSONDecodeError:
    pass
')"

if [ -n "${deploy_id}" ]; then
  echo "[deploy-render] Deploy triggered: ${deploy_id}"
  echo "[deploy-render] Track progress in the Render dashboard."
else
  echo "[deploy-render] Deploy request sent; response did not include an id." >&2
  echo "[deploy-render] Raw response: ${deploy_json}" >&2
fi
