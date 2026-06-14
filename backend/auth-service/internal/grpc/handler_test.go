package grpcserver

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/grupo4/quetxaltv-auth/internal/domain"
	"github.com/grupo4/quetxaltv-auth/internal/pb"
	"github.com/grupo4/quetxaltv-auth/internal/service"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Reutilizamos un mock simple del repositorio para los tests del handler.
type mockRepo struct {
	crearUsr     func() (string, string, error)
	obtenerEmail func() (*domain.Usuario, error)
}

func (m *mockRepo) CrearUsuarioConPerfilInicial(ctx context.Context, u *domain.Usuario, nombrePerfil string) (string, string, error) {
	return m.crearUsr()
}
func (m *mockRepo) ObtenerPorEmail(ctx context.Context, email string) (*domain.Usuario, error) {
	return m.obtenerEmail()
}
func (m *mockRepo) ObtenerPorID(ctx context.Context, id string) (*domain.Usuario, error)      { return nil, nil }
func (m *mockRepo) CambiarPassword(ctx context.Context, usuarioID, nuevoHash string) error    { return nil }
func (m *mockRepo) CrearPerfil(ctx context.Context, p *domain.Perfil) (string, error)         { return "prof-1", nil }
func (m *mockRepo) EditarPerfil(ctx context.Context, p *domain.Perfil) error                  { return nil }
func (m *mockRepo) ListarPerfiles(ctx context.Context, usuarioID string) ([]domain.Perfil, error) {
	return []domain.Perfil{{ID: "prof-1", Nombre: "Perfil 1"}}, nil
}
func (m *mockRepo) ActualizarPerfil(ctx context.Context, id, usuarioID, nuevoNombre string) error {
	return nil
}
func (m *mockRepo) EliminarPerfil(ctx context.Context, id, usuarioID string) error { return nil }

func TestHandlerRegistrar(t *testing.T) {
	repo := &mockRepo{
		crearUsr: func() (string, string, error) {
			return "usr-1", "prof-1", nil
		},
	}
	jwtMgr := service.NewJWTManager("secret", time.Hour)
	svc := service.NewAuthService(repo, jwtMgr, nil)
	handler := NewAuthHandler(svc)

	resp, err := handler.Registrar(context.Background(), &pb.RegistrarRequest{
		Email:        "test@test.com",
		Password:     "password123",
		NombrePerfil: "Perfil 1",
	})

	if err != nil {
		t.Fatalf("se esperaba exito, se obtuvo: %v", err)
	}
	if resp.UsuarioId != "usr-1" || resp.PerfilId != "prof-1" {
		t.Errorf("respuesta incorrecta: %+v", resp)
	}
}

func TestHandlerLogin(t *testing.T) {
	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	passwordHash := string(hash)

	repo := &mockRepo{
		obtenerEmail: func() (*domain.Usuario, error) {
			return &domain.Usuario{
				ID:           "usr-1",
				Email:        "test@test.com",
				PasswordHash: &passwordHash,
				RolBase:      domain.RolUsuario,
				Estado:       domain.EstadoActivo,
			}, nil
		},
	}
	jwtMgr := service.NewJWTManager("secret", time.Hour)
	svc := service.NewAuthService(repo, jwtMgr, nil)
	handler := NewAuthHandler(svc)

	resp, err := handler.Login(context.Background(), &pb.LoginRequest{
		Email:    "test@test.com",
		Password: "password123",
	})

	if err != nil {
		t.Fatalf("se esperaba exito, se obtuvo: %v", err)
	}
	if resp.AccessToken == "" || resp.UsuarioId != "usr-1" {
		t.Errorf("respuesta incorrecta: %+v", resp)
	}
}

func TestHandlerValidarToken(t *testing.T) {
	jwtMgr := service.NewJWTManager("secret", time.Hour)
	svc := service.NewAuthService(&mockRepo{}, jwtMgr, nil)
	handler := NewAuthHandler(svc)

	token, _, _ := jwtMgr.Generar("usr-1", "usuario", "test@test.com")

	resp, err := handler.ValidarToken(context.Background(), &pb.ValidarTokenRequest{
		Token: token,
	})

	if err != nil {
		t.Fatalf("error inesperado: %v", err)
	}
	if !resp.Valido || resp.UsuarioId != "usr-1" {
		t.Errorf("token deberia ser valido")
	}
}

func TestHandlerPerfilOperations(t *testing.T) {
	svc := service.NewAuthService(&mockRepo{}, service.NewJWTManager("secret", time.Hour), nil)
	handler := NewAuthHandler(svc)

	t.Run("CrearPerfil", func(t *testing.T) {
		resp, err := handler.CrearPerfil(context.Background(), &pb.CrearPerfilRequest{
			UsuarioId: "usr-1",
			Nombre:    "P1",
		})
		if err != nil {
			t.Fatalf("error: %v", err)
		}
		if resp.Nombre != "P1" {
			t.Errorf("nombre incorrecto")
		}
	})

	t.Run("ListarPerfiles", func(t *testing.T) {
		resp, err := handler.ListarPerfiles(context.Background(), &pb.ListarPerfilesRequest{
			UsuarioId: "usr-1",
		})
		if err != nil {
			t.Fatalf("error: %v", err)
		}
		if len(resp.Perfiles) != 1 || resp.Perfiles[0].Nombre != "Perfil 1" {
			t.Errorf("error al listar perfiles")
		}
	})

	t.Run("ActualizarPerfil", func(t *testing.T) {
		resp, err := handler.ActualizarPerfil(context.Background(), &pb.ActualizarPerfilRequest{
			Id:        "prof-1",
			UsuarioId: "usr-1",
			Nombre:    "P2",
		})
		if err != nil {
			t.Fatalf("error: %v", err)
		}
		if resp.Nombre != "P2" {
			t.Errorf("error al actualizar")
		}
	})

	t.Run("EliminarPerfil", func(t *testing.T) {
		resp, err := handler.EliminarPerfil(context.Background(), &pb.EliminarPerfilRequest{
			Id:        "prof-1",
			UsuarioId: "usr-1",
		})
		if err != nil {
			t.Fatalf("error: %v", err)
		}
		if !resp.Success {
			t.Errorf("deberia retornar success")
		}
	})
}

func TestHandlerEditarPerfil(t *testing.T) {
	svc := service.NewAuthService(&mockRepo{}, service.NewJWTManager("secret", time.Hour), nil)
	handler := NewAuthHandler(svc)

	resp, err := handler.EditarPerfil(context.Background(), &pb.EditarPerfilRequest{
		UsuarioId:  "usr-1",
		PerfilId:   "prof-1",
		Nombre:     "NuevoNombre",
		Idioma:     "es",
		EsInfantil: true,
	})

	if err != nil {
		t.Fatalf("error: %v", err)
	}
	if resp.Nombre != "NuevoNombre" || !resp.EsInfantil {
		t.Errorf("respuesta incorrecta")
	}
}

func TestAGRPCErrorMapping(t *testing.T) {
	cases := []struct {
		err  error
		code codes.Code
	}{
		{domain.ErrEmailYaRegistrado, codes.AlreadyExists},
		{domain.ErrCredencialesInvalidas, codes.Unauthenticated},
		{domain.ErrUsuarioNoEncontrado, codes.NotFound},
		{domain.ErrLimitePerfiles, codes.FailedPrecondition},
		{domain.ErrDatosInvalidos, codes.InvalidArgument},
		{errors.New("otro"), codes.Internal},
	}

	for _, c := range cases {
		grpcErr := aGRPC(c.err)
		st, ok := status.FromError(grpcErr)
		if !ok {
			t.Fatalf("deberia ser un error gRPC status")
		}
		if st.Code() != c.code {
			t.Errorf("para %v se esperaba codigo %v, obtenido %v", c.err, c.code, st.Code())
		}
	}
}
