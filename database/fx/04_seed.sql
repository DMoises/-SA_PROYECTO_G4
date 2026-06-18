INSERT INTO monedas (codigo, nombre, simbolo) VALUES
    ('USD', 'Dolar estadounidense', '$'),
    ('GTQ', 'Quetzal guatemalteco', 'Q'),
    ('MXN', 'Peso mexicano', '$'),
    ('EUR', 'Euro', '€');

CALL sp_actualizar_tasa('USD', 'GTQ', 7.75);
CALL sp_actualizar_tasa('USD', 'MXN', 17.20);
CALL sp_actualizar_tasa('USD', 'EUR', 0.92);
CALL sp_actualizar_tasa('GTQ', 'USD', 0.1290);
CALL sp_actualizar_tasa('GTQ', 'MXN', 2.2193);
CALL sp_actualizar_tasa('GTQ', 'EUR', 0.1187);