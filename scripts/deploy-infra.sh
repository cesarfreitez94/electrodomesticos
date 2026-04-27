#!/bin/bash
#
# Deploy de scripts de infraestructura al VPS
# Uso: ./deploy-infra.sh user@host
#

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Uso: $0 user@host"
  exit 1
fi

TARGET="${1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="scripts/backup.sh"

echo "=== Deploy de Infra al VPS: ${TARGET} ==="

echo "[1/4] Copiando script de backup..."
scp "${SCRIPT_DIR}/${BACKUP_SCRIPT}" "${TARGET}:/opt/electrodomesticos/scripts/"

echo "[2/4] Configurando permisos de ejecución..."
ssh "${TARGET}" "chmod +x /opt/electrodomesticos/scripts/backup.sh"

echo "[3/4] Creando directorio de backups..."
ssh "${TARGET}" "mkdir -p /backups && chmod 755 /backups"

echo "[4/4] Configurando cron (03:00 AM diario)..."
ssh "${TARGET}" "crontab -l 2>/dev/null | grep -v 'backup.sh' ; echo '0 3 * * * /opt/electrodomesticos/scripts/backup.sh >> /var/log/backup.log 2>&1' | crontab -"

echo ""
echo "=== Deploy completado ==="
echo "Verificar con: ssh ${TARGET} 'crontab -l'"
echo "Probar backup:  ssh ${TARGET} 'sudo -u postgres /opt/electrodomesticos/scripts/backup.sh'"