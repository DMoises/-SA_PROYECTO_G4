package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/grupo4/quetxaltv-gateway/internal/clients"
	"github.com/grupo4/quetxaltv-gateway/internal/pb"
)

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Permitir conexiones desde cualquier origen (incluyendo Next.js dev server)
	},
}

type WatchPartyHandler struct {
	wpClient         *clients.WatchPartyClient
	watchPartyWSAddr string
}

func NewWatchPartyHandler(wpClient *clients.WatchPartyClient, watchPartyWSAddr string) *WatchPartyHandler {
	return &WatchPartyHandler{
		wpClient:         wpClient,
		watchPartyWSAddr: watchPartyWSAddr,
	}
}

// POST /watchparty/rooms
func (h *WatchPartyHandler) CrearSala(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ContenidoID string `json:"contenido_id"`
	}
	if !decode(w, r, &body) {
		return
	}

	if body.ContenidoID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "contenido_id es requerido"})
		return
	}

	usrID := usuarioID(r)
	if usrID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "usuario no autenticado"})
		return
	}

	resp, err := h.wpClient.CrearSala(r.Context(), &pb.CrearSalaRequest{
		UsuarioId:   usrID,
		ContenidoId: body.ContenidoID,
	})
	if err != nil {
		writeGRPCError(w, err)
		return
	}

	enlace := fmt.Sprintf("/watchparty/%s", resp.GetCodigoSala())

	writeJSON(w, http.StatusCreated, map[string]any{
		"codigo_sala":       resp.GetCodigoSala(),
		"contenido_id":      resp.GetContenidoId(),
		"creador_id":        resp.GetCreadorId(),
		"enlace_invitacion": enlace,
	})
}

// GET /watchparty/rooms/{code}
func (h *WatchPartyHandler) ValidarSala(w http.ResponseWriter, r *http.Request) {
	code := r.PathValue("code")
	if code == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "codigo de sala es requerido"})
		return
	}

	resp, err := h.wpClient.ValidarSala(r.Context(), &pb.ValidarSalaRequest{
		CodigoSala: code,
	})
	if err != nil {
		writeGRPCError(w, err)
		return
	}

	if !resp.GetExiste() {
		writeJSON(w, http.StatusNotFound, map[string]any{"existe": false, "error": "la sala no existe"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"existe":       true,
		"contenido_id": resp.GetContenidoId(),
	})
}

// GET /ws/watchparty/{code}
func (h *WatchPartyHandler) ProxyWebSocket(w http.ResponseWriter, r *http.Request) {
	code := r.PathValue("code")
	if code == "" {
		http.Error(w, "Codigo de sala requerido", http.StatusBadRequest)
		return
	}

	// Upgrade client connection
	clientConn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error al actualizar websocket del cliente: %v", err)
		return
	}
	defer clientConn.Close()

	// Conectar al watchparty-service por WS
	backendURL := fmt.Sprintf("ws://%s/ws?code=%s", h.watchPartyWSAddr, code)
	backendConn, _, err := websocket.DefaultDialer.Dial(backendURL, nil)
	if err != nil {
		log.Printf("Error al conectar al WebSocket de watchparty-service %s: %v", backendURL, err)
		clientConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseInternalServerErr, "Error de conexion interna"))
		return
	}
	defer backendConn.Close()

	errChan := make(chan error, 2)

	// Copiar del cliente al backend
	go func() {
		for {
			msgType, msg, err := clientConn.ReadMessage()
			if err != nil {
				errChan <- err
				return
			}
			err = backendConn.WriteMessage(msgType, msg)
			if err != nil {
				errChan <- err
				return
			}
		}
	}()

	// Copiar del backend al cliente
	go func() {
		for {
			msgType, msg, err := backendConn.ReadMessage()
			if err != nil {
				errChan <- err
				return
			}
			err = clientConn.WriteMessage(msgType, msg)
			if err != nil {
				errChan <- err
				return
			}
		}
	}()

	<-errChan
}
