package clients

import (
	"context"

	"github.com/grupo4/quetxaltv-gateway/internal/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type BillingClient struct {
	conn *grpc.ClientConn
	cli  pb.BillingServiceClient
}

func NewBillingClient(addr string) (*BillingClient, error) {
	conn, err := grpc.NewClient(
		addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithUnaryInterceptor(MetadataForwardingInterceptor),
	)

	if err != nil {
		return nil, err
	}

	return &BillingClient{
		conn: conn,
		cli:  pb.NewBillingServiceClient(conn),
	}, nil
}

func (c *BillingClient) Close() error {
	return c.conn.Close()
}

func (c *BillingClient) GetPlans(
	ctx context.Context,
) (*pb.GetPlansResponse, error) {
	return c.cli.GetPlans(ctx, &pb.Empty{})
}

func (c *BillingClient) CreateSubscription(
	ctx context.Context,
	usuarioID string,
	planID string,
	monto float64,
	moneda string,
	meses int32,
	correo string,
) (*pb.CreateSubscriptionResponse, error) {
	return c.cli.CreateSubscription(
		ctx,
		&pb.CreateSubscriptionRequest{
			UsuarioId: usuarioID,
			PlanId:    planID,
			Monto:     monto,
			Moneda:    moneda,
			Meses:     meses,
			Correo:    correo,
		},
	)
}

func (c *BillingClient) GetUserSubscription(
	ctx context.Context,
	usuarioID string,
) (*pb.GetUserSubscriptionResponse, error) {
	return c.cli.GetUserSubscription(
		ctx,
		&pb.GetUserSubscriptionRequest{
			UsuarioId: usuarioID,
		},
	)
}

func (c *BillingClient) ChangeSubscription(
	ctx context.Context,
	usuarioID string,
	nuevoPlanID string,
	monto float64,
	moneda string,
	meses int32,
) (*pb.ChangeSubscriptionResponse, error) {
	return c.cli.ChangeSubscription(
		ctx,
		&pb.ChangeSubscriptionRequest{
			UsuarioId:   usuarioID,
			NuevoPlanId: nuevoPlanID,
			Monto:       monto,
			Moneda:      moneda,
			Meses:       meses,
		},
	)
}

func (c *BillingClient) CancelSubscription(
	ctx context.Context,
	usuarioID string,
) (*pb.CancelSubscriptionResponse, error) {
	return c.cli.CancelSubscription(
		ctx,
		&pb.CancelSubscriptionRequest{
			UsuarioId: usuarioID,
		},
	)
}

func (c *BillingClient) GetPlanPrice(
	ctx context.Context,
	planID string,
	monedaDestino string,
) (*pb.GetPlanPriceResponse, error) {
	return c.cli.GetPlanPrice(
		ctx,
		&pb.GetPlanPriceRequest{
			PlanId:         planID,
			MonedaDestino: monedaDestino,
		},
	)
}