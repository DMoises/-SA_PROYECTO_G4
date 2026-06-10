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
	CrearPerfil(ctx context.Context, p *domain.Perfil) (string, error)
	EditarPerfil(ctx context.Context, p *domain.Perfil) error
	ListarPerfiles(ctx context.Context, usuarioID string) ([]domain.Perfil, error)
}

type AuthService struct {
	repo        UsuarioRepository
	jwt         *JWTManager
	notifClient pb.NotificationServiceClient
}

func NewAuthService(repo UsuarioRepository, jwt *JWTManager, notifClient pb.NotificationServiceClient) *AuthService {
	return &AuthService{repo: repo, jwt: jwt, notifClient: notifClient}
}

// Registrar crea una cuenta local (email + password) y su primer perfil.
func (s *AuthService) Registrar(ctx context.Context, email, password, nombrePerfil string) (string, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || len(password) < 8 || strings.TrimSpace(nombrePerfil) == "" {
		return "", "", domain.ErrDatosInvalidos
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", "", err
	}
	hashStr := string(hash)

	u := &domain.Usuario{
		Email:        email,
		PasswordHash: &hashStr,
		RolBase:      domain.RolUsuario,
	}
	id, profileId, err := s.repo.CrearUsuarioConPerfilInicial(ctx, u, strings.TrimSpace(nombrePerfil))
	if err != nil {
		return "", "", err
	}

	if s.notifClient != nil {
		go func() {
			_, notifErr := s.notifClient.EncolarCorreo(context.Background(), &pb.EncolarCorreoRequest{
				UsuarioId:    id,
				Tipo:         "registro",
				Destinatario: email,
				Datos: map[string]string{
					"nombre": strings.TrimSpace(nombrePerfil),
				},
			})
			if notifErr != nil {
				// Solo loggeamos pero no hacemos fallar el registro
				// En una app real usariamos un logger, aqui lo ignoramos silenciosamente
			}
		}()
	}

	return id, profileId, nil
}

// Login valida credenciales y devuelve un JWT.
func (s *AuthService) Login(ctx context.Context, email, password string) (string, string, time.Time, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	u, err := s.repo.ObtenerPorEmail(ctx, email)
	if err != nil {
		if err == domain.ErrUsuarioNoEncontrado {
			// No revelamos si el email existe: mismo error que password malo.
			return "", "", time.Time{}, domain.ErrCredencialesInvalidas
		}
		return "", "", time.Time{}, err
	}
	if !u.Activo() {
		return "", "", time.Time{}, domain.ErrCuentaInactiva
	}
	if !u.EsLocal() {
		return "", "", time.Time{}, domain.ErrCuentaSoloOAuth
	}
	if bcrypt.CompareHashAndPassword([]byte(*u.PasswordHash), []byte(password)) != nil {
		return "", "", time.Time{}, domain.ErrCredencialesInvalidas
	}

	token, exp, err := s.jwt.Generar(u.ID, string(u.RolBase))
	if err != nil {
		return "", "", time.Time{}, err
	}
	return token, u.ID, exp, nil
}

// ValidarToken verifica un JWT y devuelve los claims (lo usan los demas
// microservicios para propagar identidad).
func (s *AuthService) ValidarToken(_ context.Context, token string) (*Claims, error) {
	return s.jwt.Validar(token)
}

// CrearPerfil agrega un perfil a la cuenta (el limite de 5 lo refuerza el
// trigger en la base de datos).
func (s *AuthService) CrearPerfil(ctx context.Context, usuarioID, nombre, idioma string, esInfantil bool) (*domain.Perfil, error) {
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
func (s *AuthService) ListarPerfiles(ctx context.Context, usuarioID string) ([]domain.Perfil, error) {
	return s.repo.ListarPerfiles(ctx, usuarioID)
}

// EditarPerfil actualiza un perfil de la cuenta.
func (s *AuthService) EditarPerfil(ctx context.Context, usuarioID, perfilID, nombre, idioma string, esInfantil bool) (*domain.Perfil, error) {
	if strings.TrimSpace(nombre) == "" {
		return nil, domain.ErrDatosInvalidos
	}
	if idioma == "" {
		idioma = "es"
	}
	p := &domain.Perfil{
		ID:         perfilID,
		UsuarioID:  usuarioID,
		Nombre:     strings.TrimSpace(nombre),
		EsInfantil: esInfantil,
		Idioma:     idioma,
	}
	err := s.repo.EditarPerfil(ctx, p)
	if err != nil {
		return nil, err
	}
	return p, nil
}
