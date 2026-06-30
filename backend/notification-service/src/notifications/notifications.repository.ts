import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

// Fila pendiente tal como la devuelve la vista vista_buzon_pendiente.
export interface CorreoPendiente {
  id: string;
  usuario_id: string;
  tipo: string;
  payload: Record<string, string>;
  intentos: number;
  creado_en: Date;
}

// Acceso a notification_db. Usa el stored procedure sp_encolar_correo y la
// vista vista_buzon_pendiente (objetos programables del esquema).
@Injectable()
export class NotificationsRepository {
  constructor(private readonly db: DatabaseService) {}

  // Encola un correo llamando al procedimiento almacenado. El parametro
  // INOUT p_id se devuelve en la fila resultante del CALL. Se setea
  // app.current_user (SET LOCAL via set_config is_local=true) en la misma
  // transaccion para que el trigger de auditoria registre al usuario real en
  // vez de session_user (el rol de BD).
  async encolar(
    usuarioId: string,
    tipo: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.current_user', $1, true)", [usuarioId]);
      const res = await client.query<{ p_id: string }>(
        'CALL sp_encolar_correo($1, $2, $3::jsonb, NULL)',
        [usuarioId, tipo, JSON.stringify(payload)],
      );
      await client.query('COMMIT');
      return res.rows[0]?.p_id;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Lote de correos pendientes (FIFO) desde la vista.
  async obtenerPendientes(limite: number): Promise<CorreoPendiente[]> {
    const res = await this.db.query<CorreoPendiente>(
      'SELECT id, usuario_id, tipo, payload, intentos, creado_en FROM vista_buzon_pendiente LIMIT $1',
      [limite],
    );
    return res.rows;
  }

  // usuarioId: dueño del correo (viene de la fila del buzon). Se usa como
  // usuario_responsable de la auditoria del UPDATE de estado.
  async marcarEnviado(id: string, usuarioId: string): Promise<void> {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.current_user', $1, true)", [usuarioId]);
      await client.query(
        "UPDATE buzon_salida SET estado_envio = 'enviado', enviado_en = now() WHERE id = $1",
        [id],
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async marcarFallido(id: string, usuarioId: string): Promise<void> {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.current_user', $1, true)", [usuarioId]);
      await client.query(
        "UPDATE buzon_salida SET estado_envio = 'fallido', intentos = intentos + 1 WHERE id = $1",
        [id],
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
