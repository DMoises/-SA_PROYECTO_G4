# **Organización de Tareas — Quetxal TV Fase 2**

## **📊 Estado del Proyecto**

* **Docker y Compose:** ✅ Completado (Dockerfiles, docker-compose local y nube listos).  
* **CI/CD:** 🟡 En progreso (Workflows de GitHub Actions base configurados, falta ajustar despliegues finales).  
* **Kubernetes:** 🟡 En progreso (Manifiestos YAML creados exitosamente, falta enlazarlos en CI/CD).  
* **Desarrollo Backend/Frontend (Fase 2):** 🟡 En progreso (Auditoría, Panel Admin en curso).

## **⚠️ Notas Importantes (Según Enunciado Oficial)**

* **CI/CD y Pruebas:** OBLIGATORIO un mínimo de **75% de Code Coverage**. El pipeline debe hacer cortocircuito (detenerse) si fallan las pruebas.  
* **Despliegues:** ESTRICTAMENTE prohibido despliegues manuales; TODO debe ser vía CI/CD. No hacer commits directos a `main` o `develop`, usar Pull Requests obligatoriamente.  
* **Kubernetes:** Obligatorio usar **Ingress** (no exponer servicios directos con LoadBalancer). Configurar Limits/Requests de CPU/Memoria, ConfigMaps y Secrets.  
* **Resiliencia:** Backup automatizado de las DBs (excepto Redis). Despliegues con RollingUpdate (maxSurge, maxUnavailable) y Rollback automatizado en Kubernetes.  
* **Documentación:** Lo no documentado no será calificado. Subir diagramas y archivos fuente (UML/Mockups).  
* **Restricciones:** No usar Supabase/Prisma. Los sistemas Cloud solo se pueden dar de baja DESPUÉS de la calificación.

---

## **✅ Completado / Ya asignado**

| Tarea | Descripción | Responsable | Estado |
| ----- | ----------- | ----------- | ------ |
| Panel de Administración y Catálogo Dinámico (CRUD) | Interfaz web para gestión del catálogo (agregar, editar, eliminar y programar estrenos de series/películas). | Moisés | ✅ Completado |
| 3. Auditoría interna transaccional por triggers | Implementación de triggers en las BDs operacionales para llevar registro en la tabla de auditoría ante cualquier INSERT/UPDATE. | JuanJose | ✅ Completado |
| Fase de integración y Testing (CI) | Compilación y ejecución de pruebas en backend con requisito de 75% coverage. Pipeline con detención obligatoria ante fallos. | Fernando | 🟡 En progreso |
| 4. Generación de reportes estructurados | Visualización de logs transaccionales en el panel admin y exportación en formatos .csv y PDF. | — | 🟡 En progreso |

---

## **🔲 Por asignar**

### **📦 Alcance del sistema**

| Tarea | Descripción | Responsable | Estado |
| ----- | ----------- | ----------- | ------ |
| 2. Integración con Google Cloud Storage (GCS) | Persistencia de archivos de video e imágenes pesadas en Buckets GCS, sacándolos del sistema local. | Joshua | 🔴 Pendiente |
| 2. GCS en Reproductor Web | El frontend debe consumir multimedia directo desde GCS mediante URLs públicas/firmadas, mostrando el tiempo de duración. | Joshua | 🔴 Pendiente |

---

### **☸️ Kubernetes & Infraestructura**

| Tarea | Descripción | Responsable | Estado |
| ----- | ----------- | ----------- | ------ |
| 8. Manifiestos YAML de Kubernetes | Configuración de Deployments, Services (Ingress), ConfigMaps y Secrets, sin dejar credenciales hardcodeadas. | AI/Moisés | ✅ Completado |
| 9. Despliegue Zero-Downtime y Rollback | Implementar esquema RollingUpdate (`maxSurge`, `maxUnavailable`) y Rollback automático ante fallo (`CrashLoopBackOff`). | AI/Moisés | ✅ Completado |
| 10. Monitoreo de Salud de la Aplicación | Configuración mandatoria de Liveness Probe y Readiness Probe dentro de todos los contenedores desplegados. | AI/Moisés | ✅ Completado |

---

### **⚙️ CI/CD & Control de Versiones**

| Tarea | Descripción | Responsable | Estado |
| ----- | ----------- | ----------- | ------ |
| Construcción y Versionamiento de Imágenes Docker | Empaquetado frontend/backend a un registro privado. Etiquetado semántico (v2.x.x) obligatorio solo al tocar release. | — | 🟡 En progreso |
| Despliegue Continuo rama `develop` → Compute Engine | Actualización automática y despliegue del proyecto hacia las máquinas virtuales GCE ante un merge en `develop`. | — | ✅ Completado |
| Despliegue Continuo rama `release` → GKE | Automatización de infraestructura hacia Kubernetes de Google usando estrategias de despliegue progresivo. | — | 🔴 Pendiente |
| Resiliencia de Datos (Backup Automatizado) | Script y workflow que genere respaldos automatizados recurrentes para las bases de datos (excluyendo Redis). | Juanjo | ✅ Completado |
| 11. Historial de Git | Evidencia del flujo de código y aprobaciones (PRs) requeridos y evitar commits a main/develop, sumado al tag de v2.0.0. | — | 🟡 En progreso |

---

### **📄 Entregables de Documentación**

| Tarea | Descripción | Responsable | Estado |
| ----- | ----------- | ----------- | ------ |
| 1. Principios SOLID | Definir Dónde, Cómo y Por Qué se utilizaron los 5 principios SOLID en las distintas capas del software. | — | 🔴 Pendiente |
| 2. Justificación de Decisiones Técnicas | Respaldo escrito por el uso de cada herramienta, nube, BDs, lenguajes, CI/CD y mecanismos de seguridad. | — | 🔴 Pendiente |
| 3. Diagramas de Casos de Uso y Modelo 4+1 | Adaptación del Modelo 4+1 Vistas de Kruchten e inclusión de nuevos flujos para el administrador. | — | 🔴 Pendiente |
| 4. Pipeline CI/CD (Flujo y Justificación) | Esquema visual del pipeline, validación 75% coverage, backup de DBs y justificación del diseño. | — | 🔴 Pendiente |
| 4. Diagrama Entidad-Relación (ER) | Esencial incluir stored procedures, vistas, funciones y los triggers/tabla de auditoría. | — | 🔴 Pendiente |
| 5. Diagrama de Arquitectura (Alto Nivel) | Dibujo macro uniendo todas las interacciones: nube, repos, bases de datos, web, redis, GCS. | — | 🔴 Pendiente |
| 6. Diseño UI/UX | Elaboración de Mockups/wireframes detallados de las vistas de la página y el Panel Administrativo. | — | 🔴 Pendiente |
| 7. Arquitectura del Clúster de Kubernetes | Detalle lógico de despliegue: nodos, namespaces, recursos por Pod y puerta de enlace Ingress. | Chan | ✅ Completado |
| 8. Manifiestos y Estrategias (Zero-Downtime) | Justificar uso de Secrets/ConfigMaps, sondas Liveness/Readiness y matemáticas del `maxSurge`/`maxUnavailable`. | — | 🔴 Pendiente |
