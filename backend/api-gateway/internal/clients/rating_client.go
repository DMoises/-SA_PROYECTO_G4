package clients

import (
	"context"

	"github.com/grupo4/quetxaltv-gateway/internal/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type RatingClient struct {
	conn *grpc.ClientConn
	cli  pb.RatingServiceClient
}

func NewRatingClient(addr string) (*RatingClient, error) {
	conn, err := grpc.NewClient(
		addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithUnaryInterceptor(MetadataForwardingInterceptor),
	)
	if err != nil {
		return nil, err
	}
	return &RatingClient{conn: conn, cli: pb.NewRatingServiceClient(conn)}, nil
}

func (c *RatingClient) Close() error { return c.conn.Close() }

func (c *RatingClient) Calificar(ctx context.Context, perfilID, contenidoID, tipo string, valor int32) (*pb.RecomendacionResponse, error) {
	return c.cli.Calificar(ctx, &pb.CalificarRequest{
		PerfilId:    perfilID,
		ContenidoId: contenidoID,
		Tipo:        tipo,
		Valor:       valor,
	})
}

func (c *RatingClient) ObtenerRecomendacion(ctx context.Context, contenidoID string) (*pb.RecomendacionResponse, error) {
	return c.cli.ObtenerRecomendacion(ctx, &pb.ObtenerRecomendacionRequest{ContenidoId: contenidoID})
}

func (c *RatingClient) ObtenerCalificacionUsuario(ctx context.Context, perfilID, contenidoID string) (*pb.CalificacionUsuarioResponse, error) {
	return c.cli.ObtenerCalificacionUsuario(ctx, &pb.ObtenerCalificacionUsuarioRequest{
		PerfilId:    perfilID,
		ContenidoId: contenidoID,
	})
}
