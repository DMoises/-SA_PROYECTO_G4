Software Avanzado
Proyecto Fase 2 - Vacaciones de Junio 2026

---

Universidad San Carlos de Guatemala
Facultad de ingeniería.
Ingeniería en ciencias y sistemas

[Escudo de la Universidad San Carlos de Guatemala: Escudo circular con la leyenda "USAC" en el centro, rodeado por las palabras "ID ET LABOR" en la parte inferior. El escudo incluye elementos heráldicos como torres, un árbol de ceiba, un quetzal y la inscripción "CAROLINA ACADEMIA GUATEMALENSIS" alrededor del borde exterior.]

[Logo de la ECYS: Letras grandes "ECYS" a la izquierda con un diseño gráfico de graduando. A la derecha, texto vertical que indica: "ESCUELA DE / INGENIERÍA EN CIENCIAS Y SISTEMAS / FACULTAD DE INGENIERÍA / UNIVERSIDAD DE SAN CARLOS DE GUATEMALA". La franja con "FACULTAD DE INGENIERÍA" está resaltada en color azul.]

# Proyecto Fase 2:

# Quetxal TV

## **PONDERACIÓN: 20 pts**

---

# Índice

| Sección | Página |
|---|---|
| **Descripción del problema** | 3 |
| **Alcance del sistema** | 4 |
| 1. Panel de Administración y Catálogo Dinámico (CRUD) | 4 |
| 2. Integración con Google Cloud Storage (GCS) | 4 |
| 3. Auditoria interna Transaccional por triggers | 4 |
| 4. Generación de reportes estructurados | 4 |
| **Requisitos y restricciones** | 5 |
| ● Fase de integración y Testing (CI): | 5 |
| ● Estrategia de Resiliencia de Datos (Backup Automatizado): | 5 |
| ● Construcción y Versionamiento de Imágenes: | 5 |
| ● Despliegue Continuo Multi-Rama (CD): | 5 |
| ● Orquestación Nativa Cloud Kubernetes (Rama Release): | 5 |
| ● Aislamiento y Gestión Lógica (Namespaces y Recursos): | 6 |
| ● Abstracción y Seguridad de Variables de Entorno: | 6 |
| ● Estrategia de despliegue (RollOut): | 6 |
| ● Garantia de Resiliencia y Rollback Automático: | 6 |
| ● Monitoreo de Salud Obligatorio (Probes): | 6 |
| ● Gobierno de código: | 7 |
| ● Contenedores e infraestructura: | 7 |
| ● Seguridad de la información: | 7 |
| **Entregables Requeridos** | 7 |
| 1. Aplicación de Principios SOLID | 7 |
| 2. Toma y Justificación de Decisiones | 7 |
| 3. Actualización general de Diagramas | 7 |
| 4. Diagrama de flujo del pipeline CI/CD y justificación del diseño del pipeline | 8 |
| 5. Diagrama de Arquitectura de alto nivel / Diagrama de Bloques general | 8 |
| 6. Diseño UI/UX y Guía Visual: | 8 |
| 7. Arquitectura del Clúster: | 8 |
| 8. Manifiestos y Configuraciones de Objetos de Kubernetes | 8 |
| 9. Estrategia Operativa de Despliegue Zero-Downtime: | 9 |
| 10. Monitoreo de Salud de la Aplicación (Health Checks): | 9 |
| 11. Entregables de Integración y Pruebas: | 9 |
| 12. Archivos de configuración: | 9 |
| **Herramientas permitidas** | 10 |
| **Cronograma** | 11 |
| **Consideraciones** | 11 |

---

# Descripción del problema

Tras consolidar la arquitectura base políglota y los flujos esenciales para el cliente en la Fase 1, la plataforma entra en su etapa de maduración operativa y estabilidad técnica en entornos de producción. En un software comercial distribuido, es imperativo dotar al sistema de interfaces administrativas para controlar el catálogo, esquemas de trazabilidad fiables para auditoría contra fallas o fraudes , una estrategia de resiliencia ante pérdida de datos (backups) y una infraestructura automatizada libre de errores humanos.

Para lograrlo, se exige la evolución inmediata hacia un ecosistema de **Integración y Despliegue Continuo (CI/CD)** gobernado de forma estricta por políticas de ramificación. El pipeline automatizado detendrá el flujo ante cualquier fallo en las suites de pruebas unitarias o procesos adjuntos. Adicionalmente, el almacenamiento local se sustituirá por una solución distribuida en la nube para la carga y entrega asíncrona de archivos multimedia pesados (portadas y video en streaming en tiempo real).

.

---

# Alcance del sistema

La aplicación web debe resolver de extremo a extremo los siguientes módulos y capacidades de negocio:

## 1. Panel de Administración y Catálogo Dinámico (CRUD)

- Interfaz web protegida para que los usuarios con rol de administrador puedan **Agregar nuevo contenido**, **Actualizar/Editar** metadatos existentes y **Eliminar** títulos (aplicable tanto a Películas como a Series).
- Módulo especializado para **Programar y Calendarizar Estrenos** definiendo la fecha exacta en la que un contenido pasará a estar visible en la cartelera de los usuarios.

## 2. Integración con Google Cloud Storage (GCS)

- Toda la persistencia de archivos estáticos pesados (archivos de video de películas/capítulos y las imágenes de las portadas) debe desacoplarse del sistema de archivos local y ser almacenada en **Buckets de Google Cloud Storage**.
- Al reproducir un contenido multimedia, el reproductor del frontend debe consumir el recurso directamente desde las URLs firmadas/públicas de GCS y calcular y **mostrar el tiempo de duración real del archivo de video**.

## 3. Auditoria interna Transaccional por triggers

- Obligatoriedad de implementar **Triggers (Disparadores)** en los motores de base de datos de los microservicios relacionales. Cualquier actualización (*UPDATE*) o inserción (*INSERT*) hecha por un usuario o administrador debe registrar de forma automática: usuario responsable, timestamp exacto, tabla afectada, estado anterior y estado nuevo en una tabla exclusiva de auditoría.

## 4. Generación de reportes estructurados

- Desde el Panel de Administración se debe permitir visualizar el log transaccional de la tabla de auditoría y proveer opciones de descarga directa de reportes bien ordenados y formateados en extensiones **.csv** y **PDF**.

---

# Requisitos y restricciones

El Pipeline de CI/CD debe configurarse bajo la premisa de **cortocircuito crítico**: **si ocurre un fallo en las pruebas, la compilación o los scripts, el pipeline detendrá su ejecución de inmediato** impidiendo que el código progrese a etapas de empaquetado o despliegue.

## ● **Fase de integración y Testing (CI):**

Compilación y ejecución automática de pruebas unitarias dirigidas al backend políglota. Es obligatorio certificar un **umbral mínimo del 75% de cobertura (Code Coverage)** sobre el total de endpoints del backend.

## ● **Estrategia de Resiliencia de Datos (Backup Automatizado):**

El pipeline de automatización ejecutará y disparará de manera programada un **Backup completo** de todas las bases de datos operacionales utilizadas por los microservicios (quedando excluido únicamente el caché en memoria de Redis).

## ● **Construcción y Versionamiento de Imágenes:**

- El pipeline empaquetará las imágenes Docker de frontend y backend, enviándolas a un registro privado de imágenes en la nube.
- *Restricción de Etiquetado:* El push y versionamiento con tags de producción semánticos (**v2.1.0, v2.2.0, v2.x.0**) **SOLO debe ocurrir de manera automatizada cuando se impacte la rama de *release***.

## ● **Despliegue Continuo Multi-Rama (CD):**

- **Rama *develop* -> Google Compute Engine:** Cada merge exitoso en *develop* compilará las imágenes y desplegará la arquitectura de forma automática en **Máquinas Virtuales de Compute Engine** (el equipo define la cantidad de VMs necesarias para balancear la topología).
- **Rama *release* -> Kubernetes (GKE):** Cada push/merge verificado en la rama *release* generará los Tags de versión y automatizará el despliegue de los pods en un clúster de **Google Kubernetes Engine (GKE)**, aplicando obligatoriamente estrategias de **Rollout** (actualizaciones progresivas sin pérdida de servicio) y **Rollback** (retorno inmediato al estado anterior estable en caso de fallos).
- EL DESPLIEGUE ÚNICAMENTE PUEDE SER MEDIANTE CI/CD

## ● **Orquestación Nativa Cloud Kubernetes (Rama Release):**

El entorno de producción/staging correspondiente a la rama de `release` se desplegará de manera obligatoria y automatizada en un clúster de **Google Kubernetes Engine (GKE)**. Queda estrictamente prohibido realizar despliegues manuales mediante CLI; todo cambio estructural en el clúster debe ser orquestado exclusivamente a través de los manifiestos declarativos YAML gestionados por el pipeline de CD.

## ● **Punto de Acceso Externo mediante Ingress:**

Ningún servicio del clúster puede exponerse directamente mediante IPs públicas individuales o tipos de servicio (`LoadBalancer o NodePort`) por componente. **Es obligatorio configurar un recurso Ingress** (asociado a un Ingress Controller) como la única puerta de enlace externa. El Ingress interceptará el tráfico web proveniente de internet, gestionará las reglas de enrutamiento basadas en rutas/hosts y redirigirá las peticiones de manera segura hacia el microservicio del API Gateway.

## ● **Aislamiento y Gestión Lógica (Namespaces y Recursos):**

- Toda la topología de la fase debe estar aislada dentro de un **Namespace** específico (ej. **`quetxal-tv-prod`**).
- Cada Pod de microservicio backend (Go, TypeScript, Python) y del API Gateway debe definir de forma estricta sus **Requests y Limits de CPU y Memoria** en el manifiesto YAML para evitar la degradación del clúster ante picos de alta demanda.

## ● **Abstracción y Seguridad de Variables de Entorno:**

- Queda estrictamente prohibido escribir contraseñas, strings de conexión, URLs o llaves privadas directamente en los archivos YAML (Hardcoding).
- Los datos de configuración genérica deben inyectarse mediante **ConfigMaps**.
- La información altamente sensible (credenciales de las BDs operacionales, llaves de firma de JWT o claves de acceso a los Buckets de Google Cloud Storage) debe ser gestionada a través de **Secrets** cifrados en Kubernetes.

## ● **Estrategia de despliegue (RollOut):**

- Esto garantizará que, al liberar una nueva versión del release, los Pods de la versión anterior vayan sustituyéndose gradualmente por los nuevos sin interrumpir la disponibilidad de la cartelera ni cortar las transmisiones de video en reproducción activa de los usuarios de la plataforma

## ● **Garantia de Resiliencia y Rollback Automático:**

- El pipeline de CD debe estar configurado para escuchar el estado del despliegue en Kubernetes.
- Si los nuevos Pods fallan en su inicialización o entran en estado de error cíclico (como *CrashLoopBackOff*), el flujo de automatización debe gatillar un Rollback inmediato y automático deshaciendo los cambios (`kubectl rollout undo`) para restaurar la última versión del release que era 100% estable.

## ● **Monitoreo de Salud Obligatorio (Probes):**

Cada contenedor que corra dentro del clúster de Kubernetes debe implementar de forma nativa en su manifiesto de despliegue dos sondas de salud diferenciadas:

- **Readiness Probe (Sonda de Disponibilidad):** Controlará el momento exacto en el que el microservicio ha terminado de cargar sus conexiones internas (gRPC, Redis, Base de Datos) y está listo para empezar a recibir peticiones de la red por parte del API Gateway.
- **Liveness Probe (Sonda de Vitalidad):** Evaluará constantemente que el proceso interno del microservicio no se haya congelado o muerto. En caso de dar un código de error persistente, Kubernetes destruirá el Pod y aprovisionará una nueva instancia de forma automática.

## ● **Gobierno de código:**

Los commits directos a las ramas main o develop quedan estrictamente prohibidos. Todo cambio en el código o documentación debe ser integrado obligatoriamente mediante el uso de Pull Request (PR), los cuales requerirán revisión y aprobación del equipo para simular un flujo de trabajo profesional.

## ● **Contenedores e infraestructura:**

- Cada microservicio, base de datos, caché y el API Gateway debe poseer su propio archivo Dockerfile para la creación de imágenes y contenedores.

## ● **Seguridad de la información**:

Se deben de usar de forma obligatoria archivos .env para información sensible (URLS, contraseñas, IPs, etc), este tipo de información no debe ser subida al repositorio.

---

# Entregables Requeridos

## 1. Aplicación de Principios SOLID

Por cada uno de los 5 principios, el grupo deberá detallar formalmente:

- **Dónde se aplicó:** Ruta exacta del archivo, clases, componentes o interfaces. (Incluir capturas).
- **Cómo se aplicó:** Explicación técnica del patrón o estructura utilizada.
- **Por qué se aplicó:** Justificación de la mejora en mantenibilidad, acoplamiento o cohesión

## 2. Toma y Justificación de Decisiones

Se deben de responder las preguntas de **¿Qué?, ¿por qué? y ¿para qué?** para:

- Lenguajes de programación utilizados
- Frameworks utilizados en el desarrollo
- Mapeo de Aplicaciones de lenguajes y frameworks por cada microservicio
- Herramienta de automatización seleccionada para el pipeline CI/CD
- Ecosistema de base de datos
- Servicios de nubes utilizados
- Mecanismos de seguridad para autenticación y autorización

## 3. Actualización general de Diagramas

- Adaptación completa de requerimientos ampliados, diagramas de casos de uso del administrador (con narrativas expandidas y flujos de excepción técnicos) y actualización del Modelo de 4+1 Vistas de Kruchten para acoplar la infraestructura actual.

## 4. Diagrama de flujo del pipeline CI/CD y justificación del diseño del pipeline

- Esquema secuencial detallado que muestre las transiciones de compilación, ejecución de la suite de pruebas unitarias, validación del umbral del 75%, ejecución automática de copias de seguridad de las BDs, condicionales de control que interrumpen el flujo si hay errores, y bifurcación lógica de etiquetado semántico y despliegue según la rama impactada (develop -> VMs vs release -> Kubernetes).
- Justificación escrita del diseño del pipeline CI/CD (Pipelines, jobs)
- Diagrama Entidad-Relación (ER): Diseño de la base de datos. Debe incluir la especificación de qué componentes usarán procedimientos almacenados, vistas, funciones y triggers.

## 5. Diagrama de Arquitectura de alto nivel / Diagrama de Bloques general

- Esquema macro de la topología del sistema que ensamble de forma unificada el frontend, el API Gateway, la capa de Redis, los microservicios distribuidos, las bases de datos con sus triggers y tablas de auditoría, la conexión con Google Cloud Storage y las interacciones físicas del pipeline de CI/CD operando sobre la infraestructura en la nube de GCP.

## 6. Diseño UI/UX y Guía Visual:

Como parte fundamental de la documentación técnica, los estudiantes deberán diseñar e incluir los **Mockups (bocetos de interfaz/wireframes)** de todas las vistas. Estos diagramas visuales actuarán como el plano de arquitectura del cliente, definiendo la distribución de elementos, experiencia de usuario y navegación antes del desarrollo del frontend.

## 7. Arquitectura del Clúster:

- Explicación detallada de la distribución física/lógica del clúster (Cantidad de nodos, namespaces utilizados para aislar entornos, y asignación de recursos de CPU/Memoria por Pod).
- Mapeo descriptivo de qué microservicios (Go, TypeScript, Python) se ejecutan dentro de qué Pods y cómo interactúan con las herramientas perimetrales (Ingress Controller / API Gateway).

## 8. Manifiestos y Configuraciones de Objetos de Kubernetes

- Justificación teórica y práctica del uso de los siguientes componentes, adjuntando la estructura base de los manifiestos YAML (sin credenciales explícitas):
  - **Deployments:** Estrategia de réplicas para alta disponibilidad de la malla.
  - **Services (ClusterIP vs. NodePort vs. LoadBalancer):** Mecanismos de descubrimiento de servicios internos para gRPC y HTTP.
  - **ConfigMaps y Secrets:** Gestión inyectada de variables de entorno y strings de conexión cifrados a bases de datos relacionales y Cloud Storage.

## 9. Estrategia Operativa de Despliegue Zero-Downtime:

- **Rollout ( Estandar y Estrategia RollingUpdate):** Documentación matemática y conceptual de los parámetros `maxSurge` (cuántos pods adicionales se pueden crear durante la actualización) y `maxUnavailable` (cuántos pods pueden estar caídos simultáneamente) para garantizar que los usuarios sigan viendo contenido multimedia sin interrupciones durante el despliegue.
- **Rollback Automatizado:** Flujo de contingencia detallado que describa cómo el pipeline de CD detecta una falla en el arranque de la nueva versión (ej. crash loops) y ejecuta de forma automática el comando de reversión (`kubectl rollout undo`) hacia la última versión estable.

## 10. Monitoreo de Salud de la Aplicación (Health Checks):

- Configuración explícita en los manifiestos de las sondas de Kubernetes:
  - **Liveness Probe:** Monitoreo para determinar cuándo un microservicio debe ser reiniciado por el orquestador.
  - **Readiness Probe:** Monitoreo para validar cuándo un microservicio está listo para recibir tráfico de red real de los usuarios.

## 11. Entregables de Integración y Pruebas:

- Historial de Git e Integración (Pull Requests): Evidencia en el repositorio del uso correcto de ramas y los Pull Request aprobados para la consolidación del proyecto.
- Creación del Tag con la Versión V2.0.0.

## 12. Archivos de configuración:

- Se deben agregar de forma obligatoria los archivos Dockerfile por servicio y los dos archivos Docker Compose utilizados para desplegar en el entorno local y en la nube.
- Manifiestos y Configuraciones de Objetos de Kubernetes
- Archivos de configuración para pipeline CI/CD y scripts (Si es que se utilizaron).

---

# Herramientas permitidas

| **Tipo** | **Categoría** | **Descripción** |
|---|---|---|
| **Obligatorio** | Lenguajes | Go, TypeScript, Python |
| **Opcional** | Framework | FastAPI, Flask, Python, Express, NestJS, Gin |
| **Obligatorio** | Comunicación | gRPC |
| **Obligatorio** | Contratos | Protocol Buffers |
| **Opcional** | Seguridad y Sesiones | JWT, Session Cookies, OAuth |
| **Obligatorio** | Almacenamiento Caché | Redis |
| **Opcional** | Base de datos | MSSQL, MySQL, PostgreSQL, MongoDB |
| **Obligatorio** | Contenedores | Docker |
| **Obligatorio** | Orquestación | Docker-Compose, Kubernetes |
| **Obligatorio** | Control de Versiones | Github |
| **Obligatorio** | Automatización CI/CD | GithubActions |
| **Obligatorio** | Nube | Google Cloud Platform |
| **Obligatorio** | Almacenamiento de objetos | Google Cloud Storage (GCS) |
| **Obligatorio** | Despliegue | Google Compute Engine, Google Kubernetes Engine |
| **Opcional** | Documentación, Diseño, Modelado | Excalidraw, Figma, Canva, LucidChart, Draw.io, StarUML, Visual Paradigm, FossFlow |

---

# Cronograma

| **Tipo** | **Fecha Inicio** | **Fecha Fin** |
|---|---|---|
| **Asignación de Proyecto** | 11/06/2026 | 18/06/2026 |
| **Elaboración** | 11/06/2026 | 18/06/2026 |
| **Calificación** | 18/06/2026 | 19/06/2026 |

---

# Consideraciones

- **Fecha límite de entrega:** 18 de Junio a las 09:00 AM
- **Nombre del repositorio:** SA_PROYECTO_GX
- **Colaborador:** *Samashoas*
- **Medio de entrega:** UEDI
- **Documento Técnico:** Formato MarkDown que incluya tabla de integrantes, índice, introducción, desarrollo de todos los diagramas y conclusiones.

- No se permite el uso de herramientas como supabase o prisma para la gestión de la base de datos
- No se calificará ninguna funcionalidad en el entorno local, solo se calificarán funcionalidades en el entorno de la nube.
- Se deben cargar los archivos crudos de la documentación al repositorio, de lo contrario el diagrama no será válido.
- Se calificará en base a la documentación, si algún elemento no se encuentra documentado no será tomado en cuenta para la calificación.
- No se permite realizar despliegues, configuraciones, cargas de datos y accionamiento del CI/CD POR NINGÚN MOTIVO.
- Los sistemas como GKE y Compute Engine ÚNICAMENTE SE PUEDEN DAR DE BAJA MOMENTÁNEA SOLAMENTE DESPUÉS DE LA CALIFICACIÓN.