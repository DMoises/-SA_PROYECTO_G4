*UNIVERSIDAD DE SAN CARLOS DE GUATEMALA*
*FACULTAD DE INGENIERIA*
*ESCUELA DE CIENCIAS Y SISTEMAS*
*Software Avanzado P*
*Marco Tulio Aldana Prillwitz   Juan Pablo Samayoa Ruiz*

[Escudo de la Universidad San Carlos de Guatemala: Escudo circular con elementos heráldicos que incluye torres, un árbol de ceiba, un quetzal y la inscripción "CAROLINA ACADEMIA GUATEMALENSIS" alrededor del borde exterior.]

---

# *Hoja de Calificación Proyecto #3*

Fecha Calificación: ____/____/_____

| | |
|---|---|
| Nombre: ________________________ | Carne: ________________ |
| Nombre: ________________________ | Carne: ________________ |
| Nombre: ________________________ | Carne: ________________ |
| Nombre: ________________________ | Carne: ________________ |
| Nombre: ________________________ | Carne: ________________ |

---

| Descripción de Ponderación | Valor | Descripción | Punteo |
|---|---|---|---|
| **Documentación** | **55** | | |
| Actualización de vistas 4+1, justificaciones, SOLID y algoritmo | 10 | Documento formal acumulado. Casos de uso expandidos de las nuevas características de plan y algoritmo de recomendación tipo Netflix. Modelo 4+1 vistas de Kruchten y analítica de justificaciones (Qué, Por qué, Para qué) completas. | |
| Diagrama de Alto nivel y Pipeline | 10 | Diagrama de Bloques General: Ilustración integrada de la arquitectura con base de datos externa, conexiones WebSockets, Ingress y componentes ELK/Prometheus. Diagrama de Pipeline: Detalle secuencial de automatización e inyección de Locust. | |
| Manuales IaC (Terraform y Ansible) | 10 | **ección obligatoria con capturas:** Marco conceptual y guías paso a paso de configuración de infraestructura de red/cómputo mediante **Terraform** (con capturas de GCP) y playbooks de Ansible (con capturas del recap de ejecución exitoso en terminal). | |
| Manuales de Operaciones (ELK, Metrics y Locust) | 10 | **Sección obligatoria con capturas:** Guías de configuración teórica/práctica del Stack ELK (con capturas de indexación en Kibana), Prometheus/Grafana (con capturas de dashboards interactivos de telemetría) y Locust (con capturas explícitas de las gráficas y tablas de rendimiento de carga). | |
| **Implementación y funcionalidades** | **25** | | |
| Características Premium, Estándar y Filtros. | 10 | **Recomendación y Cronjob:** Cartelera personalizada y tarea programada de purga operativas. **Control Parental:** Bloqueo de contenido mediante PIN en todos los planes. **Watch Party:** El usuario Premium crea y sincroniza flujos multimedia en tiempo real. **Descarga:** Funcionalidad restringida únicamente para usuarios en el Plan Premium. Aislamiento y Persistencia de BD Externa | |
| | | Verificación directa en la consola Cloud de GCP que demuestra que las bases de datos transacionales y de auditoría se ejecutan de forma 100% externa al clúster de Kubernetes, manteniendo la conectividad interna gRPC intacta. | |
| **Infraestructura, DevOps y Observabilidad** | **20** | | |
| Ejecución de la Automatización IaC | 10 | Demostración de la creación/destrucción automatizada de la topología en GCP mediante scripts de Terraform y ejecución real de Playbooks de Ansible sobre los nodos del sistema. | |
| Suite de Pruebas, Observabilidad y Locust | 10 | Ejecución exitosa del pipeline de CI/CD validando el 75% de cobertura, cortocircuito ante errores y Smoke Tests. Centralización en vivo de logs en ELK y visualización de dashboards de hardware y red en Prometheus/Grafana mientras se ejecuta la prueba de estrés en vivo con Locust.. | |
| **Presentación y Defensa del proyecto** | **10** | | |
| Presentación Ejecutiva y Oratoria | | ontenido: Abordaje claro de los tres pilares (Problema Inicial, Toma de Decisiones y Solución Final). **Tiempos y Expresión:** Ajuste estricto al límite máximo de 20 minutos. Participación obligatoria de la totalidad de los miembros, demostrando una expresión correcta, clara y fluida. | |

---

## Penalizaciones

| Descripción | Penalización | Nota |
|---|---|---|
| Commits fuera de fecha | -100% | |
| No se cargó el archivo crudo al repositorio | -100% | La penalización se aplica al diagrama que no tenga su archivo crudo cargado, no es sobre la nota general obtenida en la practica |
| No se entregó en UEDI | -100% | |
| No se agregó al auxiliar al repositorio | -100% | |
| El sistema no se encuentra desplegado | -100% | |
| Despliegues y configuraciones realizados después de la fecha y hora permitida | -100% | |
| Commits realizados después de la fecha sin autorización del auxiliar | -100% | |
| No se utiliza Docker y DockerCompose para el entorno de VM | -80% | |
| Uso de nodeport ó loadbalancer para exponer servicios desplegados en kubernetes | -80% | |
| No hay ingress para el entorno de kubernetes | -80% | |
| No se completaron las funcionalidades de la fase 2 | -70% | |
| Accionamiento del CI/CD después de la fecha establecida sin autorización del auxiliar | -60% | |
| No hay despliegue por medio de CI/CD en vm ni en kubernetes | -60% | |
| Uso de herramientas no autorizadas por el auxiliar | -60% | |
| No sigue el modelo de diseño de una arquitectura de microservicios | -50% | |
| La documentación no coincide con el trabajo realizado | -50% | Aplica a cualquier elemento de la documentación |
| Se excede el tiempo de la presentación ó no logra consolidar la presentación en el tiempo establecido | -30% | |
| No se trabajó con Pull Request | -20% | |
| No hay livenessProbe ni readinessProbe | -20% | |
| No se utilizan configmaps ó secrets | -20% | |
| No existe el diagrama solicitado ó justificación documentada requerida | -20% | Aplica por cada diagrama ó documento faltante |
| El estudiante no conoce sobre la solución planteada | -20% | Aplica a todo el grupo |
| Nomenclatura incorrecta de los diagramas | -20% | Aplica a cada diagrama |
| Los diagramas NO SON LEGIBLES | -20% | |
| Funcionalidades, diagramas o requisitos incompletos. | -20% | Aplica a la fase 3 únicamente. |
| Diagrama de Despliegue no coincide con el mapeo real del sistema. | -20% | |
| La construcción de la infraestructura falló durante la calificación (terraform) | -20% | |
| La configuración del sistema falló durante la calificación (Ansible) | -20% | |
| La configuración de los entornos falló durante la calificación | -20% | |
| Uno de los integrantes de grupo no presentó | -20% | |
| El sistema no tiene forma de descargar el video | -20% | |
| El estudiante no conoce los comandos a utilizar | -10% | |
| No se incluyen capturas en la documentación que lo requiera | -10% | SOLID, Guías paso a paso |
| El estudiante no puede transmitir sus ideas de forma clara durante la presentación | -20% | Aplica solo al estudiante |
| El grupo no se presentó en el horario en el que se encuentra apuntado | -30pts | |
| El despliegue del CI/CD falló durante la calificación | -20pts | |

---

**Nota:**

- Las copias totales ó parciales tendrán una nota final de 0 puntos y serán reportados a escuela.
- No se permiten commits fuera de la fecha de entrega establecida.
- El estudiante tiene que ser capaz de responder a las preguntas en el momento, no se tendrá tiempo de tolerancia para evitar que se consulte información externa.
- Se brindarán 80 minutos exactos para la calificación n, la calificación se terminara en el momento en el que terminen de transcurrir estos 80 minutos, la nota obtenida durante ese tiempo sera la nota final, solo se brindará tiempo adicional si el auxiliar determina que es necesario.
- NO SE PERMITE SEGUIR REALIZANDO DESPLIEGUES DESPUES DE ENTREGA ESTABLECIDA
- NO SE PERMITE REALIZAR CONSTRUCCIONES O CONFIGURACIONES DESPUES DE LA FECHA Y HORA DE ENTREGA ESTABLECIDA
- Las notas NO se brindarán al momento de terminar la calificación, se tendrá un transcurso de 2 días máximo para determinar que la nota obtenida sí corresponda a lo entregado.
- SE DEBE MANTENER TODO EL SISTEMA DE LA NUBE ACTIVO TODO EL TIEMPO, ÚNICAMENTE SE PUEDEN BAJAR LOS SERVICIOS HASTA DESPUES DE LA CALIFICACIÓN, SI USTEDES DECIDE BAJAR LOS SERVICIOS LO HACE SE TOMARA EN CUENTA COMO QUE SE DESPLEGÓ DESPUÉS DE LA FECHA
- Se recomienda grabar un video de prueba de que todo se encuentra desplegado y en orden antes de la calificación en caso de que el sistema falle (Se caiga una VM ó el cluster de kubernetes, no aplica a funcionalidades incompletas), este video servirá como evidencia de que todos los despliegues se realizaron en fecha para no ser tomados en cuenta para la penalización, en caso no llegue a existir este video SE TOMARA EN CUENTA COMO QUE SE REALIZARON DESPLIEGUES DESPUÉS DE LA FECHA.