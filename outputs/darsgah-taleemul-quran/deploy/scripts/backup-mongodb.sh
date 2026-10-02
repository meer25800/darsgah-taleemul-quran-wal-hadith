#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/darsgahkongamdara"
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"

mkdir -p "$BACKUP_DIR"
mongodump --uri="$MONGO_URI" --archive="$BACKUP_DIR/mongodb-$STAMP.archive.gz" --gzip
find "$BACKUP_DIR" -type f -name "mongodb-*.archive.gz" -mtime +14 -delete

echo "MongoDB backup created: $BACKUP_DIR/mongodb-$STAMP.archive.gz"
