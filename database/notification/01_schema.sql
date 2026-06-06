CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE tipo_correo  AS ENUM ('registro', 'recibo', 'nuevo_contenido');
CREATE TYPE estado_envio AS ENUM ('pendiente', 'enviado', 'fallido');

CREATE TABLE buzon_salida (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id   UUID         NOT NULL,
    tipo         tipo_correo  NOT NULL,
    payload      JSONB        NOT NULL,
    estado_envio estado_envio NOT NULL DEFAULT 'pendiente',
    intentos     SMALLINT     NOT NULL DEFAULT 0,
    creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    enviado_en   TIMESTAMPTZ,

    CONSTRAINT chk_intentos CHECK (intentos >= 0)
);

CREATE INDEX idx_buzon_pendientes ON buzon_salida (creado_en) WHERE estado_envio = 'pendiente';
