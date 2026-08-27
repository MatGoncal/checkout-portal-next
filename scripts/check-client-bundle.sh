#!/usr/bin/env bash
set -euo pipefail

# The browser bundle must never carry the partner credential or the webhook
# secret. Run after `npm run build`.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE="$ROOT/.next/static"

if [[ ! -d "$BUNDLE" ]]; then
  echo "Client bundle not found at $BUNDLE — run npm run build first." >&2
  exit 1
fi

SECRETS=(
  "NEXT_PUBLIC_API_KEY"
  "NEXT_PUBLIC_WEBHOOK_SECRET"
  "${API_KEY:-demo-partner-key}"
  "${WEBHOOK_SECRET:-dev-webhook-secret}"
)

status=0
for secret in "${SECRETS[@]}"; do
  if grep -rIlF -- "$secret" "$BUNDLE" >/dev/null 2>&1; then
    echo "Secret leaked into the client bundle: $secret" >&2
    grep -rIlF -- "$secret" "$BUNDLE" >&2
    status=1
  fi
done

if [[ $status -ne 0 ]]; then
  exit 1
fi

echo "Client bundle carries no server credential."
