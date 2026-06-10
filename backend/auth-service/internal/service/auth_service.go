// Package service contiene la logica de negocio del dominio de Identidad.
// Depende de una interfaz de repositorio (no de pgx directamente), de modo
// que la base de datos es un detalle intercambiable (inversion de
// dependencias / SOLID).
package service

import (
	"context"
	"strings"
	"time"

	"github.com/grupo4/quetxaltv-auth/internal/domain"
	"github.com/grupo4/quetxaltv-auth/internal/pb"
	"golang.org/x/crypto/bcrypt"
)

// UsuarioRepository es el contrato que la capa de datos debe cumplir.
// El servicio no sabe si detras hay PostgreSQL u otra cosa.
type UsuarioRepository interface {
	CrearUsuarioConPerfilInicial(ctx context.Context, u *domain.Usuario, nombrePerfil string) (string, string, error)
	ObtenerPorEmail(ctx context.Context, email string) (*domain.Usuario, error)
	ObtenerPorID(ctx context.Context, id string) (*domain.Usuario, error)
	CambiarPassword(ctx context.Context, usuarioID, nuevoHash string) error
	CrearPerfil(ctx context.Context, p *domain.Perfil) (string, error)
	EditarPerfil(ctx context.Context, p *domain.Perfil) error
	ListarPerfiles(ctx context.Context, usuarioID string) ([]domain.Perfil, error)
	ActualizarPerfil(ctx context.Context, id, usuarioID, nuevoNombre string) error
	EliminarPerfil(ctx context.Context, id, usuarioID string) error
}

type AuthService struct {
	repo        UsuarioRepository
	jwt         *JWTManager
	notifClient pb.NotificationServiceClient
}

func NewAuthService(
	repo UsuarioRepository,
	jwt *JWTManager,
	notifClient pb.NotificationServiceClient,
) *AuthService {
	return &AuthService{
		repo:        repo,
		jwt:         jwt,
		notifClient: notifClient,
	}
}

// Registrar crea una cuenta local (email + password) y su primer perfil.
func (s *AuthService) Registrar(
	ctx context.Context,
	email string,
	password string,
	nombrePerfil string,
) (string, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	if email == "" ||
		len(password) < 8 ||
		strings.TrimSpace(nombrePerfil) == "" {
		return "", "", domain.ErrDatosInvalidos
	}

	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return "", "", err
	}

	hashStr := string(hash)

	u := &domain.Usuario{
		Email:        email,
		PasswordHash: &hashStr,
		RolBase:      domain.RolUsuario,
	}

	id, profileID, err := s.repo.CrearUsuarioConPerfilInicial(
		ctx,
		u,
		strings.TrimSpace(nombrePerfil),
	)
	if err != nil {
		return "", "", err
	}

	if s.notifClient != nil {
		go func() {
			_, notifErr := s.notifClient.EncolarCorreo(
				context.Background(),
				&pb.EncolarCorreoRequest{
					UsuarioId:    id,
					Tipo:         "registro",
					Destinatario: email,
					Datos: map[string]string{
						"nombre": strings.TrimSpace(nombrePerfil),
					},
				},
			)

			if notifErr != nil {
				// El registro no falla si la notificacion no puede enviarse.
			}
		}()
	}

	return id, profileID, nil
}

// Login valida credenciales y devuelve un JWT.
func (s *AuthService) Login(
	ctx context.Context,
	email string,
	password string,
) (string, string, time.Time, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	u, err := s.repo.ObtenerPorEmail(ctx, email)
	if err != nil {
		if err == domain.ErrUsuarioNoEncontrado {
			// No revelamos si el correo existe.
			return "", "", time.Time{},
				domain.ErrCredencialesInvalidas
		}

		return "", "", time.Time{}, err
	}

	if !u.Activo() {
		return "", "", time.Time{},
			domain.ErrCuentaInactiva
	}

	if !u.EsLocal() {
		return "", "", time.Time{},
			domain.ErrCuentaSoloOAuth
	}

	if bcrypt.CompareHashAndPassword(
		[]byte(*u.PasswordHash),
		[]byte(password),
	) != nil {
		return "", "", time.Time{},
			domain.ErrCredencialesInvalidas
	}

	token, exp, err := s.jwt.Generar(
		u.ID,
		string(u.RolBase),
		u.Email,
	)
	if err != nil {
		return "", "", time.Time{}, err
	}

	return token, u.ID, exp, nil
}

// ValidarToken verifica un JWT y devuelve los claims.
func (s *AuthService) ValidarToken(
	_ context.Context,
	token string,
) (*Claims, error) {
	return s.jwt.Validar(token)
}

// CrearPerfil agrega un perfil a la cuenta.
func (s *AuthService) CrearPerfil(
	ctx context.Context,
	usuarioID string,
	nombre string,
	idioma string,
	esInfantil bool,
) (*domain.Perfil, error) {
	if strings.TrimSpace(nombre) == "" {
		return nil, domain.ErrDatosInvalidos
	}

	if idioma == "" {
		idioma = "es"
	}

	p := &domain.Perfil{
		UsuarioID:  usuarioID,
		Nombre:     strings.TrimSpace(nombre),
		EsInfantil: esInfantil,
		Idioma:     idioma,
	}

	id, err := s.repo.CrearPerfil(ctx, p)
	if err != nil {
		return nil, err
	}

	p.ID = id

	return p, nil
}

// ListarPerfiles devuelve los perfiles de la cuenta.
func (s *AuthService) ListarPerfiles(
	ctx context.Context,
	usuarioID string,
) ([]domain.Perfil, error) {
	return s.repo.ListarPerfiles(ctx, usuarioID)
}

// ActualizarPerfil modifica el nombre de un perfil.
func (s *AuthService) ActualizarPerfil(
	ctx context.Context,
	id string,
	usuarioID string,
	nuevoNombre string,
) error {
	if strings.TrimSpace(nuevoNombre) == "" {
		return domain.ErrDatosInvalidos
	}
	return s.repo.ActualizarPerfil(ctx, id, usuarioID, strings.TrimSpace(nuevoNombre))
}

// EliminarPerfil borra un perfil de la cuenta.
func (s *AuthService) EliminarPerfil(ctx context.Context, id, usuarioID string) error {
	return s.repo.EliminarPerfil(ctx, id, usuarioID)
}

// CambiarPassword verifica la contraseña actual y actualiza el hash.
func (s *AuthService) CambiarPassword(ctx context.Context, usuarioID, passwordActual, passwordNuevo string) error {
	if len(passwordNuevo) < 8 {
		return domain.ErrDatosInvalidos
	}
	u, err := s.repo.ObtenerPorID(ctx, usuarioID)
	if err != nil {
		return err
	}
	if !u.EsLocal() {
		return domain.ErrCuentaSoloOAuth
	}
	if bcrypt.CompareHashAndPassword([]byte(*u.PasswordHash), []byte(passwordActual)) != nil {
		return domain.ErrCredencialesInvalidas
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(passwordNuevo), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.repo.CambiarPassword(ctx, usuarioID, string(hash))
}
