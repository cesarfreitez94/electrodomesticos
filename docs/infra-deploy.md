# Infra — Despliegue VPS

## Scripts de infraestructura

| Script | Descripción | Ubicación en VPS |
|--------|-------------|------------------|
| `backup.sh` | Backup diario PostgreSQL | `/opt/electrodomesticos/scripts/backup.sh` |

## Deploy

Para desplegar los scripts de infra al VPS:

```bash
./scripts/deploy-infra.sh user@TU_IP_VPS
```

El script de deploy:
1. Copia `backup.sh` al VPS
2. Configura permisos de ejecución
3. Crea directorio `/backups`
4. Configura cron para 03:00 AM diario

## Backups

- **Schedule:** Daily 03:00 AM
- **Directorio:** `/backups`
- **Retención:** 7 días
- **Log:** `/var/log/backup.log`

## Restaurar un backup

```bash
gunzip -c /backups/backup_electrodomesticos_YYYYMMDD_HHMMSS.sql.gz | psql -U postgres electrodomesticos
```

## Ver logs

```bash
ssh user@TU_IP_VPS "tail -f /var/log/backup.log"
```

## Verificar estado

```bash
# Ver crontab
ssh user@TU_IP_VPS "crontab -l"

# Ver backups existentes
ssh user@TU_IP_VPS "ls -lh /backups/"

# Probar backup manualmente
ssh user@TU_IP_VPS "sudo -u postgres /opt/electrodomesticos/scripts/backup.sh"
```

## Logrotate

El log `/var/log/backup.log` debería rotarse. Agregar a `/etc/logrotate.d/backup`:

```
/var/log/backup.log {
  weekly
  rotate 4
  compress
  missingok
}
```