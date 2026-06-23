UNIVERSIDAD DE SAN CARLOS DE GUATEMALA  
FACULTAD DE INGENIERIA  
ESCUELA DE CIENCIAS Y SISTEMAS  
Software Avanzado P  
Marco Tulio Aldana Prillwitz Juan Pablo Samayoa Ruiz

[Descripción precisa de lo que contiene la imagen: escudo circular de la Universidad de San Carlos de Guatemala, con borde negro y texto alrededor; en el centro se observan montañas verdes, cielo azul, una figura humana y elementos simbólicos dorados. Debajo del escudo aparece una sombra gris ovalada.]

# Hoja de Calificación Proyecto #2

Fecha Calificación: ____/____/_____

Nombre: ________________________ Carne: ________________  
Nombre: ________________________ Carne: ________________  
Nombre: ________________________ Carne: ________________  
Nombre: ________________________ Carne: ________________  
Nombre: ________________________ Carne: ________________

| Descripción de Ponderación | Valor | Descripción | Punteo |
|---|---:|---|---|
| **Documentación** | **55** |  |  |
| Actualización de vistas 4+1 | 10 | Consistencia formal en el documento técnico. Listado de requerimientos RF/RNF ampliados. Diagramas de casos de uso del administrador con narrativas expandidas que incluyan flujos de excepción técnicos. Modelo 4+1 vistas de Kruchten completamente actualizado reflejando la nueva infraestructura distribuida |  |
| Diagrama de Bloques y flujo del pipeline | 10 | **Diagrama de Bloques General:**<br>Ilustración integrada y unificada de la arquitectura políglota, las BDs con auditoría, el API Gateway, Cloud Storage, el componente **Ingress** perimetral y las dependencias de red de la nube.<br><br>**Diagrama de Flujo del Pipeline:**<br>Esquema detallado de las etapas del CI/CD, condicionales de error absoluto y la bifurcación lógica por ramas de Git. |  |
| Justificación de Decisiones técnicas | 10 | Completitud técnica y rigurosidad al responder de forma exhaustiva a la (Qué, Por qué y Para qué) aplicada obligatoriamente a: Lenguajes, Frameworks, distribución en microservicios, Motor de CI/CD, Sistemas de BD, Servicios de GCP y Seguridad de Sesión. |  |
| Documentación y Aplicación SOLID | 10 | Justificación analítica e individual para cada uno de los 5 principios SOLID aplicados en el código backend de la aplicación políglota. Se debe detallar con precisión el Dónde (rutas de código/clases), el Por qué (problema de diseño inicial) y el Para qué (beneficio obtenido en desacoplamiento o testing). |  |
| Documentación del Entorno de Kubernetes | 15 | xplicación técnica clara de la arquitectura lógica del clúster en GKE, desglose conceptual y justificación del uso de un **Ingress** como puerta de acceso, uso de los objetos declarativos (Deployments, Services, ConfigMaps, Secrets), diseño detallado del comportamiento de la estrategia de Rollout y la configuración técnica de las sondas de salud (Liveness y Readiness Probes). |  |
| **Implementación y funcionalidades** | **25** |  |  |
| Panel Administrativo, Catálogo y CRUDs | 10 | Interfaz web del administrador 100% interactiva y funcional, con control de acceso restrictivo por rol basado en JWT/Cookies. Validación en vivo de las operaciones CRUD (creación, edición/actualización de metadatos y eliminación) sobre Películas y Series, y funcionamiento exitoso del programador y calendarizador de estrenos en cartelera. |  |
| Auditoría por triggers, Reportes y GCS |  | **Triggers:** Verificación directa en base de datos de que los disparadores operan en tiempo real, guardando los logs transaccionales en la tabla de auditoría ante cualquier cambio.<br><br>Descarga funcional de reportes de auditoría perfectamente estructurados en formatos .csv y **PDF**.<br><br>**Cloud Storage:** Los contenidos multimedia y portadas se sirven de Buckets de GCS; el reproductor web calcula y visualiza la duración de tiempo real del video consumido. |  |
| **Infraestructura, DevOps y Despliegue** | **20** |  |  |
| Pipeline CI/CD, Testing (75%) y Backups | 10 | El pipeline ejecuta de forma automática las suites de pruebas unitarias validando un mínimo estricto del 75% de cobertura de endpoints. Verificación en vivo de que el pipeline interrumpe y aborta la ejecución inmediatamente ante cualquier error. Automatización de la tarea de Backup completo de las BDs operacionales. Empuje automático al Registry con el Tag de Release correspondiente únicamente al procesar la rama de release. |  |
| Despliegue Multi-Rama y Rollout | 10 | Validación en servidores remotos de GCP: el push a la rama develop propaga los microservicios políglotas de forma automática a **Máquinas Virtuales de Compute Engine**. El push a la rama release despliega la topología en un clúster de **Kubernetes (GKE)**. **Demostración técnica en vivo del acceso al sistema a través de las reglas configuradas en el Ingress** y comportamiento de la estrategia de Rollout sin desconectar el servicio. |  |
| **Penalizaciones** |  |  |  |
| Commits fuera de fecha | -100% |  |  |
| No se cargó el archivo crudo al repositorio | -100% | La penalización se aplica al diagrama que no tenga su archivo crudo cargado, no es sobre la nota general obtenida en la practica |  |
| No se entregó en UEDI | -100% |  |  |
| No se agregó al auxiliar al repositorio | -100% |  |  |
| El sistema no se encuentra desplegado | -100% |  |  |
| Despliegues y configuraciones realizados despues de la fecha y hora permitida | -100% |  |  |
| Commits realizados despues de la fecha sin autorización del auxiliar | -100% |  |  |
| No se utiliza Docker y Docker-Compose para el entorno de VM | -80% |  |  |
| Uso de nodeport o loadbalancer para exponer servicios desplegados en kubernetes | -80% |  |  |
| No hay ingress para el entorno de kubernetes | -80% |  |  |
| No se completaron las funcionalidades de la fase 1 | -70% | Aplica solo si faltaron funcionalidades (Ej. Sistema de notificaciones) |  |
| Accionamiento del CI/CD despues de la fecha establecida sin autorización del auxiliar | -60% |  |  |
| No hay despliegue por medio de CI/CD en vm ni en kubernetes | -60% |  |  |
| Uso de herramientas no autorizadas por el auxiliar | -60% |  |  |
| Las imágenes no son versionadas de manera dinámica según la versión en la que están siendo creadas. | -50% | No se le agrega la versión de la rama release a las imágenes de docker al momento de ser creadas.<br>(Ej: si el release es release/v2.1.0 entonces la imagen tiene que ser docker_image:2.1.0) |  |
| No sigue el modelo de diseño de una arquitectura de microservicios | -50% |  |  |
| La documentación no coincide con el trabajo realizado | -50% | Aplica a cualquier elemento de la documentación |  |
| No se trabajó con Pull Request | -20% |  |  |
| No hay livenessProbe ni readinessProbe | -20% |  |  |
| No se utilizan confimaps o secrets | -20% |  |  |
| No existe el diagrama solicitado o justificación documentada requerida | -20% | Aplica por cada diagrama o documento faltante |  |
| El estudiante no conoce sobre la solución planteada | -20% | Aplica a todo el grupo |  |
| **Nomenclatura incorrecta de los diagramas** | -20% | Aplica a cada diagrama |  |
| **Funcionalidades, diagramas o requisitos incompletos.** | -20% | Aplica a la fase 2 únicamente. |  |
| Diagrama de Despliegue no coincide con el mapeo real del sistema. | -20% | El Diagrama de despliegue no refleja el mapeo de los contenedores físicos de los contenedores docker, asignación de puertos, volumens (Si utiliza), y la red virtual Docker Compose |  |
| No se incluyen capturas en la documentación de Principios SOLID | -10% |  |  |
| El grupo no se presentó en el horario en el que se encuentra apuntado | -30pts |  |  |
| El despliegue del CI/CD falló durante la calificación | -20pts |  |  |

**Nota:**

• Las copias totales o parciales tendrán una nota final de 0 puntos y serán reportados a escuela.  
• No se permiten commits fuera de la fecha de entrega establecida.  
• El estudiante tiene que ser capaz de responder a las preguntas en el momento, no se tendrá tiempo de tolerancia para evitar que se consulte información externa.  
• Se brindarán 80 minutos exactos para la calificación n, la calificación se terminará en el momento en el que terminen de transcurrir estos 80 minutos, la nota obtenida durante ese tiempo será la nota final, sólo se brindará tiempo adicional si el auxiliar determina que es necesario.  
• NO SE PERMITE SEGUIR REALIZANDO DESPLIEGUES DESPUES DE ENTREGA ESTABLECIDA  
• Las notas NO se brindarán al momento de terminar la calificación, se tendrá un transcurso de 2 días máximo para determinar que la nota obtenida sí corresponda a lo entregado.  
• SE DEBE MANTENER TODO EL SISTEMA DE LA NUBE ACTIVO TODO EL TIEMPO, UNICAMENTE SE PUEDEN BAJAR LOS SERVICIOS HASTA DEPUES DE LA CALIFICACION, SI USTEDES DECIDE BAJAR LOS SERVICIOS LO HACE SE TOMARA EN CUENTA COMO QUE SE DESPLEGO DESPUES DE LA FECHA  
• Se recomienda grabar un video de prueba de que todo se encuentra desplegado y en orden antes de la calificación en caso de que el sistema falle (Se caiga una VM o el cluster de kubernetes, no aplica a funcionalidades incompletas), este video servirá como evidencia de que todos los despliegues se realizaron en fecha para no ser tomados en cuenta para la penalización, en caso no llegue a existir este video SE TOMARA EN CUENTA COMO QUE SE REALIZARON DESPLIEGUES DESPUES DE LA FECHA.

______________________________________    ____________________________________  
Firma del Alumno                           Firma del Auxiliar