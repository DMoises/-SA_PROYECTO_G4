package clients

import (
	"context"

	"github.com/grupo4/quetxaltv-gateway/internal/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type WatchPartyClient struct {
	conn *grpc.ClientConn
	cli  pb.WatchPartyServiceClient
}

func NewWatchPartyClient(addr string) (*WatchPartyClient, error) {
	conn, err := grpc.NewClient(
		addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithUnaryInterceptor(MetadataForwardingInterceptor),
	)
	if err != nil {
		return nil, err
	}
	return &WatchPartyClient{conn: conn, cli: pb.NewWatchPartyServiceClient(conn)}, nil
}

func (c *WatchPartyClient) Close() error { return c.conn.Close() }

func (c *WatchPartyClient) CrearSala(ctx context.Context, req *pb.CrearSalaRequest) (*pb.SalaResponse, error) {
	return c.cli.CrearSala(ctx, req)
}

func (c *WatchPartyClient) ValidarSala(ctx context.Context, req *pb.ValidarSalaRequest) (*pb.ValidarSalaResponse, error) {
	return c.cli.ValidarSala(ctx, req)
}
