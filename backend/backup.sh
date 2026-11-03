#!/usr/bin/env bash
# Daily backup (NFR2). Schedule with cron:  0 2 * * *  cd /path/to/umoja-sacco-api && bash backup.sh
set -e
set -a; source .env; set +a
mkdir -p backups
FILE="backups/${DB_NAME}_$(date +%F).sql"
MYSQL_PWD="$DB_PASSWORD" mysqldump -h "${DB_HOST:-localhost}" -u "$DB_USER" "$DB_NAME" > "$FILE"
echo "Backup written to $FILE"
find backups -name '*.sql' -mtime +14 -delete   # keep 14 days
