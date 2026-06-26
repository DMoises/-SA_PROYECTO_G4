package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/grupo4/quetxaltv-gateway/internal/clients"
)

// PropagateHeaders extracts auth and profile headers to store them in context
func PropagateHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		// 1. Extract Token (Authorization header, session cookie or token query param)
		token := ""
		if cookie, err := r.Cookie("session"); err == nil && cookie.Value != "" {
			token = cookie.Value
		}
		if header := r.Header.Get("Authorization"); strings.HasPrefix(header, "Bearer ") {
			token = strings.TrimPrefix(header, "Bearer ")
		} else if header != "" {
			token = header
		}
		if token == "" {
			if qToken := r.URL.Query().Get("token"); qToken != "" {
				token = qToken
			}
		}

		if token != "" {
			ctx = context.WithValue(ctx, clients.CtxAuthorization, token)
		}

		// 2. Extract X-Profile-Id
		if profileID := r.Header.Get("X-Profile-Id"); profileID != "" {
			ctx = context.WithValue(ctx, clients.CtxProfileID, profileID)
		}

		// 3. Extract X-Parental-Pin
		if pin := r.Header.Get("X-Parental-Pin"); pin != "" {
			ctx = context.WithValue(ctx, clients.CtxParentalPin, pin)
		}

		// 4. Extract X-Download-Request
		if isDownload := r.Header.Get("X-Download-Request"); isDownload != "" {
			ctx = context.WithValue(ctx, clients.CtxDownloadRequest, isDownload)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
