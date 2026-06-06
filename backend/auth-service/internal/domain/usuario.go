// Package domain contiene las entidades de negocio y reglas puras del
// dominio de Identidad. No depende de frameworks ni de la base de datos
// (principio de inversion de dependencias).
package domain

import "time"

// RolBase refleja el ENUM rol_base de la tabla usuarios.
type RolBase string

const (
	RolUsuario RolBase = "usuario"
	RolAdmin   RolBase = "admin"
)

// EstadoUsuario refleja el ENUM estado de la tabla usuarios.
type EstadoUsuario string

const (
	EstadoActivo     EstadoUsuario = "activo"
	EstadoSuspendido EstadoUsuario = "suspendido"
	EstadoEliminado  EstadoUsuario = "eliminado"
)

// Usuario mapea la tabla usuarios de auth_db.
// PasswordHash y OAuthProveedor son punteros porque la columna es NULLABLE
// (una cuenta puede ser solo-password o solo-OAuth).
type Usuario struct {
	ID             string
	Email          string
	PasswordHash   *string
	OAuthProveedor *string
	RolBase        RolBase
	Estado         EstadoUsuario
	CreadoEn       time.Time
	ActualizadoEn  time.Time
}

// EsLocal indica si la cuenta puede iniciar sesion con password.
func (u *Usuario) EsLocal() bool {
	return u.PasswordHash != nil && *u.PasswordHash != ""
}

// Activo indica si la cuenta puede operar.
func (u *Usuario) Activo() bool {
	return u.Estado == EstadoActivo
}

// Perfil mapea la tabla perfiles de auth_db.
type Perfil struct {
	ID         string
	UsuarioID  string
	Nombre     string
	EsInfantil bool
	Idioma     string
}
