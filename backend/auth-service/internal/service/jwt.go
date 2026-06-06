package service

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/grupo4/quetxaltv-auth/internal/domain"
)

// Claims son las afirmaciones que viajan dentro del JWT y que los demas
// microservicios usan para propagar la identidad del usuario.
type Claims struct {
	UsuarioID string `json:"usuario_id"`
	Rol       string `json:"rol"`
	jwt.RegisteredClaims
}

// JWTManager firma y valida tokens HS256.
type JWTManager struct {
	secret []byte
	ttl    time.Duration
}

func NewJWTManager(secret string, ttl time.Duration) *JWTManager {
	return &JWTManager{secret: []byte(secret), ttl: ttl}
}

// Generar crea un JWT firmado para un usuario. Devuelve el token y su
// instante de expiracion.
func (m *JWTManager) Generar(usuarioID, rol string) (string, time.Time, error) {
	exp := time.Now().Add(m.ttl)
	claims := Claims{
		UsuarioID: usuarioID,
		Rol:       rol,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   usuarioID,
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "quetxaltv-auth",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	firmado, err := token.SignedString(m.secret)
	if err != nil {
		return "", time.Time{}, err
	}
	return firmado, exp, nil
}

// Validar verifica la firma y la expiracion, y devuelve los claims.
func (m *JWTManager) Validar(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, domain.ErrTokenInvalido
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, domain.ErrTokenInvalido
	}
	return claims, nil
}
