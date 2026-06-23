package clients

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

// Define keys to match middleware consts
type ctxKey string

const (
	CtxAuthorization ctxKey = "authorization"
	CtxProfileID     ctxKey = "x-profile-id"
	CtxParentalPin   ctxKey = "x-parental-pin"
	CtxContenidoID   ctxKey = "x-contenido-id"
	CtxDownloadRequest ctxKey = "x-download-request"
)

// MetadataForwardingInterceptor transfers metadata from the context to gRPC outgoing metadata
func MetadataForwardingInterceptor(
	ctx context.Context,
	method string,
	req, reply interface{},
	cc *grpc.ClientConn,
	invoker grpc.UnaryInvoker,
	opts ...grpc.CallOption,
) error {
	md := metadata.New(nil)

	if val, ok := ctx.Value(CtxAuthorization).(string); ok && val != "" {
		md.Set("authorization", "Bearer "+val)
	}

	if val, ok := ctx.Value(CtxProfileID).(string); ok && val != "" {
		md.Set("x-profile-id", val)
	}

	if val, ok := ctx.Value(CtxParentalPin).(string); ok && val != "" {
		md.Set("x-parental-pin", val)
	}

	if val, ok := ctx.Value(CtxContenidoID).(string); ok && val != "" {
		md.Set("x-contenido-id", val)
	}

	if val, ok := ctx.Value(CtxDownloadRequest).(string); ok && val != "" {
		md.Set("x-download-request", val)
	}

	if len(md) > 0 {
		ctx = metadata.NewOutgoingContext(ctx, md)
	}

	return invoker(ctx, method, req, reply, cc, opts...)
}
