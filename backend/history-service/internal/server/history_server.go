package server

import (
	"context"

	"github.com/grupo4/quetxaltv-history/internal/pb"
	"github.com/grupo4/quetxaltv-history/internal/models"
	"github.com/grupo4/quetxaltv-history/internal/service"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type HistoryServer struct {
	pb.UnimplementedHistoryServiceServer
	service *service.HistoryService
}

func NewHistoryServer(service *service.HistoryService) *HistoryServer {
	return &HistoryServer{service: service}
}

func (s *HistoryServer) SaveProgress(ctx context.Context, req *pb.SaveProgressRequest) (*pb.SaveProgressResponse, error) {
	var temporada *int16
	var episodio *int16

	if req.GetTipo() == "serie" {
		t := int16(req.GetTemporada())
		e := int16(req.GetEpisodio())
		temporada = &t
		episodio = &e
	}

	err := s.service.GuardarProgreso(ctx, models.GuardarProgresoRequest{
		PerfilID:      req.GetPerfilId(),
		ContenidoID:   req.GetContenidoId(),
		Tipo:          req.GetTipo(),
		Temporada:     temporada,
		Episodio:      episodio,
		SegundoExacto: req.GetSegundoExacto(),
		DuracionTotal: req.GetDuracionTotal(),
	})
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	return &pb.SaveProgressResponse{
		Mensaje: "progreso guardado correctamente",
	}, nil
}

func (s *HistoryServer) GetHistory(ctx context.Context, req *pb.GetHistoryRequest) (*pb.GetHistoryResponse, error) {
	historial, err := s.service.ObtenerHistorial(ctx, req.GetPerfilId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	items := make([]*pb.HistoryItem, 0, len(historial))

	for _, h := range historial {
		items = append(items, toPB(h))
	}

	return &pb.GetHistoryResponse{Historial: items}, nil
}

func (s *HistoryServer) GetResume(ctx context.Context, req *pb.GetResumeRequest) (*pb.HistoryItem, error) {
	item, err := s.service.ObtenerProgreso(ctx, req.GetPerfilId(), req.GetContenidoId())
	if err != nil {
		return nil, status.Error(codes.NotFound, "no se encontro progreso")
	}

	return toPB(*item), nil
}

func toPB(item models.HistorialItem) *pb.HistoryItem {
	var temporada int32
	var episodio int32

	if item.Temporada != nil {
		temporada = int32(*item.Temporada)
	}

	if item.Episodio != nil {
		episodio = int32(*item.Episodio)
	}

	return &pb.HistoryItem{
		Id:              item.ID,
		PerfilId:        item.PerfilID,
		ContenidoId:     item.ContenidoID,
		Tipo:            item.Tipo,
		Temporada:       temporada,
		Episodio:        episodio,
		SegundoExacto:   item.SegundoExacto,
		DuracionTotal:   item.DuracionTotal,
		PorcentajeVisto: item.PorcentajeVisto,
		ActualizadoEn:   item.ActualizadoEn.Format("2006-01-02 15:04:05"),
	}
}