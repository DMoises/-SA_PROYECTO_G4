CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE rol_base       AS ENUM ('usuario', 'admin');
CREATE TYPE estado_usuario AS ENUM ('activo', 'suspendido', 'eliminado');
CREATE TYPE idioma_perfil  AS ENUM ('es', 'en', 'pt', 'fr');

CREATE TABLE usuarios (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(150)   NOT NULL,
    password_hash   VARCHAR(255),                 
    oauth_proveedor VARCHAR(50),                   
    rol_base        rol_base       NOT NULL DEFAULT 'usuario',
    estado          estado_usuario NOT NULL DEFAULT 'activo',
    creado_en       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT chk_email CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),

    CONSTRAINT chk_metodo_auth CHECK (password_hash IS NOT NULL OR oauth_proveedor IS NOT NULL)
);

CREATE TABLE perfiles (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID          NOT NULL,
    nombre      VARCHAR(50)   NOT NULL,
    es_infantil BOOLEAN       NOT NULL DEFAULT FALSE,
    idioma      idioma_perfil NOT NULL DEFAULT 'es',

    CONSTRAINT fk_perfiles_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT uq_perfil_nombre UNIQUE (usuario_id, nombre)
);


CREATE TABLE auditoria_usuarios (
    id               BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id       UUID        NOT NULL,
    estado_anterior  VARCHAR(255),
    estado_nuevo     VARCHAR(255),
    campo_actualizar VARCHAR(255),
    registrado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_perfiles_usuario  ON perfiles (usuario_id);
CREATE INDEX idx_auditoria_usuario ON auditoria_usuarios (usuario_id);
