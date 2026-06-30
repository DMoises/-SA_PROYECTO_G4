# **Organización de Tareas — Quetxal TV Fase 3**

## **⚠️ Notas Importantes (Según Enunciado Oficial)**

* **CI/CD y Pruebas:** OBLIGATORIO un mínimo de **75% de Code Coverage**. El pipeline debe hacer **cortocircuito** (detenerse de inmediato) si ocurre un fallo en pruebas, compilación o scripts.  
* **Infraestructura (Terraform & Ansible):** Creación/destrucción de infra (VPC, GKE, VMs, DBs) debe ser declarativa con **Terraform**. La preparación de entornos en VMs mediante **Ansible** (Playbooks).  
* **Bases de Datos Aisladas:** ESTRICTAMENTE prohibido desplegar los motores de base de datos relacionales dentro de los Pods de K8s. Deben residir en instancias dedicadas en GCE.  
* **Observabilidad en Nube:** Uso obligatorio de **ELK Stack** (Logs) y **Prometheus \+ Grafana** (Métricas).  
* **Documentación y Evidencia:** Lo no documentado no se califica. **Obligatorio incluir capturas de pantalla** en los manuales de Terraform, Ansible, ELK, Grafana y Locust.  
* **Restricciones:** No usar Supabase/Prisma. Los sistemas Cloud solo se pueden dar de baja DESPUÉS de la calificación. Solo despliegue mediante CI/CD, NO manual.  
* **Entregables de Repositorio:** Archivos crudos de documentación subidos al repo (no el diagrama no será válido si no están). Agregar colaborador **Samashoas** al repositorio. Tag de versión **V2.0.0** obligatorio.  
* **Variables de entorno:** Uso de archivos **.env** para información sensible. No subir al repositorio. *(Nota: Es una buena práctica implementada en la T10, no una exigencia directa del enunciado de Fase 3).*  
* **Entrega:** Medio de entrega **UEDI**. Fecha límite **29 de Junio a las 09:00 AM**.  
* **Descarga de contenido:** Según el enunciado oficial, la descarga es **únicamente para Plan Estándar** (bloqueada para Plan Básico **y** Plan Premium).

---

## **🔗 Dependencia de Tareas (Roadmap de Ejecución)**

Para garantizar que el proyecto avance sin bloqueos, las tareas deben abordarse considerando el siguiente orden lógico de dependencias:

1. **Fase 1: Infraestructura Base (Terraform, Ansible & DBs)**  
   * *Razón:* Es el cimiento del proyecto. No se puede hacer CI/CD a la nube ni probar la persistencia aislada sin tener los clusters de GKE y las VMs dedicadas levantadas por Terraform y configuradas por Ansible.  
2. **Fase 2: Interceptores gRPC (Roles y Planes)**  
   * *Razón:* El Control Parental, Watch Party y las Descargas de contenido dependen de saber qué tipo de plan y rol tiene el usuario. Esto DEBE implementarse en el backend primero.  
3. **Fase 3: Desarrollo Core Full Stack (En paralelo en local)**  
   * Una vez listos los interceptores gRPC, se puede trabajar simultáneamente en: Control Parental, Watch Party, Motor de Recomendación y Descargas.  
4. **Fase 4: Monitoreo, Pruebas y CI/CD**  
   * *Razón:* Requiere que los microservicios y la infraestructura ya existan. Aquí entran los tests de carga con Locust, la observabilidad con ELK/Grafana y garantizar el pipeline con cortocircuito y Smoke Tests.  
5. **Fase 5: Documentación y Defensa**  
   * *Razón:* Se necesitan las evidencias (capturas) de Terraform, Ansible, Locust, ELK y Grafana funcionando en producción.

---

## **🔲 Por asignar**

### **📦 Alcance del sistema (Desarrollo Full Stack)**

**Nota sobre componentes heredados:** Herramientas como **Redis** y **Google Cloud Storage (GCS)**, aunque son obligatorias en la matriz de herramientas, ya fueron implementadas en las Fases 1 y 2 (ej. GCS vía Workload Identity). Su integración se mantiene, pero no requieren una nueva tarea de desarrollo desde cero.

| Tarea | Descripción | Responsable | Estado |
| ----- | ----- | ----- | ----- |
| 1\. Interceptores gRPC y Seguridad Base | **Backend:** Implementar interceptores gRPC para validar token JWT, roles, planes (Estándar/Premium) y **políticas de Control Parental**. Es **requisito** para los otros módulos. | Juanjo | ✅Terminado |
| 2\. Control Parental (Full Stack) | **Backend:** Restringir contenido según clasificación (Apta todo público, PG-13, R). **Frontend:** UI para configurar PIN de 4 dígitos y solicitarlo antes de reproducir contenido no apto. | Moisés | ✅Terminado |
| 3\. Motor Inteligente de Recomendación (Full Stack) | **Backend:** Implementar algoritmo Netflix (Filtrado Colaborativo usuarios/ítems o Recomendación Basada en Contenido/Géneros). **Frontend:** Sección dinámica "Recomendados para ti" según historial y calificaciones previas del perfil. | Fernando |  ✅Terminado |
| 4\. Watch Party (Full Stack) | **Backend:** Salas en tiempo real vía WebSockets. Solo usuarios **Premium** pueden iniciar/crear sala; cualquier usuario puede unirse con enlace/código. **Frontend:** Interfaz sincronizada y generación de enlace de invitación. | Juanjo | ✅Terminado |
| 5\. Descarga de Contenido (Full Stack) | **Backend:** Lógica para autorizar descargas **únicamente al Plan Premiun** (bloqueada para Plan Básico Y Plan Estándar). **Frontend:** Almacenamiento local simulado/real (cifrado o Service Workers). | Chan | ✅ Terminado |
| 6\. Cronjob de Depuración (Backend) | Creación de tarea programada (**Cronjob** en K8s) que audite la BD y elimine lógicamente cuentas inactivas o sin registros de inicio de sesión durante un periodo prefijado de X tiempo. | Joshua | ✅ Terminado |

---

### **☸️ Infraestructura, DevOps & Cloud (IaC)**

| Tarea | Descripción | Responsable | Estado |
| ----- | ----- | ----- | ----- |
| 7\. Infraestructura como Código (Terraform) | Creación declarativa de VPC, subredes, firewalls, GKE, VMs de desarrollo y bases de datos dedicadas en GCE. Destrucción y modificación también por Terraform. | Joshua | ✅Terminado |
| 8\. Configuración Automatizada (Ansible) | Playbooks para instalar dependencias y herramientas en las VMs de manera agentless vía conexiones SSH. | Joshua | ✅Terminado |
| 9\. Persistencia Aislada y Entrada Ingress | Migrar las DBs relacionales fuera de K8s hacia servidores externos (GCE). Garantizar el ruteo mediante recurso **Ingress** en GKE como único punto de entrada externo. | Joshua | ✅Terminado |
| 10\. Seguridad de Variables de Entorno | Configurar archivos **.env** para toda información sensible (URLs, contraseñas, IPs, credenciales). Verificar que **no se suban al repositorio** (.gitignore). Usar ConfigMaps/Secrets en K8s. | Todo el TEAM | 🔴 Pendiente |

---

### **🔍 Observabilidad y Monitoreo (Nube)**

| Tarea | Descripción | Responsable | Estado |
| ----- | ----- | ----- | ----- |
| 11\. Stack ELK (Logs Centralizados) | Configurar Elasticsearch, Logstash y Kibana para recolectar y centralizar logs de auditoría de contenedores y VMs externas. **Capturas obligatorias de Kibana** mostrando indexación de logs transaccionales y de auditoría. | Joshua | ✅Terminado |
| 12\. Stack Prometheus & Grafana (Métricas) | Recolección de métricas de hardware/red en tiempo real con Prometheus y visualización de telemetría en Grafana. **Capturas obligatorias de Dashboards de Grafana** con telemetría viva. | Gerson | 🟡En proceso  |

---

### **⚙️ Testing, Calidad y CI/CD**

| Tarea | Descripción | Responsable | Estado |
| ----- | ----- | ----- | ----- |
| 13\. Pruebas Backend y Cortocircuito | Validar ≥ 75% cobertura de endpoints. El pipeline CI/CD DEBE detenerse inmediatamente si falla alguna prueba, script o compilación. | Juanjo | ✅Terminado |
| 14\. Actualización Pipeline CD (Despliegue) | Configurar flujos en GitHub Actions para el **despliegue automático (CD)** hacia la VM de desarrollo (Docker Compose) y el cluster de producción Kubernetes (GKE). | Joshua | ✅Terminado |
| 15\. Smoke Tests (CI/CD) | Suite automática tras despliegue para certificar que las rutas base del API Gateway y conexiones críticas están vivas. | Chan | ✅Terminado |
| 16\. Pruebas de Carga Ligera (Locust) | Scripts en Python inyectando tráfico masivo en rutas críticas. Generar **archivo HTML final** con los resultados de las pruebas. **Capturas obligatorias de resultados de Locust.** | Moisés | 🟡Pruebas |

---

### **📄 Entregables de Documentación y Defensa**

| Tarea | Descripción | Responsable | Estado |
| ----- | ----- | ----- | ----- |
| 17\. Manual Terraform | Teoría del aprovisionamiento declarativo \+ guía paso a paso con **capturas obligatorias** de terminal y recursos en GCE/GKE levantados por IaC. | Joshua | ✅Terminado |
| 18\. Manual Ansible | Teoría de automatización agentless (SSH, Playbooks/Roles) \+ guía paso a paso con **capturas obligatorias** de logs de ejecución de playbooks en terminal. | Joshua | ✅Terminado |
| 19\. Manual Stack ELK | Arquitectura de recolección de logs (ES/Logstash/Kibana) \+ flujo de inyección de agentes. **Capturas obligatorias de Kibana** mostrando logs indexados. | Fernando | ✅Terminado |
| 20\. Manual Prometheus & Grafana | Modelo de monitoreo por scraping \+ guía de despliegue de exporters. **Capturas obligatorias de Dashboards de Grafana** con telemetría viva. | Gerson | ✅Terminado |
| 21\. Algoritmo de Recomendación | Diseño matemático/lógico del algoritmo de recomendación Netflix | Fernando | ✅Terminado |
| 21.1 Manual de Locust | Documentación de Locust con **capturas de resultados** de escenarios de estrés. | Moisés | 🟡 En proceso |
| 22.1 Actualización de Diagramas | Diagrama de Arquitectura Alto Nivel (con monitoreo) | Moisés | 🔴 Pendiente |
| 22.2 Actualización de Diagramas | Modelo 4+1 actualizado Incluye vista logica, vista escenario \+1 vista de procesos  | Fernando | ✅Terminado |
| 22.3 Actualización de Diagramas | Flujo CI/CD con testing | Juanjo | 🔴 Pendiente |
| 22.4 Actualización de Diagramas | Casos de Uso **del Administrador** (con narrativas expandidas y flujos de excepción técnicos) | Fernando | 🟡 En proceso |
| 22.5 Actualización de Diagramas | Documentar de justificación de herramientas. | Gerson | ✅Terminado |
| 22.6 Actualización de Diagramas | Actualización vista de desarrollo y vista de componentes | Gerson | 🟡 En proceso |
| 22.7 Actualización de Diagramas | Actualización vista física y diagramas de despliegue en vms y en kubernetes | Chan | 🔴 Pendiente |
| 23\. Archivos Finales de Configuración | Dockerfiles por servicio, Docker Compose (local y nube), Manifiestos K8s, Archivos de configuración pipeline CI/CD y scripts. **Cargar archivos crudos al repositorio.** | Joshua | ✅Terminado |
| 24\. Presentación Final (Demo 20 mins) | Preparación de slides con: Problema Inicial, Toma de Decisiones (justificación de matriz políglota, IaC, observabilidad, sesiones, BD externas) y Solución Final (demo del ecosistema). Participación **obligatoria de todos** los integrantes. | Pendiente | 🔴 Pendiente |

---

### **🗂️ Entregables Administrativos y de Repositorio**

| Tarea | Descripción | Responsable | Estado |
| ----- | ----- | ----- | ----- |
| 25\. Entrega en UEDI | Subir el enlace/documento requerido en la plataforma **UEDI** antes del **29 de Junio a las 09:00 AM**. | — | ✅Terminado |
| 26\. Agregar colaborador al repositorio | Agregar al usuario **Samashoas** como colaborador del repositorio **SA\_PROYECTO\_GX**. | — | ✅Terminado |
| 27\. Tag de versión V2.0.0 y PR History | Crear el Tag **V2.0.0** en el repositorio. Evidenciar historial limpio de ramas y Pull Requests aprobados. | — | 🔴 Pendiente |
| 28\. Subir archivos crudos de documentación | Todos los diagramas y documentos deben cargarse en formato crudo al repositorio (no solo imágenes exportadas). Sin esto, los diagramas **no serán válidos**. | — | 🔴 Pendiente |
| 29\. Documento Técnico en Markdown | Redactar el documento técnico en formato **.md** con: tabla de integrantes, índice, introducción, desarrollo de todos los diagramas y conclusiones. | — | 🔴 Pendiente |

# **🎤 Presentación Final — Quetxal TV Fase 3**

**Duración máxima estricta: 20 minutos | Participación obligatoria de todos**

---

## **Estructura sugerida por sección (3 pilares obligatorios)**

---

### **🔴 1\. El Problema Inicial (\~3 min)**

Diagnóstico del negocio, cuellos de botella en plataformas monolíticas y justificación del cambio.

| Quién | Qué expone |
| ----- | ----- |
| **Gerson** | Abre la presentación. Explica el problema de negocio, por qué una arquitectura monolítica no escala, y la necesidad de microservicios \+ IaC. Le queda natural ya que documentó la justificación de herramientas (T22.5). |

---

### **🟡 2\. Toma de Decisiones (\~7 min)**

Justificación técnica y analítica de las decisiones arquitectónicas adoptadas (qué, por qué, para qué).

| Quién | Qué expone |
| ----- | ----- |
| **Joshua** | Infraestructura como código: decisión de usar **Terraform y Ansible**, por qué se aislaron las BDs fuera de K8s, decisión del Ingress. Le corresponde porque implementó todo esto (T7, T8, T9, T17, T18). |
| **Fernando** | Decisión de la **matriz políglota** (Go/TS/Python), el modelo 4+1, y la elección del algoritmo de recomendación Netflix. Le cuadra porque trabajó en el motor de recomendación y la documentación arquitectónica (T3, T19, T22.2). |
| **Juanjo** | Decisión de la **seguridad**: interceptores gRPC, JWT, Watch Party, y el pipeline CI/CD con cortocircuito. Él implementó todo eso (T1, T4, T13, T22.3). |

---

### **🟢 3\. La Solución Final (\~8 min)**

Demostración del ecosistema operativo unificado — infraestructura elástica \+ backend inteligente resolviendo las necesidades del negocio. **No es un tour de funcionalidades**, sino evidencia de que el sistema corre bajo estándares de disponibilidad.

| Quién | Qué expone |
| ----- | ----- |
| **Joshua** | Muestra el **ecosistema desplegado en GCP**: clúster GKE activo, VMs con BDs externas, Ingress funcionando, y evidencia de que el pipeline CI/CD desplegó todo automáticamente. Es el más indicado por haber implementado toda la infra (T7, T8, T9, T14). |
| **Moisés** | Expone los **resultados de Locust** (gráficas de carga, rendimiento bajo concurrencia) y el **diagrama de arquitectura alto nivel** como cierre visual de cómo todo se conecta. (T16, T22.1) |
| **Chan** | Presenta la **vista física y de despliegue**: cómo el sistema está mapeado en VMs y Kubernetes, y explica la documentación de la vista de despliegue. (T22.7) |
| **Gerson** | Muestra los **dashboards de Grafana** con telemetría viva y los **logs indexados en Kibana**, evidenciando observabilidad real del sistema en producción. (T12, T20, T22.6) |

---

## **⏱️ Distribución de tiempo sugerida**

| Sección | Responsable(s) | Tiempo |
| ----- | ----- | ----- |
| Problema Inicial | Gerson | \~3 min |
| Toma de Decisiones: Infra & IaC | Joshua | \~2.5 min |
| Toma de Decisiones: Arquitectura & Algoritmo | Fernando | \~2.5 min |
| Toma de Decisiones: Seguridad & CI/CD | Juanjo | \~2 min |
| Solución Final: Ecosistema en GCP \+ CI/CD | Joshua | \~3 min |
| Solución Final: Resultados Locust \+ Arquitectura | Moisés | \~2 min |
| Solución Final: Vista física y despliegue | Chan | \~2 min |
| Solución Final: Grafana \+ ELK en producción | Gerson | \~2 min |
| **TOTAL** |  | **\~20 min** |

---

## **📝 Notas para el día de la defensa**

* Grabar un **video de evidencia** antes de la calificación mostrando todo desplegado y funcionando (recomendación del enunciado, protege ante caídas de VMs).  
* Cada integrante debe conocer **los comandos clave** de su área (penalización de \-10% si no los conoce).  
* Tener listo el acceso a la **consola de GCP** para mostrar que las BDs están externas al clúster.  
* El **diagrama de arquitectura alto nivel** (T22.1) debería estar en la presentación como slide de apoyo visual durante la sección de Solución Final.