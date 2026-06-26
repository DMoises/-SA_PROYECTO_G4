package server

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/grupo4/quetxaltv-watchparty/internal/pb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow connection from Next.js domain
	},
}

type Client struct {
	conn *websocket.Conn
	send chan []byte
}

type Room struct {
	Code        string
	ContenidoID string
	CreatorID   string
	Clients     map[*Client]bool
	Mutex       sync.Mutex
}

type WatchPartyServer struct {
	pb.UnimplementedWatchPartyServiceServer
	rooms sync.Map // Map[string]*Room (key: code)
}

func NewWatchPartyServer() *WatchPartyServer {
	return &WatchPartyServer{}
}

// ---- gRPC Endpoints ----

func (s *WatchPartyServer) CrearSala(ctx context.Context, req *pb.CrearSalaRequest) (*pb.SalaResponse, error) {
	if req.GetContenidoId() == "" || req.GetUsuarioId() == "" {
		return nil, status.Error(codes.InvalidArgument, "contenido_id y usuario_id son obligatorios")
	}

	code := generateRoomCode()
	room := &Room{
		Code:        code,
		ContenidoID: req.GetContenidoId(),
		CreatorID:   req.GetUsuarioId(),
		Clients:     make(map[*Client]bool),
	}

	s.rooms.Store(code, room)
	log.Printf("Sala de Watch Party creada: %s para el contenido %s", code, req.GetContenidoId())

	return &pb.SalaResponse{
		CodigoSala:  code,
		ContenidoId: req.GetContenidoId(),
		CreadorId:   req.GetUsuarioId(),
	}, nil
}

func (s *WatchPartyServer) ValidarSala(ctx context.Context, req *pb.ValidarSalaRequest) (*pb.ValidarSalaResponse, error) {
	val, ok := s.rooms.Load(req.GetCodigoSala())
	if !ok {
		return &pb.ValidarSalaResponse{Existe: false}, nil
	}

	room := val.(*Room)
	return &pb.ValidarSalaResponse{
		Existe:      true,
		ContenidoId: room.ContenidoID,
	}, nil
}

// ---- WebSocket Endpoint ----

func (s *WatchPartyServer) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Falta el codigo de la sala", http.StatusBadRequest)
		return
	}

	val, ok := s.rooms.Load(code)
	if !ok {
		http.Error(w, "La sala no existe", http.StatusNotFound)
		return
	}
	room := val.(*Room)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error al actualizar conexion a WebSocket: %v", err)
		return
	}

	client := &Client{
		conn: conn,
		send: make(chan []byte, 256),
	}

	// Add client to room
	room.Mutex.Lock()
	room.Clients[client] = true
	room.Mutex.Unlock()

	log.Printf("Nuevo cliente unido a la sala %s. Total clientes: %d", code, len(room.Clients))

	// Reader loop
	go func() {
		defer func() {
			room.Mutex.Lock()
			if _, exists := room.Clients[client]; exists {
				delete(room.Clients, client)
				close(client.send)
			}
			room.Mutex.Unlock()
			conn.Close()
			log.Printf("Cliente salio de la sala %s. Clientes restantes: %d", code, len(room.Clients))
		}()

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				break
			}

			// Broadcast action to other participants in the room
			room.Mutex.Lock()
			for c := range room.Clients {
				if c != client {
					select {
					case c.send <- msg:
					default:
						close(c.send)
						delete(room.Clients, c)
					}
				}
			}
			room.Mutex.Unlock()
		}
	}()

	// Writer loop
	for msg := range client.send {
		err := conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			break
		}
	}
}

func generateRoomCode() string {
	b := make([]byte, 3)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b) // 6 chars (e.g. 3f1a2c)
}
