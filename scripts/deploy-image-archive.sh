#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
ARCHIVE_PATH="${ARCHIVE_PATH:-dist/image-worker-image.tar.gz}"
REMOTE_DIR="${REMOTE_DIR:-/opt/image-worker}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 user@host" >&2
  echo "Optional env: ARCHIVE_PATH=dist/image-worker-image.tar.gz REMOTE_DIR=/opt/image-worker COMPOSE_FILE=docker-compose.yml" >&2
  exit 1
fi

if [[ ! -f "$ARCHIVE_PATH" ]]; then
  echo "Archive not found: $ARCHIVE_PATH" >&2
  echo "Run scripts/build-image-local.sh first." >&2
  exit 1
fi

echo "Preparing $REMOTE_DIR on $TARGET..."
ssh "$TARGET" "mkdir -p '$REMOTE_DIR'"

echo "Uploading image archive and compose file..."
scp "$ARCHIVE_PATH" "$TARGET:$REMOTE_DIR/image-worker-image.tar.gz"
scp "$COMPOSE_FILE" "$TARGET:$REMOTE_DIR/docker-compose.yml"

echo "Loading image and restarting container on server..."
ssh "$TARGET" "cd '$REMOTE_DIR' && gunzip -c image-worker-image.tar.gz | docker load && docker compose up -d --remove-orphans"

echo "Deployment complete."
