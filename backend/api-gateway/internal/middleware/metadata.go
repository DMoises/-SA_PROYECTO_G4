package middleware

import (
	"context"
	"net/http"
	"strings"
)

const (
	CtxAuthorization ctxKey = "authorization"
	CtxProfileID     ctxKey = "x-profile-id"
	CtxParentalPin   ctxKey = "x-parental-pin"
	CtxDownloadRequest ctxKey = "x-download-request"
)

// PropagateHeaders extracts auth and profile headers to store them in context
func PropagateHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		// 1. Extract Token (Authorization header or session cookie)
		token := ""
		if cookie, err := r.Cookie("session"); err == nil && cookie.Value != "" {
			token = cookie.Value
		}
		if header := r.Header.Get("Authorization"); strings.HasPrefix(header, "Bearer ") {
			token = strings.TrimPrefix(header, "Bearer ")
		} else if header != "" {
			token = header
		}

		if token != "" {
			ctx = context.WithValue(ctx, CtxAuthorization, token)
		}

		// 2. Extract X-Profile-Id
		if profileID := r.Header.Get("X-Profile-Id"); profileID != "" {
			ctx = context.WithValue(ctx, CtxProfileID, profileID)
		}

		// 3. Extract X-Parental-Pin
		if pin := r.Header.Get("X-Parental-Pin"); pin != "" {
			ctx = context.WithValue(ctx, CtxParentalPin, pin)
		}

		// 4. Extract X-Download-Request
		if isDownload := r.Header.Get("X-Download-Request"); isDownload != "" {
			ctx = context.WithValue(ctx, CtxDownloadRequest, isDownload)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
