package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/grupo4/quetxaltv-auth/internal/domain"
	"github.com/grupo4/quetxaltv-auth/internal/pb"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc"
)

// MockUsuarioRepository implementa la interfaz UsuarioRepository para pruebas.
type MockUsuarioRepository struct {
	CrearUsuarioConPerfilInicialFunc func(ctx context.Context, u *domain.Usuario, nombrePerfil string) (string, string, error)
	ObtenerPorEmailFunc              func(ctx context.Context, email string) (*domain.Usuario, error)
	ObtenerPorIDFunc                 func(ctx context.Context, id string) (*domain.Usuario, error)
	CambiarPasswordFunc              func(ctx context.Context, usuarioID, nuevoHash string) error
	CrearPerfilFunc                  func(ctx context.Context, p *domain.Perfil) (string, error)
	EditarPerfilFunc                 func(ctx context.Context, p *domain.Perfil) error
	ListarPerfilesFunc               func(ctx context.Context, usuarioID string) ([]domain.Perfil, error)
	ActualizarPerfilFunc             func(ctx context.Context, id, usuarioID, nuevoNombre string) error
	EliminarPerfilFunc               func(ctx context.Context, id, usuarioID string) error
}

func (m *MockUsuarioRepository) CrearUsuarioConPerfilInicial(ctx context.Context, u *domain.Usuario, nombrePerfil string) (string, string, error) {
	return m.CrearUsuarioConPerfilInicialFunc(ctx, u, nombrePerfil)
}

func (m *MockUsuarioRepository) ObtenerPorEmail(ctx context.Context, email string) (*domain.Usuario, error) {
	return m.ObtenerPorEmailFunc(ctx, email)
}

func (m *MockUsuarioRepository) ObtenerPorID(ctx context.Context, id string) (*domain.Usuario, error) {
	return m.ObtenerPorIDFunc(ctx, id)
}

func (m *MockUsuarioRepository) CambiarPassword(ctx context.Context, usuarioID, nuevoHash string) error {
	return m.CambiarPasswordFunc(ctx, usuarioID, nuevoHash)
}

func (m *MockUsuarioRepository) CrearPerfil(ctx context.Context, p *domain.Perfil) (string, error) {
	return m.CrearPerfilFunc(ctx, p)
}

func (m *MockUsuarioRepository) EditarPerfil(ctx context.Context, p *domain.Perfil) error {
	return m.EditarPerfilFunc(ctx, p)
}

func (m *MockUsuarioRepository) ListarPerfiles(ctx context.Context, usuarioID string) ([]domain.Perfil, error) {
	return m.ListarPerfilesFunc(ctx, usuarioID)
}

func (m *MockUsuarioRepository) ActualizarPerfil(ctx context.Context, id, usuarioID, nuevoNombre string) error {
	return m.ActualizarPerfilFunc(ctx, id, usuarioID, nuevoNombre)
}

func (m *MockUsuarioRepository) EliminarPerfil(ctx context.Context, id, usuarioID string) error {
	return m.EliminarPerfilFunc(ctx, id, usuarioID)
}

// MockNotificationServiceClient implementa NotificationServiceClient para pruebas.
type MockNotificationServiceClient struct {
	pb.NotificationServiceClient
	EncolarCorreoFunc func(ctx context.Context, in *pb.EncolarCorreoRequest, opts ...grpc.CallOption) (*pb.EncolarCorreoResponse, error)
}

func (m *MockNotificationServiceClient) EncolarCorreo(ctx context.Context, in *pb.EncolarCorreoRequest, opts ...grpc.CallOption) (*pb.EncolarCorreoResponse, error) {
	if m.EncolarCorreoFunc != nil {
		return m.EncolarCorreoFunc(ctx, in, opts...)
	}
	return &pb.EncolarCorreoResponse{Id: "1", Estado: "pendiente"}, nil
}

func TestRegistrar(t *testing.T) {
	jwtMgr := NewJWTManager("secretkey123", time.Hour)
	notifMock := &MockNotificationServiceClient{}

	t.Run("Registro exitoso", func(t *testing.T) {
		repoMock := &MockUsuarioRepository{
			CrearUsuarioConPerfilInicialFunc: func(ctx context.Context, u *domain.Usuario, nombrePerfil string) (string, string, error) {
				if u.Email != "test@gmail.com" || nombrePerfil != "Perfil1" {
					return "", "", errors.New("datos invalidos")
				}
				return "usr-123", "prof-456", nil
			},
		}
		svc := NewAuthService(repoMock, jwtMgr, notifMock)
		usrID, profID, err := svc.Registrar(context.Background(), "test@gmail.com", "password123", "Perfil1")
		if err != nil {
			t.Fatalf("se esperaba exito, se obtuvo error: %v", err)
		}
		if usrID != "usr-123" || profID != "prof-456" {
			t.Errorf("datos devueltos invalidos: %s, %s", usrID, profID)
		}
	})

	t.Run("Registro con datos invalidos", func(t *testing.T) {
		repoMock := &MockUsuarioRepository{}
		svc := NewAuthService(repoMock, jwtMgr, notifMock)

		_, _, err := svc.Registrar(context.Background(), "", "password123", "Perfil1")
		if !errors.Is(err, domain.ErrDatosInvalidos) {
			t.Errorf("se esperaba ErrDatosInvalidos, se obtuvo: %v", err)
		}

		_, _, err = svc.Registrar(context.Background(), "test@gmail.com", "short", "Perfil1")
		if !errors.Is(err, domain.ErrDatosInvalidos) {
			t.Errorf("se esperaba ErrDatosInvalidos por pass corto, se obtuvo: %v", err)
		}
	})
}

func TestLogin(t *testing.T) {
	jwtMgr := NewJWTManager("secretkey123", time.Hour)
	notifMock := &MockNotificationServiceClient{}

	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	passwordHash := string(hash)

	t.Run("Login exitoso", func(t *testing.T) {
		repoMock := &MockUsuarioRepository{
			ObtenerPorEmailFunc: func(ctx context.Context, email string) (*domain.Usuario, error) {
				return &domain.Usuario{
					ID:           "usr-123",
					Email:        "test@gmail.com",
					PasswordHash: &passwordHash,
					RolBase:      domain.RolUsuario,
					Estado:       domain.EstadoActivo,
				}, nil
			},
		}
		svc := NewAuthService(repoMock, jwtMgr, notifMock)
		token, usrID, _, err := svc.Login(context.Background(), "test@gmail.com", "password123")
		if err != nil {
			t.Fatalf("se esperaba exito, se obtuvo error: %v", err)
		}
		if usrID != "usr-123" || token == "" {
			t.Errorf("datos devueltos invalidos")
		}
	})

	t.Run("Login usuario inactivo", func(t *testing.T) {
		repoMock := &MockUsuarioRepository{
			ObtenerPorEmailFunc: func(ctx context.Context, email string) (*domain.Usuario, error) {
				return &domain.Usuario{
					ID:           "usr-123",
					Email:        "test@gmail.com",
					PasswordHash: &passwordHash,
					RolBase:      domain.RolUsuario,
					Estado:       domain.EstadoSuspendido,
				}, nil
			},
		}
		svc := NewAuthService(repoMock, jwtMgr, notifMock)
		_, _, _, err := svc.Login(context.Background(), "test@gmail.com", "password123")
		if !errors.Is(err, domain.ErrCuentaInactiva) {
			t.Errorf("se esperaba ErrCuentaInactiva, se obtuvo: %v", err)
		}
	})

	t.Run("Login cuenta OAuth", func(t *testing.T) {
		prov := "google"
		repoMock := &MockUsuarioRepository{
			ObtenerPorEmailFunc: func(ctx context.Context, email string) (*domain.Usuario, error) {
				return &domain.Usuario{
					ID:              "usr-123",
					Email:           "test@gmail.com",
					OAuthProveedor:  &prov,
					RolBase:         domain.RolUsuario,
					Estado:          domain.EstadoActivo,
				}, nil
			},
		}
		svc := NewAuthService(repoMock, jwtMgr, notifMock)
		_, _, _, err := svc.Login(context.Background(), "test@gmail.com", "password123")
		if !errors.Is(err, domain.ErrCuentaSoloOAuth) {
			t.Errorf("se esperaba ErrCuentaSoloOAuth, se obtuvo: %v", err)
		}
	})

	t.Run("Login password incorrecto", func(t *testing.T) {
		repoMock := &MockUsuarioRepository{
			ObtenerPorEmailFunc: func(ctx context.Context, email string) (*domain.Usuario, error) {
				return &domain.Usuario{
					ID:           "usr-123",
					Email:        "test@gmail.com",
					PasswordHash: &passwordHash,
					RolBase:      domain.RolUsuario,
					Estado:       domain.EstadoActivo,
				}, nil
			},
		}
		svc := NewAuthService(repoMock, jwtMgr, notifMock)
		_, _, _, err := svc.Login(context.Background(), "test@gmail.com", "wrongpass")
		if !errors.Is(err, domain.ErrCredencialesInvalidas) {
			t.Errorf("se esperaba ErrCredencialesInvalidas, se obtuvo: %v", err)
		}
	})
}

func TestCrearPerfil(t *testing.T) {
	jwtMgr := NewJWTManager("secretkey123", time.Hour)
	notifMock := &MockNotificationServiceClient{}

	t.Run("Crear perfil exitoso", func(t *testing.T) {
		repoMock := &MockUsuarioRepository{
			CrearPerfilFunc: func(ctx context.Context, p *domain.Perfil) (string, error) {
				if p.Nombre != "MiPerfil" || p.UsuarioID != "usr-123" {
					return "", errors.New("datos incorrectos")
				}
				return "prof-123", nil
			},
		}
		svc := NewAuthService(repoMock, jwtMgr, notifMock)
		p, err := svc.CrearPerfil(context.Background(), "usr-123", "MiPerfil", "es", false, "1234")
		if err != nil {
			t.Fatalf("error: %v", err)
		}
		if p.ID != "prof-123" || p.Nombre != "MiPerfil" {
			t.Errorf("perfil devuelto invalido: %+v", p)
		}
	})

	t.Run("Crear perfil limite excedido", func(t *testing.T) {
		repoMock := &MockUsuarioRepository{
			CrearPerfilFunc: func(ctx context.Context, p *domain.Perfil) (string, error) {
				return "", domain.ErrLimitePerfiles
			},
		}
		svc := NewAuthService(repoMock, jwtMgr, notifMock)
		_, err := svc.CrearPerfil(context.Background(), "usr-123", "MiPerfil", "es", false, "1234")
		if !errors.Is(err, domain.ErrLimitePerfiles) {
			t.Errorf("se esperaba ErrLimitePerfiles, se obtuvo: %v", err)
		}
	})
}

func TestEditarPerfil(t *testing.T) {
	jwtMgr := NewJWTManager("secretkey123", time.Hour)
	repoMock := &MockUsuarioRepository{
		EditarPerfilFunc: func(ctx context.Context, p *domain.Perfil) error {
			if p.ID != "prof-123" || p.Nombre != "NuevoNombre" {
				return domain.ErrPerfilNoEncontrado
			}
			return nil
		},
	}
	svc := NewAuthService(repoMock, jwtMgr, nil)

	t.Run("Editar perfil exitoso", func(t *testing.T) {
		p, err := svc.EditarPerfil(context.Background(), "usr-123", "prof-123", "NuevoNombre", "en", true, "4321")
		if err != nil {
			t.Fatalf("error: %v", err)
		}
		if p.Nombre != "NuevoNombre" || p.Idioma != "en" || !p.EsInfantil || p.Pin != "4321" {
			t.Errorf("campos no actualizados correctamente")
		}
	})

	t.Run("Editar perfil invalido", func(t *testing.T) {
		_, err := svc.EditarPerfil(context.Background(), "usr-123", "prof-123", "", "en", true, "4321")
		if !errors.Is(err, domain.ErrDatosInvalidos) {
			t.Errorf("se esperaba ErrDatosInvalidos")
		}
	})
}

func TestListarEliminarPerfiles(t *testing.T) {
	jwtMgr := NewJWTManager("secretkey123", time.Hour)

	t.Run("Listar perfiles", func(t *testing.T) {
		repoMock := &MockUsuarioRepository{
			ListarPerfilesFunc: func(ctx context.Context, usuarioID string) ([]domain.Perfil, error) {
				return []domain.Perfil{
					{ID: "1", Nombre: "P1"},
					{ID: "2", Nombre: "P2"},
				}, nil
			},
		}
		svc := NewAuthService(repoMock, jwtMgr, nil)
		list, err := svc.ListarPerfiles(context.Background(), "usr-123")
		if err != nil {
			t.Fatalf("error: %v", err)
		}
		if len(list) != 2 {
			t.Errorf("se esperaban 2 perfiles")
		}
	})

	t.Run("Eliminar perfil", func(t *testing.T) {
		repoMock := &MockUsuarioRepository{
			EliminarPerfilFunc: func(ctx context.Context, id, usuarioID string) error {
				if id == "prof-123" {
					return nil
				}
				return domain.ErrPerfilNoEncontrado
			},
		}
		svc := NewAuthService(repoMock, jwtMgr, nil)
		err := svc.EliminarPerfil(context.Background(), "prof-123", "usr-123")
		if err != nil {
			t.Fatalf("error: %v", err)
		}
	})
}

func TestCambiarPassword(t *testing.T) {
	jwtMgr := NewJWTManager("secretkey123", time.Hour)
	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	passwordHash := string(hash)

	repoMock := &MockUsuarioRepository{
		ObtenerPorIDFunc: func(ctx context.Context, id string) (*domain.Usuario, error) {
			return &domain.Usuario{
				ID:           "usr-123",
				Email:        "test@gmail.com",
				PasswordHash: &passwordHash,
				RolBase:      domain.RolUsuario,
				Estado:       domain.EstadoActivo,
			}, nil
		},
		CambiarPasswordFunc: func(ctx context.Context, usuarioID, nuevoHash string) error {
			return nil
		},
	}
	svc := NewAuthService(repoMock, jwtMgr, nil)

	t.Run("Cambio exitoso", func(t *testing.T) {
		err := svc.CambiarPassword(context.Background(), "usr-123", "password123", "newpassword123")
		if err != nil {
			t.Fatalf("error: %v", err)
		}
	})

	t.Run("Cambio con pass actual incorrecto", func(t *testing.T) {
		err := svc.CambiarPassword(context.Background(), "usr-123", "wrongpass", "newpassword123")
		if !errors.Is(err, domain.ErrCredencialesInvalidas) {
			t.Errorf("se esperaba ErrCredencialesInvalidas")
		}
	})
}

func TestValidarToken(t *testing.T) {
	jwtMgr := NewJWTManager("secretkey123", time.Hour)
	svc := NewAuthService(&MockUsuarioRepository{}, jwtMgr, nil)

	t.Run("Token valido", func(t *testing.T) {
		token, _, err := jwtMgr.Generar("usr-123", "usuario", "test@gmail.com")
		if err != nil {
			t.Fatalf("error al generar token: %v", err)
		}
		claims, err := svc.ValidarToken(context.Background(), token)
		if err != nil {
			t.Fatalf("error: %v", err)
		}
		if claims.UsuarioID != "usr-123" {
			t.Errorf("usuario claims invalido")
		}
	})

	t.Run("Token invalido", func(t *testing.T) {
		_, err := svc.ValidarToken(context.Background(), "invalidtoken")
		if !errors.Is(err, domain.ErrTokenInvalido) {
			t.Errorf("se esperaba ErrTokenInvalido")
		}
	})
}

func TestActualizarPerfil(t *testing.T) {
	jwtMgr := NewJWTManager("secretkey123", time.Hour)
	repoMock := &MockUsuarioRepository{
		ActualizarPerfilFunc: func(ctx context.Context, id, usuarioID, nuevoNombre string) error {
			if id == "prof-123" && nuevoNombre == "MiNuevoNombre" {
				return nil
			}
			return domain.ErrPerfilNoEncontrado
		},
	}
	svc := NewAuthService(repoMock, jwtMgr, nil)

	t.Run("Actualizar perfil exitoso", func(t *testing.T) {
		err := svc.ActualizarPerfil(context.Background(), "prof-123", "usr-123", "MiNuevoNombre")
		if err != nil {
			t.Fatalf("error: %v", err)
		}
	})

	t.Run("Actualizar perfil nombre vacio", func(t *testing.T) {
		err := svc.ActualizarPerfil(context.Background(), "prof-123", "usr-123", "")
		if !errors.Is(err, domain.ErrDatosInvalidos) {
			t.Errorf("se esperaba ErrDatosInvalidos, se obtuvo: %v", err)
		}
	})
}
