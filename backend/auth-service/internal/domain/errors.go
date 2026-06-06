package domain

import "errors"

// Errores de negocio. La capa gRPC los traduce a codigos gRPC apropiados,
// de modo que el dominio no conoce el transporte.
var (
	ErrEmailYaRegistrado     = errors.New("el email ya esta registrado")
	ErrCredencialesInvalidas = errors.New("credenciales invalidas")
	ErrUsuarioNoEncontrado   = errors.New("usuario no encontrado")
	ErrCuentaInactiva        = errors.New("la cuenta no esta activa")
	ErrCuentaSoloOAuth       = errors.New("la cuenta solo admite inicio de sesion por OAuth")
	ErrLimitePerfiles        = errors.New("la cuenta ya alcanzo el maximo de 5 perfiles")
	ErrTokenInvalido         = errors.New("token invalido o expirado")
	ErrDatosInvalidos        = errors.New("datos de entrada invalidos")
)
