// Package repository implementa el acceso a datos contra auth_db usando
// pgx (sin ORM, como exige el enunciado). Traduce errores de PostgreSQL
// (violaciones de constraints y triggers) a errores de dominio.
package repository

import (
	"context"
	"errors"

	"github.com/grupo4/quetxaltv-auth/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Codigos SQLSTATE relevantes de PostgreSQL.
const (
	codeUniqueViolation = "23505" // UNIQUE
	codeCheckViolation  = "23514" // CHECK / RAISE del trigger
)

type PostgresUsuarioRepo struct {
	db *pgxpool.Pool
}

func NewPostgresUsuarioRepo(db *pgxpool.Pool) *PostgresUsuarioRepo {
	return &PostgresUsuarioRepo{db: db}
}

// CrearUsuarioConPerfilInicial inserta el usuario y su primer perfil en
// una sola transaccion. Si cualquier paso falla, no queda una cuenta sin
// perfil ni viceversa (atomicidad).
func (r *PostgresUsuarioRepo) CrearUsuarioConPerfilInicial(
	ctx context.Context,
	u *domain.Usuario,
	nombrePerfil string,
) (usuarioID string, perfilID string, err error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return "", "", err
	}

	// No hace nada si la transaccion ya fue confirmada.
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, "SELECT set_config('app.current_user', $1, true)", u.Email)
	if err != nil {
		return "", "", err
	}

	err = tx.QueryRow(
		ctx,
		`INSERT INTO usuarios (
			email,
			password_hash,
			oauth_proveedor,
			rol_base
		)
		VALUES ($1, $2, $3, $4)
		RETURNING id`,
		u.Email,
		u.PasswordHash,
		u.OAuthProveedor,
		string(u.RolBase),
	).Scan(&usuarioID)

	if err != nil {
		if esCodigo(err, codeUniqueViolation) {
			return "", "", domain.ErrEmailYaRegistrado
		}

		return "", "", err
	}

	err = tx.QueryRow(
		ctx,
		`INSERT INTO perfiles (
			usuario_id,
			nombre
		)
		VALUES ($1, $2)
		RETURNING id`,
		usuarioID,
		nombrePerfil,
	).Scan(&perfilID)

	if err != nil {
		return "", "", err
	}

	if err = tx.Commit(ctx); err != nil {
		return "", "", err
	}

	return usuarioID, perfilID, nil
}

// ObtenerPorEmail devuelve el usuario o ErrUsuarioNoEncontrado.
func (r *PostgresUsuarioRepo) ObtenerPorEmail(
	ctx context.Context,
	email string,
) (*domain.Usuario, error) {
	var u domain.Usuario
	var rol string
	var estado string

	err := r.db.QueryRow(
		ctx,
		`SELECT
			id,
			email,
			password_hash,
			oauth_proveedor,
			rol_base,
			estado,
			creado_en,
			actualizado_en
		FROM usuarios
		WHERE email = $1`,
		email,
	).Scan(
		&u.ID,
		&u.Email,
		&u.PasswordHash,
		&u.OAuthProveedor,
		&rol,
		&estado,
		&u.CreadoEn,
		&u.ActualizadoEn,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrUsuarioNoEncontrado
		}

		return nil, err
	}

	u.RolBase = domain.RolBase(rol)
	u.Estado = domain.EstadoUsuario(estado)

	return &u, nil
}

// ObtenerPorID devuelve el usuario por su UUID o ErrUsuarioNoEncontrado.
func (r *PostgresUsuarioRepo) ObtenerPorID(
	ctx context.Context,
	id string,
) (*domain.Usuario, error) {
	var u domain.Usuario
	var rol string
	var estado string

	err := r.db.QueryRow(
		ctx,
		`SELECT
			id,
			email,
			password_hash,
			oauth_proveedor,
			rol_base,
			estado,
			creado_en,
			actualizado_en
		FROM usuarios
		WHERE id = $1`,
		id,
	).Scan(
		&u.ID,
		&u.Email,
		&u.PasswordHash,
		&u.OAuthProveedor,
		&rol,
		&estado,
		&u.CreadoEn,
		&u.ActualizadoEn,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrUsuarioNoEncontrado
		}

		return nil, err
	}

	u.RolBase = domain.RolBase(rol)
	u.Estado = domain.EstadoUsuario(estado)

	return &u, nil
}

// CambiarPassword actualiza el hash de contraseña del usuario.
func (r *PostgresUsuarioRepo) CambiarPassword(
	ctx context.Context,
	usuarioID string,
	nuevoHash string,
) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, _ = tx.Exec(ctx, "SELECT set_config('app.current_user', $1, true)", usuarioID)

	cmdTag, err := tx.Exec(
		ctx,
		`UPDATE usuarios
		SET
			password_hash = $1,
			actualizado_en = now()
		WHERE id = $2`,
		nuevoHash,
		usuarioID,
	)

	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return domain.ErrUsuarioNoEncontrado
	}

	return tx.Commit(ctx)
}

// CrearPerfil inserta un perfil adicional. El trigger trg_limite_perfiles
// aborta si la cuenta ya tiene 5; ese error se mapea a ErrLimitePerfiles.
func (r *PostgresUsuarioRepo) CrearPerfil(
	ctx context.Context,
	p *domain.Perfil,
) (string, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	_, _ = tx.Exec(ctx, "SELECT set_config('app.current_user', $1, true)", p.UsuarioID)

	var id string

	err = tx.QueryRow(
		ctx,
		`INSERT INTO perfiles (
			usuario_id,
			nombre,
			es_infantil,
			idioma
		)
		VALUES ($1, $2, $3, $4)
		RETURNING id`,
		p.UsuarioID,
		p.Nombre,
		p.EsInfantil,
		p.Idioma,
	).Scan(&id)

	if err != nil {
		if esCodigo(err, codeCheckViolation) {
			return "", domain.ErrLimitePerfiles
		}

		if esCodigo(err, codeUniqueViolation) {
			return "", domain.ErrNombrePerfilExiste
		}

		return "", err
	}

	if err = tx.Commit(ctx); err != nil {
		return "", err
	}

	return id, nil
}

// EditarPerfil modifica el nombre, idioma y configuracion infantil de un
// perfil, siempre que el perfil pertenezca al usuario indicado.
func (r *PostgresUsuarioRepo) EditarPerfil(
	ctx context.Context,
	p *domain.Perfil,
) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, _ = tx.Exec(ctx, "SELECT set_config('app.current_user', $1, true)", p.UsuarioID)

	cmdTag, err := tx.Exec(
		ctx,
		`UPDATE perfiles
		SET
			nombre = $1,
			es_infantil = $2,
			idioma = $3
		WHERE id = $4
		  AND usuario_id = $5`,
		p.Nombre,
		p.EsInfantil,
		p.Idioma,
		p.ID,
		p.UsuarioID,
	)

	if err != nil {
		if esCodigo(err, codeUniqueViolation) {
			return domain.ErrNombrePerfilExiste
		}

		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return domain.ErrPerfilNoEncontrado
	}

	return tx.Commit(ctx)
}

// ListarPerfiles devuelve los perfiles de una cuenta.
func (r *PostgresUsuarioRepo) ListarPerfiles(
	ctx context.Context,
	usuarioID string,
) ([]domain.Perfil, error) {
	rows, err := r.db.Query(
		ctx,
		`SELECT
			id,
			usuario_id,
			nombre,
			es_infantil,
			idioma
		FROM perfiles
		WHERE usuario_id = $1
		ORDER BY nombre`,
		usuarioID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var perfiles []domain.Perfil

	for rows.Next() {
		var p domain.Perfil

		if err := rows.Scan(
			&p.ID,
			&p.UsuarioID,
			&p.Nombre,
			&p.EsInfantil,
			&p.Idioma,
		); err != nil {
			return nil, err
		}

		perfiles = append(perfiles, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return perfiles, nil
}

// ActualizarPerfil cambia solamente el nombre de un perfil,
// si pertenece al usuario.
func (r *PostgresUsuarioRepo) ActualizarPerfil(
	ctx context.Context,
	id string,
	usuarioID string,
	nuevoNombre string,
) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, _ = tx.Exec(ctx, "SELECT set_config('app.current_user', $1, true)", usuarioID)

	cmdTag, err := tx.Exec(
		ctx,
		`UPDATE perfiles
		SET nombre = $1
		WHERE id = $2
		  AND usuario_id = $3`,
		nuevoNombre,
		id,
		usuarioID,
	)

	if err != nil {
		if esCodigo(err, codeUniqueViolation) {
			return domain.ErrNombrePerfilExiste
		}

		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return domain.ErrPerfilNoEncontrado
	}

	return tx.Commit(ctx)
}


// EliminarPerfil elimina un perfil de un usuario.
func (r *PostgresUsuarioRepo) EliminarPerfil(
	ctx context.Context,
	id string,
	usuarioID string,
) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, _ = tx.Exec(ctx, "SELECT set_config('app.current_user', $1, true)", usuarioID)

	cmdTag, err := tx.Exec(
		ctx,
		`DELETE FROM perfiles
		WHERE id = $1
		  AND usuario_id = $2`,
		id,
		usuarioID,
	)

	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return domain.ErrPerfilNoEncontrado
	}

	return tx.Commit(ctx)
}

// esCodigo indica si el error de pgx corresponde a un SQLSTATE dado.
func esCodigo(err error, code string) bool {
	var pgErr *pgconn.PgError

	return errors.As(err, &pgErr) && pgErr.Code == code
}