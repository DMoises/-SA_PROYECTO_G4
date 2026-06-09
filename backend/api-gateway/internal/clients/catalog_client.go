package clients

import (
	"context"

	"github.com/grupo4/quetxaltv-gateway/internal/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type CatalogClient struct {
	conn *grpc.ClientConn
	cli  pb.CatalogServiceClient
}

func NewCatalogClient(addr string) (*CatalogClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	return &CatalogClient{conn: conn, cli: pb.NewCatalogServiceClient(conn)}, nil
}

func (c *CatalogClient) Close() error { return c.conn.Close() }

func (c *CatalogClient) ExplorarCartelera(ctx context.Context) (*pb.CarteleraResponse, error) {
	return c.cli.ExplorarCartelera(ctx, &pb.ExplorarCarteleraRequest{})
}

func (c *CatalogClient) BuscarContenido(ctx context.Context, titulo, categoria, genero, actor string) (*pb.CarteleraResponse, error) {
	return c.cli.BuscarContenido(ctx, &pb.BuscarContenidoRequest{
		Titulo:    titulo,
		Categoria: categoria,
		Genero:    genero,
		Actor:     actor,
	})
}

func (c *CatalogClient) ObtenerFichaTecnica(ctx context.Context, contenidoID string) (*pb.FichaTecnicaResponse, error) {
	return c.cli.ObtenerFichaTecnica(ctx, &pb.FichaTecnicaRequest{ContenidoId: contenidoID})
}
