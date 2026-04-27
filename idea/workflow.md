# Workflow de Tasks

## Al completar una task

1. **Commit y push a dev:**
   ```bash
   git checkout dev
   git add .
   git commit -m "feat: implement TASK-XX - <descripcion>"
   git push origin dev
   ```

2. **Renombrar archivo de task:**
   ```bash
   mv idea/task-XX-*.md idea/task-XX-*.done.md
   ```

## Estado de tasks

| #  | Task                              | Estado   |
|----|-----------------------------------|----------|
| 01 | Setup inicial                     | DONE     |
| 02 | Prisma schema y migraciones        | DONE     |
| 03 | Autenticación (NextAuth)           | DONE     |
| 04 | Middleware y protección rutas      | DONE     |
| 05 | API pública (citas, servicios...)  | DONE     |
| 06 | Asignación automática técnico      | DONE     |
| 07 | Emails (Resend)                    | DONE     |
| 08 | Scheduler / cron jobs              | DONE     |
| 09 | UI pública (agenda, confirmación)   | DONE     |
| 10 | Dashboard admin                    | DONE     |
| 11 | Gestión de citas admin             | DONE     |
| 12 | Calendario disponibilidad admin    | PENDIENTE|
| 13 | CRUDs admin (técnicos, servicios) | PENDIENTE|
| 14 | Notificaciones admin              | PENDIENTE|
| 15 | Configuración admin               | PENDIENTE|
| 16 | Portal técnico                     | PENDIENTE|
| 17 | SEO y performance                 | PENDIENTE|
| 18 | Backup                            | PENDIENTE|
