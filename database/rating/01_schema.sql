CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE tipo_calificacion AS ENUM ('estrella', 'pulgar');

CREATE TABLE calificacion_usuario (
    id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id    UUID              NOT NULL,
    contenido_id UUID              NOT NULL,
    tipo         tipo_calificacion NOT NULL,
    valor        SMALLINT          NOT NULL,
    creada_en    TIMESTAMPTZ       NOT NULL DEFAULT now(),

    CONSTRAINT uq_voto UNIQUE (perfil_id, contenido_id),
    CONSTRAINT chk_valor CHECK (
        (tipo = 'estrella' AND valor BETWEEN 1 AND 5)
        OR (tipo = 'pulgar' AND valor IN (0,1))
    )
);

CREATE TABLE resumen_recomendacion (
    contenido_id    UUID         PRIMARY KEY,
    total_votos     INTEGER      NOT NULL DEFAULT 0,
    votos_positivos INTEGER      NOT NULL DEFAULT 0,
    porcentaje      NUMERIC(5,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_calif_contenido ON calificacion_usuario (contenido_id);
