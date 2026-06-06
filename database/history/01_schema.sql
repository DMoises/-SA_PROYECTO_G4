CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE tipo_contenido AS ENUM ('pelicula', 'serie');

CREATE TABLE progreso_reproduccion (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id      UUID           NOT NULL,
    contenido_id   UUID           NOT NULL,
    tipo           tipo_contenido NOT NULL,
    temporada      SMALLINT,
    episodio       SMALLINT,
    segundo_exacto INTEGER        NOT NULL DEFAULT 0,
    duracion_total INTEGER        NOT NULL,
    actualizado_en TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT chk_segundo CHECK (segundo_exacto BETWEEN 0 AND duracion_total),
    CONSTRAINT chk_duracion CHECK (duracion_total > 0),
    CONSTRAINT chk_coherencia CHECK (
        (tipo = 'serie'    AND temporada IS NOT NULL AND episodio IS NOT NULL)
        OR (tipo = 'pelicula' AND temporada IS NULL AND episodio IS NULL)
    ),

    CONSTRAINT uq_progreso UNIQUE NULLS NOT DISTINCT
        (perfil_id, contenido_id, temporada, episodio)
);

CREATE INDEX idx_progreso_perfil ON progreso_reproduccion (perfil_id, actualizado_en DESC);
