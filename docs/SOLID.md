# Documentación SOLID — Quetxal TV

Quetxal TV es una plataforma de streaming construida como **microservicios políglotas**
(Go, Python y TypeScript) que se comunican por **gRPC** detrás de un **API Gateway**.
Cada servicio sigue la misma **arquitectura por capas**, y esa separación es la que
materializa los principios SOLID:

```
         (transporte)            (negocio)          (datos)            (entidades)
Go      internal/grpc/handler →  service/        →  repository/     →  domain/
Python  app/handler.py        →  app/service.py  →  app/repository  →  (dicts/errors)
TS      *.controller.ts       →  *.service.ts    →  *.repository.ts →  interfaces/DTOs
                          ▲ ensamblado / inyección de dependencias:
                          Go: cmd/server/main.go · Python: app/server.py|main.py · TS: *.module.ts
```

Esta documentación corresponde al **RNF-06 — Mantenibilidad y calidad de código**.

## Resumen — dónde vive cada principio

| Principio | Servicios con evidencia | Mecanismo |
|---|---|---|
| **SRP** | auth (4 capas), catalog, notification, billing, fx | Separación handler / service / repository / domain |
| **OCP** | auth, fx, billing/catalog/rating, api-gateway | Interfaces de repositorio y de caché; servicios cerrados a modificación |
| **LSP** | auth, fx, catalog, rating, history | Implementaciones que cumplen el contrato de su interfaz / servicer gRPC |
| **ISP** | auth, fx, api-gateway, contratos `.proto` | Interfaces pequeñas y específicas por dominio |
| **DIP** | auth, billing, fx, catalog, notification | Inyección por constructor; el negocio depende de abstracciones, no de la BD |

---

# 1. SRP — Single Responsibility Principle

> *Una clase debe tener una sola razón para cambiar.* Cada capa tiene una única
> responsabilidad: el **handler/controller** habla el protocolo (gRPC/HTTP), el
> **service** tiene la lógica de negocio, el **repository** accede a datos y el
> **domain** son entidades puras.

## 1.1 auth-service (Go) — las 4 capas separadas

<p align="center"><img src="img/solid/srp-01-auth-handler.png" width="820" alt="SRP — auth handler (transporte)"/></p>

- **Dónde:** auth-service, **capa de transporte / adaptador gRPC**.
- **Cómo:** `AuthHandler` solo traduce gRPC ↔ dominio: recibe `*pb.LoginRequest`, delega en
  `AuthService` y convierte los errores de dominio a códigos gRPC con `aGRPC`. No contiene
  lógica de negocio ni SQL.
- **Por qué (mantenibilidad):** si cambia el contrato gRPC, solo se toca esta capa; el negocio
  queda intacto.

<p align="center"><img src="img/solid/srp-02-auth-service.png" width="820" alt="SRP — auth service (negocio)"/></p>

- **Dónde:** auth-service, **capa de lógica de negocio**.
- **Cómo:** `AuthService` concentra las reglas: normaliza el email, valida la contraseña,
  encripta con **Bcrypt** y orquesta el registro/login. Llama al repositorio por su interfaz,
  sin saber que detrás hay PostgreSQL.
- **Por qué (mantenibilidad / seguridad):** las reglas de negocio viven en un único lugar
  auditable; un cambio de política (longitud de password, hashing) no afecta transporte ni datos.

<p align="center"><img src="img/solid/srp-03-auth-repository.png" width="820" alt="SRP — auth repository (datos)"/></p>

- **Dónde:** auth-service, **capa de acceso a datos**.
- **Cómo:** `PostgresUsuarioRepo` ejecuta el SQL con `pgx`, maneja la transacción atómica
  usuario+perfil y traduce violaciones de constraint/trigger (`23505`, `23514`) a errores de dominio.
- **Por qué (mantenibilidad):** todo el SQL y los detalles de PostgreSQL están aislados aquí; el
  resto del servicio no contiene cadenas SQL.

<p align="center"><img src="img/solid/srp-04-auth-domain.png" width="820" alt="SRP — auth domain (entidades)"/></p>

- **Dónde:** auth-service, **capa de dominio**.
- **Cómo:** `Usuario` y `Perfil` son entidades puras con reglas propias (`EsLocal`, `Activo`) y
  **cero** dependencias de frameworks o de la BD.
- **Por qué (testabilidad):** el dominio se prueba sin levantar nada externo.

> Esta misma separación (handler / service / repository / domain) se repite en
> **catalog**, **rating**, **history**, **notification**, **billing** y **fx**.

---

# 2. OCP — Open/Closed Principle

> *Abierto a extensión, cerrado a modificación.* Se logra programando contra **interfaces**: se
> agregan implementaciones nuevas sin tocar el código que las consume.

<p align="center"><img src="img/solid/ocp-01-auth-interface.png" width="820" alt="OCP — interfaz UsuarioRepository"/></p>

- **Dónde:** auth-service (frontera negocio ↔ datos).
- **Cómo:** `AuthService` consume la **interfaz** `UsuarioRepository`. Para añadir una caché, una
  réplica de lectura u otra base de datos, se crea un nuevo tipo que implemente esa interfaz; no se
  modifica ni una línea de `AuthService`.
- **Por qué (extensibilidad / bajo riesgo):** agregar comportamiento no obliga a editar (ni
  re-probar) la lógica ya validada.

<p align="center"><img src="img/solid/ocp-02-fx-cache.png" width="600" alt="OCP — abstracción de caché"/></p>

- **Dónde:** fx-service.
- **Cómo:** `FXService` depende de un objeto caché con `get`/`set` (hoy `RedisCache`). Cambiar a
  Memcached o a una caché en memoria es crear otra clase con la misma forma e inyectarla en
  `main.py`; `FXService` no cambia.
- **Por qué (extensibilidad):** la política de cache-aside del servicio queda cerrada a modificación
  pero abierta a nuevas implementaciones de almacenamiento.

El mismo mecanismo de "repositorio inyectado" hace extensibles a **catalog**, **rating** y
**billing** (un nuevo origen de datos = una nueva clase repositorio), y el **api-gateway** se
extiende agregando un `client` + `handler` por servicio sin tocar los existentes.

---

# 3. LSP — Liskov Substitution Principle

> *Toda implementación debe poder sustituir a su abstracción sin romper al consumidor.*

<p align="center"><img src="img/solid/lsp-01-auth-impl.png" width="820" alt="LSP — PostgresUsuarioRepo implementa UsuarioRepository"/></p>

- **Dónde:** auth-service.
- **Cómo:** `PostgresUsuarioRepo` cumple **completamente** el contrato `UsuarioRepository` (mismas
  firmas, devuelve los errores de dominio esperados). `AuthService` trabaja con la interfaz, así que
  cualquier implementación válida lo reemplaza sin cambios.
- **Por qué (confiabilidad):** se pueden inyectar dobles en pruebas o cambiar de implementación con
  garantía de que el servicio sigue funcionando.

<p align="center"><img src="img/solid/lsp-02-grpc-servicer.png" width="700" alt="LSP — handler implementa el servicer gRPC"/></p>

- **Dónde:** servicios gRPC (Go: `UnimplementedAuthServiceServer`; Python: `*ServiceServicer`).
- **Cómo:** cada handler hereda del *servicer* generado y respeta sus firmas `(request, context)`,
  por lo que el servidor gRPC lo registra y lo invoca **como si fuera la clase base**.
- **Por qué (confiabilidad):** el framework gRPC trata a todos los handlers de forma uniforme; un
  handler mal formado no compilaría ni se registraría.

---

# 4. ISP — Interface Segregation Principle

> *Ninguna clase debe depender de métodos que no usa.* Las interfaces son pequeñas y por dominio.

<p align="center"><img src="img/solid/isp-01-auth-interface.png" width="760" alt="ISP — interfaz pequeña"/></p>

- **Dónde:** auth-service.
- **Cómo:** `UsuarioRepository` expone **exactamente** los 4 métodos que `AuthService` necesita
  (`CrearUsuarioConPerfilInicial`, `ObtenerPorEmail`, `CrearPerfil`, `ListarPerfiles`). No es una
  interfaz "gorda" con operaciones que nadie usa.
- **Por qué (claridad / testabilidad):** un doble de pruebas implementa solo 4 métodos; las
  dependencias quedan explícitas y mínimas.

<p align="center"><img src="img/solid/isp-03-proto-contract.png" width="700" alt="ISP — contrato gRPC segregado por dominio"/></p>

- **Dónde:** contratos gRPC (`auth.proto`, `billing.proto`, `catalog.proto`, `fx.proto`, `rating.proto`, `history.proto`, `notification.proto`).
- **Cómo:** cada servicio define **su propio** contrato pequeño con solo sus RPCs; no existe una
  interfaz monolítica que todos deban implementar.
- **Por qué (modularidad):** un cliente del gateway depende únicamente de las operaciones del
  dominio que consume.

---

# 5. DIP — Dependency Inversion Principle

> *Los módulos de alto nivel dependen de abstracciones, no de detalles; las dependencias se
> **inyectan**.*

<p align="center"><img src="img/solid/dip-01-auth-wiring.png" width="820" alt="DIP — wiring auth-service"/></p>

- **Dónde:** auth-service, `main.go` (composición).
- **Cómo:** `main` crea las implementaciones concretas (`PostgresUsuarioRepo`, `JWTManager`) y las
  **inyecta** en `AuthService`, que solo conoce la **interfaz** `UsuarioRepository`. El detalle
  (PostgreSQL) se decide en el borde, no en el negocio.
- **Por qué (flexibilidad):** si se migra de PostgreSQL a otra base de datos, se crea un nuevo
  repositorio que implemente `UsuarioRepository` y se inyecta, sin tocar una sola línea de
  `AuthService`.

<p align="center"><img src="img/solid/dip-03-billing-di.png" width="820" alt="DIP — billing DI"/></p>

- **Dónde:** billing-service.
- **Cómo:** el acceso a BD se encapsula en un `DatabaseService` `@Injectable`, expuesto por un
  `DatabaseModule` `@Global`. `BillingService` recibe por constructor su `BillingRepository` y el
  `FxClient`, en vez de importar una conexión global.
- **Por qué (testabilidad / modularidad):** las dependencias son explícitas e intercambiables por
  dobles (`billing.service.spec.ts`).

> El mismo patrón de inyección está en **fx** (`app/main.py`: `db/cache → repo → service → handler`),
> **catalog/rating** (`app/server.py`) y **notification** (`DatabaseService` con `DatabaseModule` `@Global`).
