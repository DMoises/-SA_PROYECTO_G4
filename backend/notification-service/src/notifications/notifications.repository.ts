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
  // INOUT p_id se devuelve en la fila resultante del CALL.
  async encolar(
    usuarioId: string,
    tipo: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const res = await this.db.query<{ p_id: string }>(
      'CALL sp_encolar_correo($1, $2, $3::jsonb, NULL)',
      [usuarioId, tipo, JSON.stringify(payload)],
    );
    return res.rows[0]?.p_id;
  }

  // Lote de correos pendientes (FIFO) desde la vista.
  async obtenerPendientes(limite: number): Promise<CorreoPendiente[]> {
    const res = await this.db.query<CorreoPendiente>(
      'SELECT id, usuario_id, tipo, payload, intentos, creado_en FROM vista_buzon_pendiente LIMIT $1',
      [limite],
    );
    return res.rows;
  }

  async marcarEnviado(id: string): Promise<void> {
    await this.db.query(
      "UPDATE buzon_salida SET estado_envio = 'enviado', enviado_en = now() WHERE id = $1",
      [id],
    );
  }

  async marcarFallido(id: string): Promise<void> {
    await this.db.query(
      "UPDATE buzon_salida SET estado_envio = 'fallido', intentos = intentos + 1 WHERE id = $1",
      [id],
    );
  }
}
