CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE tipo_contenido     AS ENUM ('pelicula', 'serie');
CREATE TYPE clasificacion_edad AS ENUM ('TP', '+7', '+13', '+16', '+18');

CREATE TABLE contenido (
    id             UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo         VARCHAR(150)       NOT NULL,
    tipo           tipo_contenido     NOT NULL,
    sinopsis       TEXT,
    anio           SMALLINT,
    clasificacion  clasificacion_edad NOT NULL DEFAULT 'TP',
    duracion_min   INTEGER,

    portada_url    TEXT,
    video_url      TEXT,
    fecha_estreno  TIMESTAMP,

    activo         BOOLEAN            NOT NULL DEFAULT TRUE,

    -- TAREA 3 — Correos de estreno: bandera de idempotencia. El CronJob
    -- estreno-notify (k8s/cronjobs/estreno-notify-cronjob.yaml) detecta los
    -- títulos cuya fecha_estreno ya pasó y que todavía tienen este flag en
    -- FALSE, encola el correo `nuevo_contenido` por usuario y solo entonces lo
    -- marca en TRUE. Así un mismo estreno nunca se notifica dos veces.
    notificado_estreno BOOLEAN        NOT NULL DEFAULT FALSE,

    CONSTRAINT chk_anio CHECK (anio IS NULL OR anio BETWEEN 1888 AND 2100)
);

CREATE TABLE generos (
    id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL,
    CONSTRAINT uq_generos UNIQUE (nombre)
);

CREATE TABLE categorias (
    id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL,
    CONSTRAINT uq_categorias UNIQUE (nombre)
);

CREATE TABLE contenido_genero (
    contenido_id UUID NOT NULL,
    genero_id    UUID NOT NULL,
    PRIMARY KEY (contenido_id, genero_id),
    CONSTRAINT fk_cg_cont FOREIGN KEY (contenido_id) REFERENCES contenido (id) ON DELETE CASCADE,
    CONSTRAINT fk_cg_gen  FOREIGN KEY (genero_id)    REFERENCES generos (id)   ON DELETE CASCADE
);

CREATE TABLE contenido_categoria (
    contenido_id UUID NOT NULL,
    categoria_id UUID NOT NULL,
    PRIMARY KEY (contenido_id, categoria_id),
    CONSTRAINT fk_cc_cont FOREIGN KEY (contenido_id) REFERENCES contenido (id)  ON DELETE CASCADE,
    CONSTRAINT fk_cc_cat  FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE CASCADE
);

CREATE TABLE temporadas (
    id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    contenido_id UUID     NOT NULL,
    numero       INTEGER  NOT NULL,
    CONSTRAINT fk_temp_cont FOREIGN KEY (contenido_id) REFERENCES contenido (id) ON DELETE CASCADE,
    CONSTRAINT uq_temp UNIQUE (contenido_id, numero)
);

CREATE TABLE episodios (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    temporada_id UUID         NOT NULL,
    numero       INTEGER      NOT NULL,
    titulo       VARCHAR(100) NOT NULL,
    duracion_min INTEGER      NOT NULL,
    video_url    TEXT,
    CONSTRAINT fk_epi_temp FOREIGN KEY (temporada_id) REFERENCES temporadas (id) ON DELETE CASCADE,
    CONSTRAINT uq_epi UNIQUE (temporada_id, numero)
);

CREATE TABLE actores (
    id     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE reparto (
    contenido_id UUID         NOT NULL,
    actor_id     UUID         NOT NULL,
    personaje    VARCHAR(150) NOT NULL,
    rol          VARCHAR(50)  NOT NULL DEFAULT 'secundario',
    PRIMARY KEY (contenido_id, actor_id),
    CONSTRAINT fk_rep_cont  FOREIGN KEY (contenido_id) REFERENCES contenido (id) ON DELETE CASCADE,
    CONSTRAINT fk_rep_actor FOREIGN KEY (actor_id)     REFERENCES actores (id)   ON DELETE CASCADE
);

CREATE INDEX idx_contenido_titulo ON contenido (lower(titulo));
CREATE INDEX idx_contenido_fecha_estreno ON contenido (fecha_estreno);
-- TAREA 3 — índice parcial que sirve la consulta del CronJob de estrenos:
-- solo títulos activos, ya estrenados y aún sin notificar (mismo patrón que
-- idx_buzon_pendientes en database/notification/01_schema.sql).
CREATE INDEX idx_contenido_estrenos_pendientes
    ON contenido (fecha_estreno)
    WHERE activo AND NOT notificado_estreno;
CREATE INDEX idx_temp_cont ON temporadas (contenido_id);
CREATE INDEX idx_epi_temp  ON episodios (temporada_id);
CREATE INDEX idx_rep_actor ON reparto (actor_id);