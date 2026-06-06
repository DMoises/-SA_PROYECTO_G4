CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE monedas (
    codigo  CHAR(3)     PRIMARY KEY,
    nombre  VARCHAR(60) NOT NULL,
    simbolo VARCHAR(8)  NOT NULL,
    CONSTRAINT chk_iso CHECK (codigo ~ '^[A-Z]{3}$')
);

CREATE TABLE tipos_cambio (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    moneda_origen  CHAR(3)       NOT NULL,
    moneda_destino CHAR(3)       NOT NULL,
    tasa           NUMERIC(18,8) NOT NULL,
    vigente        BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_consulta TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT fk_tc_origen  FOREIGN KEY (moneda_origen)  REFERENCES monedas (codigo),
    CONSTRAINT fk_tc_destino FOREIGN KEY (moneda_destino) REFERENCES monedas (codigo),
    CONSTRAINT chk_tasa CHECK (tasa > 0),
    CONSTRAINT chk_distinta CHECK (moneda_origen <> moneda_destino)
);


CREATE UNIQUE INDEX uq_tasa_vigente
    ON tipos_cambio (moneda_origen, moneda_destino) WHERE vigente = TRUE;
