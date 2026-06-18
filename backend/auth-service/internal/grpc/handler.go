// Package grpcserver adapta la logica de negocio al transporte gRPC.
// Implementa la interfaz generada AuthServiceServer y traduce los errores
// de dominio a codigos gRPC, sin que el dominio conozca gRPC.
package grpcserver

import (
	"context"
	"errors"
	"log"

	"github.com/grupo4/quetxaltv-auth/internal/domain"
	"github.com/grupo4/quetxaltv-auth/internal/pb"
	"github.com/grupo4/quetxaltv-auth/internal/service"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type AuthHandler struct {
	pb.UnimplementedAuthServiceServer
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Registrar(ctx context.Context, req *pb.RegistrarRequest) (*pb.RegistrarResponse, error) {
	usuarioID, perfilID, err := h.svc.Registrar(ctx, req.GetEmail(), req.GetPassword(), req.GetNombrePerfil())
	if err != nil {
		return nil, aGRPC(err)
	}
	return &pb.RegistrarResponse{UsuarioId: usuarioID, PerfilId: perfilID}, nil
}

func (h *AuthHandler) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	token, usuarioID, exp, err := h.svc.Login(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		return nil, aGRPC(err)
	}
	return &pb.LoginResponse{
		AccessToken: token,
		UsuarioId:   usuarioID,
		ExpiraEn:    exp.Unix(),
	}, nil
}

func (h *AuthHandler) ValidarToken(ctx context.Context, req *pb.ValidarTokenRequest) (*pb.ValidarTokenResponse, error) {
	claims, err := h.svc.ValidarToken(ctx, req.GetToken())
	if err != nil {
		// Token invalido no es un error de servidor: respondemos valido=false.
		return &pb.ValidarTokenResponse{Valido: false}, nil
	}
	return &pb.ValidarTokenResponse{
		Valido:    true,
		UsuarioId: claims.UsuarioID,
		Rol:       claims.Rol,
	}, nil
}

func (h *AuthHandler) CrearPerfil(ctx context.Context, req *pb.CrearPerfilRequest) (*pb.PerfilResponse, error) {
	p, err := h.svc.CrearPerfil(ctx, req.GetUsuarioId(), req.GetNombre(), req.GetIdioma(), req.GetEsInfantil())
	if err != nil {
		return nil, aGRPC(err)
	}
	return &pb.PerfilResponse{
		Id:         p.ID,
		Nombre:     p.Nombre,
		EsInfantil: p.EsInfantil,
		Idioma:     p.Idioma,
	}, nil
}

func (h *AuthHandler) EditarPerfil(ctx context.Context, req *pb.EditarPerfilRequest) (*pb.PerfilResponse, error) {
	p, err := h.svc.EditarPerfil(ctx, req.GetUsuarioId(), req.GetPerfilId(), req.GetNombre(), req.GetIdioma(), req.GetEsInfantil())
	if err != nil {
		return nil, aGRPC(err)
	}
	return &pb.PerfilResponse{
		Id:         p.ID,
		Nombre:     p.Nombre,
		EsInfantil: p.EsInfantil,
		Idioma:     p.Idioma,
	}, nil
}

func (h *AuthHandler) ListarPerfiles(ctx context.Context, req *pb.ListarPerfilesRequest) (*pb.ListarPerfilesResponse, error) {
	perfiles, err := h.svc.ListarPerfiles(ctx, req.GetUsuarioId())
	if err != nil {
		return nil, aGRPC(err)
	}
	resp := &pb.ListarPerfilesResponse{}
	for _, p := range perfiles {
		resp.Perfiles = append(resp.Perfiles, &pb.PerfilResponse{
			Id:         p.ID,
			Nombre:     p.Nombre,
			EsInfantil: p.EsInfantil,
			Idioma:     p.Idioma,
		})
	}
	return resp, nil
}

func (h *AuthHandler) ActualizarPerfil(ctx context.Context, req *pb.ActualizarPerfilRequest) (*pb.PerfilResponse, error) {
	err := h.svc.ActualizarPerfil(ctx, req.GetId(), req.GetUsuarioId(), req.GetNombre())
	if err != nil {
		return nil, aGRPC(err)
	}
	// Simplificado: solo devolvemos el ID y nombre actualizado.
	return &pb.PerfilResponse{
		Id:     req.GetId(),
		Nombre: req.GetNombre(),
	}, nil
}

func (h *AuthHandler) EliminarPerfil(ctx context.Context, req *pb.EliminarPerfilRequest) (*pb.EliminarPerfilResponse, error) {
	err := h.svc.EliminarPerfil(ctx, req.GetId(), req.GetUsuarioId())
	if err != nil {
		return nil, aGRPC(err)
	}
	return &pb.EliminarPerfilResponse{Success: true}, nil
}

// aGRPC traduce errores de dominio a codigos gRPC estandar.
func aGRPC(err error) error {
	switch {
	case errors.Is(err, domain.ErrEmailYaRegistrado),
		errors.Is(err, domain.ErrNombrePerfilExiste):
		return status.Error(codes.AlreadyExists, err.Error())
	case errors.Is(err, domain.ErrCredencialesInvalidas),
		errors.Is(err, domain.ErrCuentaInactiva),
		errors.Is(err, domain.ErrCuentaSoloOAuth):
		return status.Error(codes.Unauthenticated, err.Error())
	case errors.Is(err, domain.ErrUsuarioNoEncontrado),
		errors.Is(err, domain.ErrPerfilNoEncontrado):
		return status.Error(codes.NotFound, err.Error())
	case errors.Is(err, domain.ErrLimitePerfiles):
		return status.Error(codes.FailedPrecondition, err.Error())
	case errors.Is(err, domain.ErrDatosInvalidos):
		return status.Error(codes.InvalidArgument, err.Error())
	default:
		log.Printf("🔥 ERROR CRÍTICO (no controlado): %v", err)
		return status.Error(codes.Internal, "error interno del servidor")
	}
}
