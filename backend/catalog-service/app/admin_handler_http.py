"""Servidor HTTP liviano para operaciones CRUD del panel de administracion.

Corre en un thread separado junto al servidor gRPC. El API Gateway lo invoca
internamente (red Docker) — nunca queda expuesto al publico.

Rutas:
  GET  /admin/contenidos          lista completa (incluyendo inactivos)
  POST /admin/contenidos          crear nuevo contenido
  GET  /admin/contenidos/{id}     obtener uno
  PUT  /admin/contenidos/{id}     actualizar
  DELETE /admin/contenidos/{id}   soft-delete
  GET  /admin/generos             lista de generos
  GET  /admin/categorias          lista de categorias
"""
import json
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any

from .admin_repository import AdminRepository


def _json(data: Any) -> bytes:
    def default(o: Any) -> Any:
        import datetime
        if isinstance(o, (datetime.datetime, datetime.date)):
            return o.isoformat()
        raise TypeError(f"Object of type {type(o)} is not JSON serializable")
    return json.dumps(data, default=default).encode("utf-8")


class AdminHTTPHandler(BaseHTTPRequestHandler):
    repo: AdminRepository  # inyectado al crear el servidor

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"[admin-http] {fmt % args}", flush=True)

    def _send(self, status: int, data: Any) -> None:
        body = _json(data)
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> Any:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw)

    # ------------------------------------------------------------------
    def do_GET(self) -> None:
        path = self.path.split("?")[0].rstrip("/")

        if path == "/admin/contenidos":
            self._send(200, self.repo.listar_todos())
            return

        m = re.fullmatch(r"/admin/contenidos/([^/]+)", path)
        if m:
            row = self.repo.obtener_por_id(m.group(1))
            if row is None:
                self._send(404, {"error": "no encontrado"})
            else:
                self._send(200, row)
            return

        if path == "/admin/generos":
            self._send(200, self.repo.listar_generos())
            return

        if path == "/admin/categorias":
            self._send(200, self.repo.listar_categorias())
            return

        self._send(404, {"error": "ruta no encontrada"})

    def do_POST(self) -> None:
        path = self.path.split("?")[0].rstrip("/")
        if path == "/admin/contenidos":
            try:
                datos = self._read_json()
                if not datos.get("titulo") or not datos.get("tipo"):
                    self._send(400, {"error": "titulo y tipo son obligatorios"})
                    return
                nuevo = self.repo.crear_contenido(datos)
                self._send(201, nuevo)
            except Exception as exc:
                print(f"[admin-http] ERROR POST: {exc}", flush=True)
                self._send(500, {"error": str(exc)})
            return
        self._send(404, {"error": "ruta no encontrada"})

    def do_PUT(self) -> None:
        path = self.path.split("?")[0].rstrip("/")
        m = re.fullmatch(r"/admin/contenidos/([^/]+)", path)
        if m:
            try:
                datos = self._read_json()
                actualizado = self.repo.actualizar_contenido(m.group(1), datos)
                if actualizado is None:
                    self._send(404, {"error": "no encontrado"})
                else:
                    self._send(200, actualizado)
            except Exception as exc:
                print(f"[admin-http] ERROR PUT: {exc}", flush=True)
                self._send(500, {"error": str(exc)})
            return
        self._send(404, {"error": "ruta no encontrada"})

    def do_DELETE(self) -> None:
        path = self.path.split("?")[0].rstrip("/")
        m = re.fullmatch(r"/admin/contenidos/([^/]+)", path)
        if m:
            try:
                self.repo.eliminar_contenido(m.group(1))
                self._send(200, {"ok": True})
            except Exception as exc:
                print(f"[admin-http] ERROR DELETE: {exc}", flush=True)
                self._send(500, {"error": str(exc)})
            return
        self._send(404, {"error": "ruta no encontrada"})


def make_server(port: int, repo: AdminRepository) -> HTTPServer:
    # Inyectamos el repo en la clase del handler (patron de http.server).
    handler = type("_H", (AdminHTTPHandler,), {"repo": repo})
    srv = HTTPServer(("0.0.0.0", port), handler)
    return srv
