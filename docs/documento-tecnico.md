# Documento Técnico — Quetxal TV · Fase 3

> Plataforma de streaming políglota con infraestructura como código, persistencia aislada,
> observabilidad y CI/CD. *(Documento en formato Markdown, con archivos crudos versionados en el repo.)*

## Tabla de Integrantes

| Nombre | Carné | Rol / Tareas |
|---|---|---|
| _Joshua_ | _________ | Infraestructura IaC (Terraform 7, Ansible 8), Persistencia aislada + Ingress (9), CronJob de depuración (6), Observabilidad (ELK + Prometheus/Grafana) |
| _Moisés_ | _________ | _____________________ |
| _Juan José_ | _________ | _____________________ |
| _Fernando_ | _________ | _____________________ |
| _________ | _________ | _____________________ |

---

## Índice

1. [Introducción](#1-introducción)
2. [Descripción del Problema](#2-descripción-del-problema)
3. [Toma y Justificación de Decisiones](#3-toma-y-justificación-de-decisiones)
4. [Arquitectura (Modelo 4+1 de Kruchten)](#4-arquitectura-modelo-41-de-kruchten)
5. [Manuales de Infraestructura, Operaciones y Pruebas](#5-manuales-de-infraestructura-operaciones-y-pruebas)
6. [Algoritmo de Recomendación](#6-algoritmo-de-recomendación)
7. [Flujo de CI/CD](#7-flujo-de-cicd)
8. [Diagramas](#8-diagramas)
9. [Conclusiones](#9-conclusiones)

---

## 1. Introducción

Quetxal TV es una plataforma de streaming de video construida sobre una **arquitectura de
microservicios políglota**. Tras consolidar en fases anteriores el catálogo, la gestión de
cuentas/suscripciones y un pipeline de CI/CD, la **Fase 3** lleva la plataforma a su madurez
operativa con cuatro objetivos:

1. **Capacidades inteligentes** para la retención de usuarios (motor de recomendación, control
   parental, watch party, descargas).
2. **Infraestructura replicable y destruible** mediante Infraestructura como Código
   (Terraform + Ansible), eliminando la configuración manual de servidores.
3. **Persistencia aislada**: las bases de datos relacionales salen del ciclo de vida efímero
   de los contenedores y viven en servidores dedicados.
4. **Observabilidad proactiva**: monitoreo de métricas (Prometheus/Grafana) y centralización
   de logs (ELK), más pruebas de carga (Locust) para validar el comportamiento bajo concurrencia.

Este documento justifica las decisiones arquitectónicas, describe la arquitectura bajo el modelo
**4+1 de Kruchten** y enlaza los manuales operativos y la evidencia de despliegue en la nube (GCP).

## 2. Descripción del Problema

En un servicio de streaming comercial, la infraestructura no puede aprovisionarse a mano ni
configurarse entrando por SSH a cada servidor: se **codifica, versiona y destruye bajo demanda**.
Además, operaciones necesita **visibilidad total** sobre la salud de los contenedores y los
cuellos de botella (correlación de métricas y logs) **antes** de que afecten al cliente. Por
último, el motor de base de datos relacional debe **aislarse del ciclo de vida efímero** de los
contenedores de aplicación, para garantizar la integridad y persistencia de datos críticos fuera
del clúster de cómputo.

Los cuellos de botella que ataca la Fase 3:

- **Aprovisionamiento manual y no reproducible** → IaC con Terraform (recursos) + Ansible (configuración).
- **Pérdida de datos al recrear contenedores** → BD en VM dedicada con disco persistente.
- **Falta de visibilidad operativa** → métricas (Prometheus/Grafana) + logs (ELK) centralizados.
- **Sin garantías ante ráfagas de tráfico** → pruebas de carga con Locust sobre las rutas críticas.

## 3. Toma y Justificación de Decisiones

Estructura "¿Qué? / ¿Por qué? / ¿Para qué?" por cada decisión:

### 3.1 Matriz políglota (Go / Python / TypeScript)

**Qué:** cada microservicio usa el lenguaje más adecuado a su dominio.

| Lenguaje | Servicios | Por qué |
|---|---|---|
| **Go** | api-gateway, auth-service, history-service, watchparty-service | Concurrencia nativa (goroutines) y bajo overhead para el gateway, gRPC y WebSockets (watch party). |
| **Python** | catalog-service, fx-service, rating-service | Rapidez de desarrollo y librerías para lógica de catálogo, conversión de divisas y recomendación. |
| **TypeScript/Node** | billing-service, notification-service, frontend (Next.js) | Ecosistema fuerte para I/O asíncrono (pagos, notificaciones) y SSR/BFF en el frontend. |

**Para qué:** desacoplar equipos y optimizar cada servicio sin imponer un único stack. La
comunicación entre servicios es **gRPC + Protocol Buffers** (contratos tipados y eficientes).

### 3.2 Infraestructura como Código (Terraform + Ansible)

**Qué:** Terraform declara los recursos de GCP (VPC, subred, firewall, GKE, VMs, discos, IAM);
Ansible (agentless, por SSH) aprovisiona Docker y levanta los servicios en las VMs.
**Por qué:** elimina el error humano, hace la infra **reproducible y destruible**, y deja el
estado auditable. **Para qué:** poder recrear todo el entorno desde cero de forma declarativa.
→ Ver [Manual de Terraform](manuales/manual-terraform.md) y [Manual de Ansible](manuales/manual-ansible.md).

### 3.3 Persistencia aislada (bases de datos fuera de Kubernetes)

**Qué:** las 7 bases PostgreSQL + Redis corren vía Docker Compose en una **VM dedicada de
Compute Engine** (`quetxal-database-vm`, IP interna `10.10.0.10`) con **disco persistente**
separado del SO. GKE las consume mediante **Services sin selector + Endpoints** que apuntan a la VM.
**Por qué:** el enunciado prohíbe desplegar motores de BD dentro de los Pods; los contenedores de
app son efímeros y no deben custodiar datos críticos. **Para qué:** garantizar integridad y
persistencia de datos aunque se recree toda la malla de cómputo.

### 3.4 Esquema de sesiones / seguridad (JWT + interceptores gRPC)

**Qué:** `auth-service` emite **JWT** firmados con un secreto compartido (`JWT_SECRET`, inyectado
como Secret de Kubernetes / variable en las VMs). Los microservicios validan el token mediante
**interceptores gRPC** antes de procesar la petición, verificando rol y tipo de plan (p. ej.
Estándar para descargas, Premium para iniciar Watch Party) y las políticas de Control Parental.
**Por qué:** centralizar la emisión y descentralizar la validación, sin estado de sesión en cada
servicio. **Para qué:** autorización consistente y de bajo acoplamiento en toda la malla.

### 3.5 Observabilidad (ELK + Prometheus/Grafana)

**Qué:** dos stacks complementarios desplegados en la nube:
- **Métricas (Prometheus + Grafana):** `node_exporter` en las VMs y como DaemonSet en GKE,
  Prometheus scrapea el clúster (nodos, cAdvisor, pods) y las VMs externas; Grafana grafica
  CPU/memoria/red/pods. → [Manual de Prometheus y Grafana](manuales/manual-prometheus-grafana.md).
- **Logs (ELK):** Filebeat (DaemonSet en GKE + contenedor en cada VM) envía los logs a Logstash,
  que filtra y los indexa en Elasticsearch; Kibana los visualiza. → [Manual de ELK](manuales/manual-elk.md).

**Por qué:** separar métricas (series temporales por scraping) de logs (eventos centralizados)
es el patrón estándar; cada uno responde preguntas distintas (¿cómo está el sistema? vs ¿qué pasó?).
**Para qué:** detectar cuellos de botella y diagnosticar incidentes **antes** de que afecten al
cliente. Ambos corren en infraestructura cloud (ELK en VM dedicada; Prometheus/Grafana en GKE).

### 3.6 Nube (GCP: GKE, Compute Engine, GCS)

**Qué:** GKE (orquestación del entorno `release`), Compute Engine (VMs de BD, desarrollo y ELK),
Google Cloud Storage (multimedia con **Signed URLs v4** firmadas vía **Workload Identity**, sin
llaves estáticas), VPC-native con Cloud NAT, e Ingress nginx como único punto de entrada web.
**Por qué:** servicios administrados que reducen operación; Workload Identity y Workload Identity
Federation eliminan llaves de larga vida (la app firma GCS y el CI/CD se autentica a GCP por OIDC).
**Para qué:** un entorno elástico, seguro y sin secretos estáticos en el repositorio.

## 4. Arquitectura (Modelo 4+1 de Kruchten)

- **Vista Lógica** — microservicios por dominio (auth, catalog, billing, rating, fx, history,
  notification, watchparty) detrás del API Gateway; el frontend habla con el gateway (patrón BFF).
  ![Vista Lógica](img/modelo4vistas/vistaLogica.png)
- **Vista de Procesos** — comunicación gRPC entre servicios, validación por interceptores,
  flujos asíncronos (Outbox de notificaciones, cobros).
  ![Vista de Procesos](img/modelo4vistas/procesos.png)
- **Vista de Desarrollo** — organización del monorepo: `backend/<servicio>`, `frontend/`,
  `k8s/`, `terraform/`, `ansible/`, contratos `proto/`. Pipeline de CI/CD por GitHub Actions.
- **Vista Física / Despliegue** — `release` en GKE (Ingress nginx → frontend/gateway →
  microservicios) + BD externa en VM + VMs de desarrollo + VM de ELK + Prometheus/Grafana en GKE.
  ![Vista de Despliegue](img/modelo4vistas/despliegue.png)
- **Escenarios (+1)** — casos de uso que recorren las vistas (registro, reproducción con
  suscripción, recomendación, control parental, watch party).
  ![Escenarios](img/modelo4vistas/v+1.png)

> Estado real desplegado (Fase 3):
> - `release → GKE`: front público en `/` (Ingress nginx) · microservicios + API Gateway · BD externa.
> - `develop → VMs`: gateway + frontend (VM gateway) + 7 microservicios (VM services) · BD externa.

## 5. Manuales de Infraestructura, Operaciones y Pruebas

| Manual | Tarea | Estado | Enlace |
|---|---|---|---|
| Terraform | 7 / 16 | ✅ | [manuales/manual-terraform.md](manuales/manual-terraform.md) |
| Ansible | 8 / 17 | ✅ | [manuales/manual-ansible.md](manuales/manual-ansible.md) |
| Stack ELK (logs) | 11 / 18 | ✅ | [manuales/manual-elk.md](manuales/manual-elk.md) |
| Prometheus & Grafana (métricas) | 12 / 19 | ✅ | [manuales/manual-prometheus-grafana.md](manuales/manual-prometheus-grafana.md) |
| Locust (pruebas de carga) | 15 / 20 | ✅ | [manuales/manual-locust.md](manuales/manual-locust.md) |

## 6. Algoritmo de Recomendación

**Selección:** *Recomendación Basada en Contenido / Géneros*. El sistema analiza el **historial de
reproducción reciente** y las **calificaciones previas** del perfil para inferir sus géneros
preferidos y generar dinámicamente la sección **"Recomendados para ti"** en el frontend.

**Lógica (alto nivel):**
1. Se obtienen los géneros del contenido que el usuario reprodujo y calificó positivamente
   (señal de preferencia ponderada por calificación).
2. Se construye un perfil de afinidad por género para el usuario.
3. Se puntúa el catálogo no visto según la coincidencia de géneros con ese perfil de afinidad.
4. Se devuelven los títulos mejor puntuados, excluyendo los ya vistos.

**Implementación:** reside en `rating-service` (Python), que cruza calificaciones e historial con
los géneros del catálogo y expone la recomendación vía gRPC; el API Gateway la sirve al frontend.

> _Equipo: completar el modelo matemático/lógico exacto (fórmula de afinidad / ponderación)._

## 7. Flujo de CI/CD

Pipeline en **GitHub Actions** bajo la premisa de **cortocircuito crítico**: si fallan pruebas,
compilación o scripts, el pipeline se detiene de inmediato e impide el avance a empaquetado/despliegue.

**Etapas:**
1. **Pruebas (CI):** unitarias/integración con umbral estricto de **≥ 75% de cobertura de
   endpoints**; fail-fast ante cualquier error.
2. **Build & Push:** construcción de imágenes Docker por servicio y publicación al registry
   (versionado semántico en la rama `release`, tag `vX.Y.Z`).
3. **Despliegue por rama (bifurcación):**
   - `release → GKE` (`deploy-k8s.yml`): autenticación a GCP por **Workload Identity Federation**
     (sin llaves); aplica base, BD externa (Services+Endpoints), microservicios, API Gateway,
     CronJobs, Ingress, y los stacks de observabilidad (Prometheus/Grafana + Filebeat). Incluye
     **rollback automático** ante fallo de rollout.
   - `develop → Compute Engine (VMs)` (`deploy-gateway/services/database`): despliegue por SSH
     a las VMs (gateway + servicios + BD).
4. **Smoke Tests post-deploy** (`smoke-tests.yml`): tras el despliegue, certifican que las rutas
   base del API Gateway y las conexiones críticas están en línea, **descubriendo la IP viva** del
   entorno (no dependen de IPs fijas, así sobreviven a un destroy/recreate).
5. **Backup programado** (`scheduled-backup.yml`): respaldo automatizado de las BD operacionales.

> _Equipo: incluir el diagrama de flujo del pipeline con las herramientas de testing._

## 8. Diagramas

> Cargar los **archivos crudos** (`.drawio`, `.puml`, `.excalidraw`) en `docs/` además de las imágenes.

- **Modelo 4+1** — diagramas en `docs/img/modelo4vistas/` (lógica, procesos, despliegue, +1).
- **Diagrama de despliegue (Kubernetes + VMs + BD externa + monitoreo)** — `img/modelo4vistas/despliegue.png`.
  _Equipo: verificar que refleje ELK + Prometheus/Grafana; actualizar si falta._
- **Arquitectura de alto nivel con monitoreo** — _equipo (diagrama)._
- **Diagrama Entidad-Relación (con SP, vistas, funciones, triggers)** — _equipo (diagrama + crudo)._
- **Casos de uso del administrador (extendidos)** — _equipo (diagrama + crudo)._
- **Flujo de CI/CD con herramientas de testing** — _equipo (diagrama)._

## 9. Conclusiones

- La adopción de **IaC (Terraform + Ansible)** convirtió la infraestructura en código reproducible
  y destruible: todo el entorno (VPC, GKE, VMs, BD, ELK) se levanta de forma declarativa.
- La **persistencia aislada** (BD en VM dedicada con disco persistente, consumida por GKE vía
  Services+Endpoints) desacopla los datos del ciclo de vida efímero de los contenedores.
- La **observabilidad dual** (métricas con Prometheus/Grafana y logs con ELK) da visibilidad
  proactiva sobre hardware, red, contenedores y eventos de todo el sistema, en la nube.
- Las **pruebas de carga con Locust** validaron que la malla soporta concurrencia (50 usuarios,
  ~1300 peticiones, **0 fallos**) detrás del Ingress, con la BD externa.
- El **CI/CD con cortocircuito crítico**, versionado semántico, despliegue por rama, smoke tests
  y rollback automático cierra el ciclo de entrega de forma segura y sin llaves estáticas (WIF).

> _Equipo: ampliar con lecciones aprendidas y trabajo futuro._
