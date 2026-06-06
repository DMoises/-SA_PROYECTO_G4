INSERT INTO monedas (codigo, nombre, simbolo) VALUES
    ('USD', 'Dolar estadounidense', '$'),
    ('GTQ', 'Quetzal guatemalteco', 'Q'),
    ('MXN', 'Peso mexicano', '$'),
    ('EUR', 'Euro', '€');

CALL sp_actualizar_tasa('USD', 'GTQ', 7.75);
CALL sp_actualizar_tasa('USD', 'MXN', 17.20);
CALL sp_actualizar_tasa('USD', 'EUR', 0.92);
