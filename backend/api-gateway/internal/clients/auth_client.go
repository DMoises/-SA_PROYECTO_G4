// Package clients envuelve los clientes gRPC hacia los microservicios.
// Aqui esta el cliente del auth-service.
package clients

import (
	"context"

	"github.com/grupo4/quetxaltv-gateway/internal/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type AuthClient struct {
	conn *grpc.ClientConn
	cli  pb.AuthServiceClient
}

// NewAuthClient abre la conexion gRPC con el auth-service.
// Usa credenciales 'insecure' porque es trafico interno entre servicios
// dentro de la red de Docker (sin TLS).
func NewAuthClient(addr string) (*AuthClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	return &AuthClient{conn: conn, cli: pb.NewAuthServiceClient(conn)}, nil
}

func (c *AuthClient) Close() error { return c.conn.Close() }

func (c *AuthClient) Registrar(ctx context.Context, email, password, nombrePerfil string) (*pb.RegistrarResponse, error) {
	return c.cli.Registrar(ctx, &pb.RegistrarRequest{
		Email: email, Password: password, NombrePerfil: nombrePerfil,
	})
}

func (c *AuthClient) Login(ctx context.Context, email, password string) (*pb.LoginResponse, error) {
	return c.cli.Login(ctx, &pb.LoginRequest{Email: email, Password: password})
}

func (c *AuthClient) ValidarToken(ctx context.Context, token string) (*pb.ValidarTokenResponse, error) {
	return c.cli.ValidarToken(ctx, &pb.ValidarTokenRequest{Token: token})
}

func (c *AuthClient) CrearPerfil(ctx context.Context, usuarioID, nombre, idioma string, esInfantil bool) (*pb.PerfilResponse, error) {
	return c.cli.CrearPerfil(ctx, &pb.CrearPerfilRequest{
		UsuarioId: usuarioID, Nombre: nombre, Idioma: idioma, EsInfantil: esInfantil,
	})
}

func (c *AuthClient) ListarPerfiles(ctx context.Context, usuarioID string) (*pb.ListarPerfilesResponse, error) {
	return c.cli.ListarPerfiles(ctx, &pb.ListarPerfilesRequest{UsuarioId: usuarioID})
}
