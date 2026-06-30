-- Migracion: agrega `notificado_estreno` a contenido para soportar los correos
-- de estreno (TAREA 3). Es la bandera de idempotencia que usa el CronJob
-- estreno-notify (k8s/cronjobs/estreno-notify-cronjob.yaml): detecta los
-- titulos cuya fecha_estreno ya paso y que aun tienen el flag en FALSE, encola
-- el correo `nuevo_contenido` por usuario y solo entonces lo marca en TRUE.
--
-- Por que: los scripts de docker-entrypoint-initdb.d (incluido 01_schema.sql,
-- donde ya vive esta columna para BD nuevas) SOLO corren en el primer arranque
-- (directorio de datos vacio). Si catalog_db YA existia, la columna no esta y
-- el CronJob fallaria al consultarla.
--
-- IMPORTANTE — evitar un correo masivo en BD ya sembrada: tras crear la columna
-- con DEFAULT FALSE, TODOS los titulos ya estrenados quedarian "sin notificar"
-- y el primer ciclo del CronJob enviaria un correo de cada titulo viejo a cada
-- usuario. Por eso el backfill marca como notificados los titulos cuya fecha de
-- estreno YA paso; solo los estrenos FUTUROS dispararan correo al llegar su
-- fecha. (El filtro del CronJob es: activo AND NOT notificado_estreno AND
-- fecha_estreno IS NOT NULL AND fecha_estreno <= now()).
--
-- Como aplicarla:
--   Docker (local/VM):  docker exec -i quetxal-catalog-db \
--                         psql -U "$CATALOG_DB_USER" -d "$CATALOG_DB_NAME" \
--                         < database/catalog/migrations/2026-06-30_add_notificado_estreno_contenido.sql
--
--   BD externa (Fase 3, VM 10.10.0.10:5434):
--                       psql -h 10.10.0.10 -p 5434 -U "$CATALOG_DB_USER" \
--                         -d "$CATALOG_DB_NAME" \
--                         -f database/catalog/migrations/2026-06-30_add_notificado_estreno_contenido.sql
--
-- Idempotente: usa IF NOT EXISTS, se puede correr mas de una vez sin error.

ALTER TABLE contenido
    ADD COLUMN IF NOT EXISTS notificado_estreno BOOLEAN NOT NULL DEFAULT FALSE;

-- Indice parcial que sirve la consulta del CronJob (mismo patron que
-- idx_buzon_pendientes en database/notification/01_schema.sql).
CREATE INDEX IF NOT EXISTS idx_contenido_estrenos_pendientes
    ON contenido (fecha_estreno)
    WHERE activo AND NOT notificado_estreno;

-- Backfill: los titulos cuyo estreno ya ocurrio se consideran ya notificados,
-- para no reenviar correos de catalogo antiguo. Los estrenos futuros quedan en
-- FALSE y se notificaran al llegar su fecha.
UPDATE contenido
   SET notificado_estreno = TRUE
 WHERE fecha_estreno IS NOT NULL
   AND fecha_estreno <= now()
   AND notificado_estreno = FALSE;

-- ------------------------------------------------------------------------
