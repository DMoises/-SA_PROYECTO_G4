import os
import grpc
import jwt
import psycopg

def _rpc_terminator(code, details):
    """Helper to create a handler that immediately aborts the RPC."""
    def terminate(request, context):
        context.abort(code, details)
    return grpc.unary_unary_rpc_method_handler(terminate)

class SecurityInterceptor(grpc.ServerInterceptor):
    def __init__(self, config):
        self.cfg = config
        self.jwt_secret = config.jwt_secret
        self.auth_dsn = config.auth_dsn
        self.sub_dsn = config.sub_dsn
        self.catalog_dsn = config.dsn

    def intercept_service(self, continuation, handler_call_details):
        method = handler_call_details.method
        
        # We only apply security rules to content retrieval (ObtenerFichaTecnica)
        # ExplorarCartelera and BuscarContenido are public catalog searches.
        if "ObtenerFichaTecnica" not in method:
            return continuation(handler_call_details)

        # Extract metadata into a case-insensitive dictionary
        metadata = {k.lower(): v for k, v in handler_call_details.invocation_metadata}
        
        # 1. JWT Authentication
        auth_header = metadata.get("authorization", "")
        token = ""
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
        elif auth_header:
            token = auth_header

        if not token:
            return _rpc_terminator(grpc.StatusCode.UNAUTHENTICATED, "Falta token de autorizacion (JWT)")

        try:
            claims = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            usuario_id = claims.get("usuario_id")
        except jwt.PyJWTError as e:
            return _rpc_terminator(grpc.StatusCode.UNAUTHENTICATED, f"Token invalido: {str(e)}")

        # 2. Plan check (Standard only for downloads)
        is_download = metadata.get("x-download-request", "false").lower() in ("true", "1", "yes")
        
        # Query active plan name from subscription_db
        plan_name = None
        try:
            with psycopg.connect(self.sub_dsn) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT p.nombre_plan 
                        FROM suscripciones s
                        INNER JOIN planes p ON p.id = s.plan_id
                        WHERE s.usuario_id = %s AND s.estado_suscripcion = 'activa'
                        LIMIT 1
                        """,
                        (usuario_id,)
                    )
                    row = cur.fetchone()
                    if row:
                        plan_name = row[0]
        except Exception as e:
            return _rpc_terminator(grpc.StatusCode.INTERNAL, f"Error al validar suscripcion: {str(e)}")

        if not plan_name:
            return _rpc_terminator(grpc.StatusCode.PERMISSION_DENIED, "No posee una suscripcion activa")

        if is_download:
            if plan_name != "Estandar":
                return _rpc_terminator(
                    grpc.StatusCode.PERMISSION_DENIED, 
                    "La descarga de contenido esta reservada exclusivamente para el Plan Estandar"
                )

        # 3. Parental Control policies
        contenido_id = metadata.get("x-contenido-id")
        profile_id = metadata.get("x-profile-id")
        parental_pin = metadata.get("x-parental-pin")

        if not contenido_id:
            # We allow it to proceed if contenido ID is missing, but typically it should be sent
            return continuation(handler_call_details)

        # Fetch content classification from catalog_db
        classification = None
        try:
            with psycopg.connect(self.catalog_dsn) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT clasificacion FROM contenido WHERE id = %s", (contenido_id,))
                    row = cur.fetchone()
                    if row:
                        classification = row[0]
        except Exception as e:
            return _rpc_terminator(grpc.StatusCode.INTERNAL, f"Error al validar clasificacion: {str(e)}")

        # If content requires parental control check (not TP / Todo Publico)
        if classification and classification != "TP":
            if not profile_id:
                return _rpc_terminator(grpc.StatusCode.PERMISSION_DENIED, "Se requiere seleccionar un perfil para este contenido")

            # Fetch profile details from auth_db
            es_infantil = False
            db_pin = None
            try:
                with psycopg.connect(self.auth_dsn) as conn:
                    with conn.cursor() as cur:
                        cur.execute("SELECT es_infantil, pin FROM perfiles WHERE id = %s AND usuario_id = %s", (profile_id, usuario_id))
                        row = cur.fetchone()
                        if row:
                            es_infantil = bool(row[0])
                            db_pin = row[1]
            except Exception as e:
                return _rpc_terminator(grpc.StatusCode.INTERNAL, f"Error al validar perfil: {str(e)}")

            # If it is a kids profile, require the PIN to match
            if es_infantil:
                if not parental_pin or parental_pin != db_pin:
                    return _rpc_terminator(
                        grpc.StatusCode.PERMISSION_DENIED, 
                        "PIN de Control Parental incorrecto para reproducir este contenido"
                    )

        return continuation(handler_call_details)
