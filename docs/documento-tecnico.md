# Documento Técnico — Quetxal TV · Fase 3

> Plataforma de streaming políglota con infraestructura como código, persistencia aislada,
> observabilidad y CI/CD. *(Documento en formato Markdown, con archivos crudos versionados en el repo.)*

## Tabla de Integrantes

| Nombre | Carné | Rol / Tareas |
|---|---|---|
| _Joshua_ | _________ | Infraestructura IaC (Terraform 7, Ansible 8), Persistencia aislada + Ingress (9), CronJob de depuración (6) |
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

_TODO (equipo):_ contexto del proyecto, objetivo de la Fase 3 (capacidades inteligentes, infraestructura
replicable y monitoreable, persistencia aislada) y alcance del documento.

## 2. Descripción del Problema

_TODO (equipo):_ diagnóstico del negocio, cuellos de botella, justificación del cambio.

## 3. Toma y Justificación de Decisiones

Estructura "¿Qué? / ¿Por qué? / ¿Para qué?" por cada decisión:

- **Matriz políglota (Go / Python / TypeScript)** — _TODO_
- **Infraestructura como Código (Terraform + Ansible)** — ✅ ver [Manual de Terraform](manuales/manual-terraform.md) y [Manual de Ansible](manuales/manual-ansible.md). *Justificación: aprovisionamiento declarativo, reproducible y destruible; configuración agentless.*
- **Bases de datos externas (Compute Engine, fuera de K8s)** — ✅ Persistencia Aislada: las BD viven en una VM dedicada con disco persistente; GKE las consume vía Services + Endpoints. *(detalle abajo / en manuales)*
- **Esquema de sesiones / seguridad (JWT, interceptores gRPC)** — _TODO_
- **Observabilidad (ELK + Prometheus/Grafana)** — _TODO_
- **Nube (GCP: GKE, Compute Engine, GCS)** — _TODO_

## 4. Arquitectura (Modelo 4+1 de Kruchten)

- **Vista Lógica** — _TODO (diagrama)_
- **Vista de Procesos** — _TODO_
- **Vista de Desarrollo** — _TODO_
- **Vista Física / Despliegue** — _TODO (diagrama con GKE + VM de BD + VMs dev + monitoreo)_
- **Escenarios (+1)** — _TODO (casos de uso)_

> Estado real desplegado (Fase 3):
> - `release → GKE`: front público en `/` (Ingress nginx) · microservicios + API Gateway · BD externa.
> - `develop → VMs`: gateway + frontend (VM gateway) + 7 microservicios (VM services) · BD externa.

## 5. Manuales de Infraestructura, Operaciones y Pruebas

| Manual | Tarea | Estado | Enlace |
|---|---|---|---|
| Terraform | 7 / 16 | ✅ | [manuales/manual-terraform.md](manuales/manual-terraform.md) |
| Ansible | 8 / 17 | ✅ | [manuales/manual-ansible.md](manuales/manual-ansible.md) |
| Stack ELK (logs) | 11 / 18 | 🔲 _TODO_ | `manuales/manual-elk.md` |
| Prometheus & Grafana (métricas) | 12 / 19 | ✅ | [manuales/manual-prometheus-grafana.md](manuales/manual-prometheus-grafana.md) |
| Locust (pruebas de carga) | 15 / 20 | 🔲 _TODO_ | `manuales/manual-locust.md` |

## 6. Algoritmo de Recomendación

_TODO (equipo):_ algoritmo de Netflix seleccionado (filtrado colaborativo / basado en contenido),
modelo matemático/lógico e implementación.

## 7. Flujo de CI/CD

_TODO (diagrama):_ etapas (compilación, pruebas con umbral 75% y cortocircuito, empaquetado) y
bifurcación por rama: `develop → Compute Engine (VMs)` y `release → GKE`. Smoke tests post-deploy.

## 8. Diagramas

> Cargar los **archivos crudos** (`.drawio`, `.puml`, `.excalidraw`) en `docs/` además de las imágenes.

- Diagrama de bloques / arquitectura de alto nivel (con monitoreo) — _TODO_
- Modelo 4+1 actualizado — _TODO_
- Diagrama de despliegue (Kubernetes + VMs + BD externa) — _TODO_
- Diagrama Entidad-Relación (con SP, vistas, funciones, triggers) — _TODO_
- Casos de uso del administrador (extendidos) — _TODO_

## 9. Conclusiones

_TODO (equipo)._
