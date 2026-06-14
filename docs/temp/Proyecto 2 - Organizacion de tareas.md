# **Organización de Tareas — Quetxal TV Fase 2**

## **📊 Estado del Proyecto**
- **Docker y Compose:** ✅ Completado (Dockerfiles, docker-compose local y nube listos).
- **CI/CD:** 🟡 En progreso (Workflows de GitHub Actions base configurados, falta ajustar despliegues finales).
- **Kubernetes:** 🔴 Pendiente (Faltan los manifiestos YAML y despliegue del clúster).
- **Desarrollo Backend/Frontend (Fase 2):** 🟡 En progreso (Auditoría, Panel Admin en curso).

## **⚠️ Notas Importantes (Según Enunciado Oficial)**
- **CI/CD y Pruebas:** OBLIGATORIO un mínimo de **75% de Code Coverage**. El pipeline debe hacer cortocircuito (detenerse) si fallan las pruebas.
- **Despliegues:** ESTRICTAMENTE prohibido despliegues manuales; TODO debe ser vía CI/CD. No hacer commits directos a `main` o `develop`, usar Pull Requests obligatoriamente.
- **Kubernetes:** Obligatorio usar **Ingress** (no exponer servicios directos con LoadBalancer). Configurar Limits/Requests de CPU/Memoria, ConfigMaps y Secrets.
- **Resiliencia:** Backup automatizado de las DBs (excepto Redis). Despliegues con RollingUpdate (maxSurge, maxUnavailable) y Rollback automatizado en Kubernetes.
- **Documentación:** Lo no documentado no será calificado. Subir diagramas y archivos fuente (UML/Mockups).
- **Restricciones:** No usar Supabase/Prisma. Los sistemas Cloud solo se pueden dar de baja DESPUÉS de la calificación.

---

## **✅ Completado / Ya asignado**

| Tarea | Responsable | Notas |
| ----- | ----- | ----- |
| Panel de Administración y Catálogo Dinámico (CRUD) | Moisés | Completo |
| 3\. Auditoria interna Transaccional por triggers | JuanJose | Todas las tablas existentes |
| Fase de integración y Testing (CI) | Fernando | Comienza con las pruebas, excluyendo el módulo de administrador |
| 4\. Generación de reportes estructurados | — | Depende de la terminación del 3 |
| 12. Dockerfiles por cada microservicio, BD, caché y API Gateway | Equipo | ✅ Completo |
| 12. Docker Compose — entorno local y entorno nube | Equipo | ✅ Completo |
| 12. Archivos de configuración CI/CD (workflows de GitHub Actions) | Equipo | ✅ Completado inicial |
| Archivos .env — información sensible en el gitignore | Equipo | ✅ Completo |

---

## **🔲 Por asignar**

### **📦 Alcance del sistema**

| Tarea | Responsable | Notas |
| ----- | ----- | ----- |
| 2\. Integración con Google Cloud Storage (GCS) — Persistencia de archivos de video e imágenes en Buckets | — | — |
| 2\. Integración con Google Cloud Storage (GCS) — Reproductor frontend consume URLs firmadas/públicas y muestra duración real del video | — | — |

---

---

### **☸️ Kubernetes & Infraestructura**

| Tarea | Responsable | Notas |
| ----- | ----- | ----- |
| 8\. Manifiestos YAML de Kubernetes — Deployments, Services, ConfigMaps y Secrets | Voupi | Sin credenciales explícitas |
| 9\. Estrategia Operativa de Despliegue Zero-Downtime — RollingUpdate (maxSurge, maxUnavailable) \+ Rollback Automatizado | Voupi | — |
| 10\. Monitoreo de Salud — Liveness Probe y Readiness Probe en todos los manifiestos | Voupi | — |

---

### **⚙️ CI/CD & Control de Versiones**

| Tarea | Responsable | Notas |
| ----- | ----- | ----- |
| Construcción y Versionamiento de Imágenes Docker (frontend \+ backend → registro privado) | — | Tags semánticos solo en rama release |
| Despliegue Continuo rama develop → Google Compute Engine | — | — |
| Despliegue Continuo rama release → Google Kubernetes Engine (GKE) | — | — |
| Estrategia de Resiliencia de Datos — Backup automatizado de todas las BDs (excepto Redis) | Equipo |  Implementado (Script + Pipeline programado) |
| 11\. Historial de Git — evidencia de ramas y Pull Requests aprobados \+ Tag V2.0.0 | — | — |

---

### **📄 Entregables de Documentación**

| Tarea | Responsable | Notas |
| ----- | ----- | ----- |
| 1\. Aplicación de Principios SOLID (los 5 principios: dónde, cómo y por qué se aplicó) | — | — |
| 2\. Toma y Justificación de Decisiones (lenguajes, frameworks, CI/CD, BD, nube, seguridad) | — | — |
| 3\. Actualización general de Diagramas (casos de uso del administrador \+ Modelo 4+1 Vistas de Kruchten) | — | — |
| 4\. Diagrama de flujo del pipeline CI/CD y justificación del diseño | — | — |
| 4\. Diagrama Entidad-Relación (ER) — incluir stored procedures, vistas, funciones y triggers | — | — |
| 5\. Diagrama de Arquitectura de alto nivel / Diagrama de Bloques general | — | — |
| 6\. Diseño UI/UX y Guía Visual — Mockups/wireframes de todas las vistas | — | — |
| 7\. Arquitectura del Clúster — distribución física/lógica, nodos, namespaces, recursos por Pod | — | — |

