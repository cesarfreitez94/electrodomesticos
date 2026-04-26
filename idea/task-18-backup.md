# TASK-18 · Implementar script de backup con pg_dump + cron

> **Grupo funcional:** Infra / Backups
> **Referencia SDD:** § 8 (Backups: pg_dump diario 03:00 AM, gzip, retención 7 días), § 9 (Dependencias Técnicas — Backups)
> **Referencia PRD:** RNF (Disponibilidad 99% — backups como parte de la estrategia)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-18 — Backups |
| Estimación | XS (< 2 horas) |
| Prioridad | Media |
| Tipo | Infra |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El script de backup hace un `pg_dump` diario de la base de datos PostgreSQL a las 03:00 AM, comprime con gzip y mantiene los últimos 7 días de backups. El script vive en el VPS, no en el repositorio git. La entrada de cron del sistema operativo programa la ejecución.

---

## Lo que hay que hacer

### 1. Crear el script de backup `scripts/backup.sh`

Crear `scripts/backup.sh` (no agregar al repositorio git — solo vive en el VPS):

```bash
#!/bin/bash
#
# Backup diario de PostgreSQL
# Ejecutado por cron del sistema a las 03:00 AM
# Ubicación: /opt/electrodomesticos/scripts/backup.sh
# Retención: 7 días
#

set -euo pipefail

# Configuración
BACKUP_DIR="/backups"
DB_NAME="electrodomesticos"
DB_USER="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

# Crear directorio de backups si no existe
mkdir -p "${BACKUP_DIR}"

# Hacer el backup con pg_dump
pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_DIR}/${FILENAME}"

# Verificar que el archivo no esté vacío
if [ -s "${BACKUP_DIR}/${FILENAME}" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup creado: ${FILENAME} ($(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1))"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Backup vacío, eliminando archivo corrupto"
  rm -f "${BACKUP_DIR}/${FILENAME}"
  exit 1
fi

# Eliminar backups antiguos (más de 7 días)
find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Log del cleanup
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} 2>/dev/null | wc -l || echo "0")
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backups antiguos eliminados (más de ${RETENTION_DAYS} días): ${DELETED_COUNT}"

# Mostrar cuántos backups hay actualmente
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Total de backups actuales: ${BACKUP_COUNT}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Proceso de backup completado exitosamente"
```

### 2. Dar permisos de ejecución al script

```bash
chmod +x /opt/electrodomesticos/scripts/backup.sh
```

### 3. Crear directorio de backups

```bash
mkdir -p /backups
chmod 755 /backups
```

### 4. Agregar entrada al cron del sistema

```bash
# Editar crontab
crontab -e

# Agregar la línea:
0 3 * * * /opt/electrodomesticos/scripts/backup.sh >> /var/log/backup.log 2>&1
```

Esto ejecuta el backup todos los días a las 03:00 AM y redirige la salida a `/var/log/backup.log`.

### 5. Probar el script manualmente

```bash
sudo -u postgres /opt/electrodomesticos/scripts/backup.sh
```

Verificar que el archivo `.sql.gz` aparece en `/backups/`.

### 6. Documentar en un README de infra (opcional)

Crear `docs/infra.md` en el VPS con:

```markdown
# Infra — VPS

## Backups

- Script: `/opt/electrodomesticos/scripts/backup.sh`
- Schedule: Daily 03:00 AM
- Directorio: `/backups`
- Retención: 7 días
- Log: `/var/log/backup.log`

## Restaurar un backup

```bash
gunzip -c /backups/backup_electrodomesticos_YYYYMMDD_HHMMSS.sql.gz | psql -U postgres electrodomesticos
```

## Ver logs

```bash
tail -f /var/log/backup.log
```
```

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] El script `scripts/backup.sh` existe y es ejecutable (`chmod +x`)
- [ ] El directorio `/backups` existe y tiene permisos 755
- [ ] La entrada de cron está configurada para 03:00 AM diario
- [ ] Al ejecutar el script manualmente, genera un archivo `.sql.gz` en `/backups/`
- [ ] El archivo de backup no está vacío
- [ ] Los backups de más de 7 días se eliminan automáticamente
- [ ] La salida del script se redirige a `/var/log/backup.log`

---

## Dependencias

- Requiere: Acceso al VPS con PostgreSQL corriendo
- No bloquea tasks

---

## Notas para el ejecutor

- El script NO se agrega al repositorio git. Solo vive en el VPS. Si se pierde el VPS, el script se pierde — por eso se documenta aquí
- Si el usuario de PostgreSQL no es `postgres`, cambiar `DB_USER` en el script
- Para restaurar: `gunzip -c backup.sql.gz | psql -U user dbname`
- El log rotation del sistema debería rotar `/var/log/backup.log` para que no crezca indefinidamente. Si no hay logrotate configurado, agregarlo:
  ```
  /var/log/backup.log {
    weekly
    rotate 4
    compress
    missingok
  }
  ```
- Si el disco del VPS se llena, los backups pueden fallar. Monitorear el espacio disponible

---

## Checklist de cierre

- [ ] Script creado y ejecutable
- [ ] Cron configurado para 03:00 AM diario
- [ ] Backup manual exitoso — archivo `.sql.gz` generado
- [ ] Verificación de archivo no vacío
- [ ] Limpieza de backups > 7 días funcional
- [ ] Log en `/var/log/backup.log`

---

*Fin de TASK-18. Última task del proyecto.*