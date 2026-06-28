-- Migracion: agrega `creado_en` a perfiles para identificar al perfil
-- principal (administrador) por ORDEN DE CREACION (el mas antiguo = el creado
-- durante el registro). ListarPerfiles ahora ordena por creado_en, de modo que
-- el primer perfil de la lista es el administrador.
--
-- Por que: los scripts de docker-entrypoint-initdb.d SOLO corren en el primer
-- arranque (directorio de datos vacio). Si auth_db ya existia, la columna no
-- esta y los perfiles se ordenaban alfabeticamente por nombre, eligiendo como
-- "principal" al alfabeticamente primero (p. ej. Daniel) en vez del primero
-- creado (p. ej. Moises).
--
-- Como aplicarla:
--   Docker:  docker exec -i quetxal-auth-db \
--              psql -U "$AUTH_DB_USER" -d "$AUTH_DB_NAME" \
--              < database/auth/migrations/2026-06-24_add_creado_en_perfiles.sql

ALTER TABLE perfiles
    ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ NOT NULL DEFAULT now();

-- ------------------------------------------------------------------------
-- BACKFILL (solo perfiles EXISTENTES): al agregar la columna todas las filas
-- quedan con el mismo timestamp, asi que hay que fijar el orden de creacion
-- real una sola vez. Edita los nombres segun tu cuenta; el mas antiguo sera el
-- administrador. (Perfiles creados DESPUES de esta migracion ya toman su
-- creado_en automaticamente y no necesitan ajuste.)
-- ------------------------------------------------------------------------
UPDATE perfiles SET creado_en = now() - interval '30 minutes' WHERE nombre = 'Moises';
UPDATE perfiles SET creado_en = now() - interval '20 minutes' WHERE nombre = 'Ivan';
UPDATE perfiles SET creado_en = now() - interval '10 minutes' WHERE nombre = 'Daniel';
