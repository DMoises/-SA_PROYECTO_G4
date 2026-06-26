package db

import (
	"database/sql"
	"fmt"
	"sync"
	"time"

	"github.com/grupo4/quetxaltv-gateway/internal/config"
	_ "github.com/lib/pq"
)

type AuditLog struct {
	ID                 int64     `json:"id"`
	DBName             string    `json:"db_name"`
	UsuarioResponsable string    `json:"usuario_responsable"`
	FechaExacta        time.Time `json:"fecha_exacta"`
	TablaAfectada      string    `json:"tabla_afectada"`
	EstadoAnterior     *string   `json:"estado_anterior"`
	EstadoNuevo        *string   `json:"estado_nuevo"`
}

func FetchAllAuditLogs(cfg *config.Config) ([]AuditLog, error) {
	dbs := map[string]config.DBConfig{
		"auth":         cfg.AuthDB,
		"subscription": cfg.SubscriptionDB,
		"catalog":      cfg.CatalogDB,
		"rating":       cfg.RatingDB,
		"fx":           cfg.FXDB,
		"history":      cfg.HistoryDB,
		"notification": cfg.NotificationDB,
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	var allLogs []AuditLog
	var errorsList []error

	for name, dbCfg := range dbs {
		wg.Add(1)
		go func(dbname string, dbc config.DBConfig) {
			defer wg.Done()
			logs, err := queryDBAuditLogs(dbname, dbc)
			mu.Lock()
			defer mu.Unlock()
			if err != nil {
				errorsList = append(errorsList, fmt.Errorf("error in db %s: %w", dbname, err))
			} else {
				allLogs = append(allLogs, logs...)
			}
		}(name, dbCfg)
	}

	wg.Wait()

	if len(errorsList) > 0 && len(allLogs) == 0 {
		return nil, errorsList[0] // Retorna el primer error si todos fallaron
	}

	return allLogs, nil
}

func queryDBAuditLogs(dbname string, cfg config.DBConfig) ([]AuditLog, error) {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable connect_timeout=3",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	db.SetConnMaxLifetime(time.Second * 5)

	rows, err := db.Query(`
		SELECT id, usuario_responsable, fecha_exacta, tabla_afectada, estado_anterior::text, estado_nuevo::text 
		FROM auditoria_transaccional 
		ORDER BY fecha_exacta DESC 
		LIMIT 200
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []AuditLog
	for rows.Next() {
		var log AuditLog
		log.DBName = dbname
		var prev, next sql.NullString
		err := rows.Scan(&log.ID, &log.UsuarioResponsable, &log.FechaExacta, &log.TablaAfectada, &prev, &next)
		if err != nil {
			return nil, err
		}
		if prev.Valid {
			val := prev.String
			log.EstadoAnterior = &val
		}
		if next.Valid {
			val := next.String
			log.EstadoNuevo = &val
		}
		logs = append(logs, log)
	}
	return logs, nil
}
