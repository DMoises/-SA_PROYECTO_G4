CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE estado_suscripcion AS ENUM ('activa', 'cancelada', 'vencida', 'pendiente');

CREATE TABLE planes (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_plan VARCHAR(100)  NOT NULL,
    precio_base NUMERIC(10,2) NOT NULL,
    moneda_base CHAR(3)       NOT NULL DEFAULT 'USD',

    CONSTRAINT uq_planes_nombre UNIQUE (nombre_plan),
    CONSTRAINT chk_precio CHECK (precio_base >= 0)
);

CREATE TABLE suscripciones (
    id                 UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id         UUID               NOT NULL,
    plan_id            UUID               NOT NULL,
    estado_suscripcion estado_suscripcion NOT NULL DEFAULT 'pendiente',
    fecha_inicio       DATE               NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin          DATE,

    CONSTRAINT fk_suscripciones_plan FOREIGN KEY (plan_id) REFERENCES planes (id)
);

CREATE UNIQUE INDEX uq_una_activa_por_usuario
    ON suscripciones (usuario_id) WHERE estado_suscripcion = 'activa';

CREATE TABLE pagos (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    suscripcion_id UUID          NOT NULL,
    monto          NUMERIC(10,2) NOT NULL,
    moneda_pago    CHAR(3)       NOT NULL,
    fecha_pago     TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT fk_pagos_suscripcion FOREIGN KEY (suscripcion_id)
        REFERENCES suscripciones (id),
    CONSTRAINT chk_monto CHECK (monto >= 0)
);

CREATE INDEX idx_suscripciones_usuario ON suscripciones (usuario_id);
CREATE INDEX idx_pagos_suscripcion     ON pagos (suscripcion_id);
