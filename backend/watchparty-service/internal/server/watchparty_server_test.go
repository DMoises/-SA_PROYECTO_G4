package server

import (
	"context"
	"testing"

	"github.com/grupo4/quetxaltv-watchparty/internal/pb"
)

func TestWatchPartyServer(t *testing.T) {
	s := NewWatchPartyServer()

	// 1. Test CrearSala with empty arguments
	ctx := context.Background()
	_, err := s.CrearSala(ctx, &pb.CrearSalaRequest{})
	if err == nil {
		t.Fatal("se esperaba error al crear sala con argumentos vacios")
	}

	// 2. Test CrearSala successfully
	resp, err := s.CrearSala(ctx, &pb.CrearSalaRequest{
		UsuarioId:   "usr-test",
		ContenidoId: "cont-test",
	})
	if err != nil {
		t.Fatalf("error inesperado al crear sala: %v", err)
	}

	if resp.GetCodigoSala() == "" {
		t.Fatal("el codigo de sala generado no debe estar vacio")
	}
	if resp.GetContenidoId() != "cont-test" {
		t.Errorf("se esperaba contenido_id 'cont-test', se obtuvo '%s'", resp.GetContenidoId())
	}
	if resp.GetCreadorId() != "usr-test" {
		t.Errorf("se esperaba creador_id 'usr-test', se obtuvo '%s'", resp.GetCreadorId())
	}

	// 3. Test ValidarSala successfully
	valResp, err := s.ValidarSala(ctx, &pb.ValidarSalaRequest{
		CodigoSala: resp.GetCodigoSala(),
	})
	if err != nil {
		t.Fatalf("error inesperado al validar sala: %v", err)
	}

	if !valResp.GetExiste() {
		t.Fatal("se esperaba que la sala existiera")
	}
	if valResp.GetContenidoId() != "cont-test" {
		t.Errorf("se esperaba contenido_id 'cont-test' en la validacion, se obtuvo '%s'", valResp.GetContenidoId())
	}

	// 4. Test ValidarSala with invalid code
	valResp2, err := s.ValidarSala(ctx, &pb.ValidarSalaRequest{
		CodigoSala: "invalidcode",
	})
	if err != nil {
		t.Fatalf("error inesperado al validar sala inexistente: %v", err)
	}

	if valResp2.GetExiste() {
		t.Fatal("se esperaba que la sala inexistente retornara existe=false")
	}
}
