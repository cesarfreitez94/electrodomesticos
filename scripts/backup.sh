#!/bin/bash
#
# Backup diario de PostgreSQL
# Ejecutado por cron del sistema a las 03:00 AM
# Ubicación: /opt/electrodomesticos/scripts/backup.sh
# Retención: 7 días
#

set -euo pipefail

BACKUP_DIR="/backups"
DB_NAME="electrodomesticos"
DB_USER="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"

pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_DIR}/${FILENAME}"

if [ -s "${BACKUP_DIR}/${FILENAME}" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup creado: ${FILENAME} ($(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1))"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Backup vacío, eliminando archivo corrupto"
  rm -f "${BACKUP_DIR}/${FILENAME}"
  exit 1
fi

find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

DELETED_COUNT=$(find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} 2>/dev/null | wc -l || echo "0")
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backups antiguos eliminados (más de ${RETENTION_DAYS} días): ${DELETED_COUNT}"

BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Total de backups actuales: ${BACKUP_COUNT}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Proceso de backup completado exitosamente"