CREATE OR REPLACE VIEW vista_buzon_pendiente AS
SELECT id, usuario_id, tipo, payload, intentos, creado_en
FROM buzon_salida
WHERE estado_envio = 'pendiente'
ORDER BY creado_en ASC;
