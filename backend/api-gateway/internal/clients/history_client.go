package clients

import (
	"context"

	"github.com/grupo4/quetxaltv-gateway/internal/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type HistoryClient struct {
	conn *grpc.ClientConn
	cli  pb.HistoryServiceClient
}

func NewHistoryClient(addr string) (*HistoryClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	return &HistoryClient{conn: conn, cli: pb.NewHistoryServiceClient(conn)}, nil
}

func (c *HistoryClient) Close() error {
	return c.conn.Close()
}

func (c *HistoryClient) SaveProgress(ctx context.Context, perfilID, contenidoID, tipo string, temporada, episodio, segundoExacto, duracionTotal int32) (*pb.SaveProgressResponse, error) {
	return c.cli.SaveProgress(ctx, &pb.SaveProgressRequest{
		PerfilId:       perfilID,
		ContenidoId:    contenidoID,
		Tipo:           tipo,
		Temporada:      temporada,
		Episodio:       episodio,
		SegundoExacto:  segundoExacto,
		DuracionTotal:  duracionTotal,
	})
}

func (c *HistoryClient) GetHistory(ctx context.Context, perfilID string) (*pb.GetHistoryResponse, error) {
	return c.cli.GetHistory(ctx, &pb.GetHistoryRequest{
		PerfilId: perfilID,
	})
}

func (c *HistoryClient) GetResume(ctx context.Context, perfilID, contenidoID string) (*pb.HistoryItem, error) {
	return c.cli.GetResume(ctx, &pb.GetResumeRequest{
		PerfilId:    perfilID,
		ContenidoId: contenidoID,
	})
}