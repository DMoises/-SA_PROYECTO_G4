# **Documento de Definición de Arquitectura (DDA) \- Quetxal TV** {#documento-de-definición-de-arquitectura-(dda)---quetxal-tv}

| Nombre | Carnet |
| ----- | ----- |
| Juan Jose Almengor Tizol | 202212209 |
| Gerson David Otoniel González Morales | 20200774 |
| Moisés Iván Daniel Alvarado García | 202002907 |
| Fernando Misael Morales Ortiz | 202001950 |
| Daniel Moisés Chan Pelico | 201906099 |
| Joshua Estuardo Franco Equité | 201708845 |

# Índice {#índice}

1. [Introducción y Objetivos](#1.-introducción-y-objetivos)
2. [Fase 1: Espacio del Problema (Nivel CIM)](#2.-fase-1:-espacio-del-problema-(nivel-cim))
   - [2.1 Identificación del Caso de Negocio](#2.1-identificación-del-caso-de-negocio)
   - [2.2 Catálogo de Stakeholders y Responsabilidades](#2.2-catálogo-de-stakeholders-y-responsabilidades)
   - [2.3 Características del Sistema Priorizadas](#2.3-características-del-sistema-priorizadas)
   - [2.4 Extracción de Drivers Arquitectónicos](#2.4-extracción-de-drivers-arquitectónicos)
     - [2.4.1 Requerimientos Funcionales (RFS) y Casos de Uso Expandidos](#2.4.1-drivers-de-requerimientos-funcionales-(rfs)-y-casos-de-uso-expandidos:)
     - [2.4.2 Atributos de Calidad (Escenarios EAC)](#2.4.2-drivers-de-atributos-de-calidad-(escenarios-eac):)
     - [2.4.3 Drivers de Restricción](#2.4.3-drivers-de-restricción:)
   - [2.5 Modelado de Casos de Uso Expandidos](#2.5-modelado-de-casos-de-uso-expandidos)
     - Módulo 1: Gestión de Autenticación y Perfiles (CDU-N1-01 a N1-08)
     - Módulo 2: Gestión de Suscripciones (CDU-N2-01 a N2-05)
     - Módulo 3: Catálogo y Consumo de Contenido (CDU-N3-01 a N3-04)
     - Módulo 4: Sistema de Calificaciones y Recomendaciones (CDU-N4-01 a N4-04)
     - Módulo 5: Servicio Financiero FX (CDU-N5-01 a N5-03)
     - Módulo 6: Historial de Reproducción (CDU-N6-01 a N6-03)
     - Módulo 7: Notificaciones por Correo Electrónico (CDU-N7-01 a N7-03)
3. [Gobernanza y Entrelazamiento — Matrices de Trazabilidad](#3.-gobernanza-y-entrelazamiento-(matrices-de-trazabilidad))
   - [3.1 Matriz: Stakeholders vs. Requerimientos Funcionales](#3.1-matriz:-stakeholders-vs.-requerimientos-funcionales)
   - [3.2 Matriz: Requerimientos Funcionales vs. Casos de Uso](#3.2-matriz:-requerimientos-funcionales-vs.-casos-de-uso)
   - [3.3 Matriz: Stakeholders vs. Casos de Uso](#3.3-matriz:-stakeholders-vs.-casos-de-uso)
   - [3.4 Matriz: Requerimientos vs. Requerimientos (Dependencias de ejecución)](#3.4-matriz:-requerimientos-vs.-requerimientos-(dependencias-de-ejecución))
   - [3.5 Trazabilidad de Fase 2 (Administrador · RF-18+ · CDU-N8)](#3.5-trazabilidad-de-fase-2)
4. [Fase 2: Espacio de la Solución Conceptual (Nivel PIM)](#4.-fase-2:-espacio-de-la-solución-conceptual-(nivel-pim))
   - [4.1 Vista de Escenarios (+1)](#4.1-vista-de-escenarios-(+1))
   - [4.2 Vista Lógica y Estilos Arquitectónicos](#4.2-vista-lógica-y-estilos-arquitectónicos)
     - [4.2.1 Diagrama de Bloques de Alto Nivel](#4.2.1-diagrama-de-bloques-de-alto-nivel)
     - [4.2.2 Frontera Lógica de Datos (Diagramas ER Desacoplados)](#4.2.2-frontera-lógica-de-datos-(diagramas-er-desacoplados):)
   - [4.3 Vista de Procesos](#4.3-vista-de-procesos)
     - [4.3.1 Diagramas de Actividades](#4.3.1-diagramas-de-actividades:)
     - [4.3.2 Diagramas de Secuencia](#4.3.2-diagramas-de-secuencia:)
     - [4.3.3 Diagrama de Flujo](#4.3.3-diagrama-de-flujo:)
   - [4.4 Vista de Desarrollo (Componentes)](#4.4-vista-de-desarrollo-(componentes))
     - [4.4.1 Diagrama de Componentes](#4.4.1-diagrama-de-componentes:)
   - [4.5 Análisis Estructural: Arquitectura Síncrona vs. Asíncrona](#4.5-análisis-estructural:-arquitectura-síncrona-vs.-asíncrona)
5. [Fase 3: Espacio de la Solución Tecnológica (Nivel PSM e ISM)](#5.-fase-3:-espacio-de-la-solución-tecnológica-(nivel-psm-e-ism))
   - [5.1 Vista Física (Despliegue)](#5.1-vista-física-(despliegue))
   - [5.2 Justificación Tecnológica (Gobernanza)](#5.2-justificación-tecnológica-(gobernanza))
   - [5.3 Aplicación de Principios SOLID (Nivel ISM)](#5.3-aplicación-de-principios-solid-(nivel-ism))
6. [Conclusiones](#6.-conclusiones)
7. [Archivos Crudos](#7.-archivos-crudos)

## **1\. Introducción y Objetivos** {#1.-introducción-y-objetivos}

Este Documento de Decisión Arquitectónica (DDA) define, justifica y documenta la estructura lógica, de procesos y física para el desarrollo de la plataforma de streaming Quetxal TV. Implementaremos una arquitectura basada en microservicios bajo el patrón Database per Microservice para garantizar el aislamiento de los 7 dominios centrales de la aplicación, cumpliendo rigurosamente con las restricciones tecnológicas impuestas (ecosistema políglota, contenedorización con Docker, mitigación de latencia con Redis y la prohibición estricta de ORMs mágicos). 

El objetivo principal de este documento es asegurar el entrelazamiento arquitectónico: trazar cada decisión técnica en el Espacio de la Solución (Niveles PIM y PSM) directamente hacia una necesidad validada en el Espacio del Problema (Nivel CIM), eliminando asunciones y garantizando que cada línea de código tenga una justificación de negocio.

## **2\. Fase 1: Espacio del Problema (Nivel CIM)** {#2.-fase-1:-espacio-del-problema-(nivel-cim)}

Para establecer los límites del sistema sin involucrar decisiones tecnológicas prematuras, abstrajimos el núcleo de la plataforma. 

### **2.1 Identificación del Caso de Negocio** {#2.1-identificación-del-caso-de-negocio}

* **2.1.1 Core del Negocio (Caso de Uso Nivel 0):**  
  Definimos el alcance global mediante un único proceso unificado denominado *"Gestionar Autenticación, Catálogo y Suscripciones de Quetxal TV"*. Este núcleo encapsula la entrega de valor principal: permitir a los usuarios consumir contenido multimedia bajo un modelo de suscripción financiera segura.  
  ![Core de Negocio](https://www.plantuml.com/plantuml/png/TL9BRXin3Dth5CHqOoy2D0K2eq5W9Fu1NQHmCKdGHJQiXfwoqOW6nN4T53rCpz0Zv6AH9dQQJRMI7j_Zvr6NoL2jxu8Bj34m0UNskq73IjvOeaiF7BUesC4M_GEsLDjZ82XXZ6sWDuG-aST4yCj1FhDCRrNwsCmbYCAxvUdgRBLyYOasf0Vy_OV9PBOOy2jL-Nc4Jyyc7sVkjtF6bYjUIqD1e26OOv9KBhT9pc4kIlaHu3ErubbWzAKdssE0cxknS-WjPwjkKu-QWtMVlF8sOnLWAYthaNAr_bIIBdZ7AOT6gw_Z-tXnKNCowX2MUoEDCfqEmit-AAj9TrpgrjStw_yBKcTRvrvjWshf9HsO_ngk1lEEHbPhbHsHGcrAs75iIuDtt91aUty8BB8wDdWVHuUvF3_zZV2OBRAdFq5Q6G_5VVQeE5d6XPEJwG30ELHpYQdlAB-ZKUH6ihQbL3QFu7kAXfKRo4MrsRzgWY4ORr_suB7xnlA6M8Ojr0K5QX6Y66_OOtOfKggSkwJOv4_t30==)  
* **2.1.2 Primera Descomposición (Procesos de Negocio):**   
  Para hacer el sistema manejable y preparar la segregación de los futuros microservicios, descompusimos el Core en 7 procesos de negocio lógicos:  
  ![Primera Descomposición](https://www.plantuml.com/plantuml/png/TPFDZjD03CVlUGghN42Ygtv7H5MrfTr03riLielsm6KqSOEroKmqCocj40_3C_08-s9uaWOAP7EoRF_iyT_EjNN2kAh8Wnpt3fm6GzaN1oaPb8wq2kmZgL8OKK0fvAF8C76d7C67XSfol4YeB4fX4Ru5mDzRJi-ChbIwqhasy2AEupUhIHFJ9aNJ-gTXF0nh_z8O_VNilfbDXuD1y3rmvBZXpb21Hi0QhTH5gIr9Ulgf8WveYLPRI16sc6b96bvkwO0vh3Qthu90ICVrUlUs4ePZIMMbeP9zFH3MFzgqASlTnbTPqu4iX-A7pse-JyWwB0JS71qQfHUB6jiVMoX1Sw2KhUJsRlSyO0jN1i5PG-XzgD0THGvtdw3VDKBlh6AhQM-rlk_l1iC8tg5rVdAVlAmSAaTIr5gyXWGjxmmjd627PayvshfvEUmgDlgxs5aO-Rk2oFGP7tNXuuX7B7bNJNTVOYNSquzSPxh1nbtO98ADOcM4RB0JKpdjwo5yvmQTTA7J26gr_OfZKa99GiFcGyDCkvXP1Ezv8TeGgyrF_8YbqMdLD6-uMHSNydG5sNQohNR_lJ7aumpy_K2_l_0Q_x575_RumfvSs3C-Xn5SNR4vXGZcSr8ohr9SB09s-1G-idBOP8J_PeoUyOSrML_RDQgKV-rV)


### **2.2 Catálogo de Stakeholders y Responsabilidades** {#2.2-catálogo-de-stakeholders-y-responsabilidades}

Identificamos a los interesados clave del proyecto para garantizar que las preocupaciones arquitectónicas de cada frente sean resueltas. Establecemos los siguientes roles y responsabilidades operativas:

| Stakeholder / Rol | Descripción y Enfoque | Responsabilidades Arquitectónicas y Operativas |
| ----- | ----- | ----- |
| **Cliente / Usuario Final** | Consumidor del sistema Quetxal TV. | • Validar la usabilidad de la interfaz. • Generar la demanda de concurrencia hacia el API Gateway. • Emitir calificaciones y consumir el streaming. |
| **Juan Pablo (Auxiliar SA)** | Representante de la Alta Dirección / Evaluador Técnico. | • Aprobar la visión, el alcance del sistema y el DDA. • Imponer los Drivers de Restricción Técnica (Uso de GCP, Backend Políglota, Docker, Redis, cero ORMs). |
| **Ingeniero SRE / Arquitecto** | Líder del diseño estructural y orquestador de infraestructura. | • Definir el patrón *Database per Microservice*. • Diseñar las Vistas Lógica, de Procesos y Despliegue. • Gobernar el flujo de CI/CD y despliegue físico en GCP. |
| **Dev Team (Desarrolladores)** | Ingenieros encargados de la implementación (Nivel ISM). | • Programar la lógica en Go, Python y TypeScript respetando contratos gRPC. • Implementar Funciones, Vistas y *Stored Procedures* en SQL nativo. |
| **Administrador (Operador de Plataforma)** | Operador interno responsable de la gestión de contenido y de la cartelera desde el Panel de Administración (Fase 2). | • Ejecutar el CRUD del catálogo (películas/series) y la carga de portadas/video a GCS. • Programar y calendarizar estrenos. • Consultar y exportar reportes (auditoría y de negocio). • Operar siempre bajo control de acceso por rol Administrador (JWT/Cookies). |

### **2.3 Características del Sistema Priorizadas** {#2.3-características-del-sistema-priorizadas}

Derivado de los procesos de negocio, extrajimos y priorizamos las características operacionales que el sistema debe satisfacer. Esta priorización dicta el orden de implementación para garantizar la entrega del Producto Mínimo Viable (MVP) protegiendo la variable de *Tiempo* en la Triple Restricción.

| ID | Característica del Sistema | Prioridad | Justificación de Negocio / Restricción |
| ----- | ----- | ----- | ----- |
| **C-01** | Autenticación nativa segura y gestión estricta de hasta 5 perfiles por cuenta. | **Alta** | Protege el acceso al sistema garantizando la seguridad en tiempo y forma. |
| **C-02** | Procesamiento transaccional de pagos de suscripciones con garantía ACID. | **Alta** | Es el núcleo financiero. Requiere alta consistencia de datos para evitar pérdidas económicas. |
| **C-03** | Búsqueda multicriterio en el catálogo y proyección optimizada de fichas técnicas. | **Alta** | Asegura la usabilidad del sistema para que el usuario encuentre el contenido de valor rápidamente. |
| **C-04** | Registro asíncrono y masivo del minuto/segundo exacto de reproducción de video. | **Alta** | Garantiza la promesa de valor de reanudar el contenido exactamente donde el usuario lo dejó. |
| **C-05** | Conversión de tarifas en tiempo real utilizando cachés en memoria temporal. | **Media** | Mitiga la latencia de APIs externas para asegurar un rendimiento (EAC) fluido durante las compras. |
| **C-06** | Sistema de calificaciones y recálculo de recomendación global por contenido. | **Media** | Fomenta la interacción del usuario. Su carga matemática se delega al motor de base de datos. |
| **C-07** | Despacho de notificaciones transaccionales y alertas (Vía correo electrónico). | **Baja** | Agrega valor de comunicación, pero se desacopla del hilo principal para no bloquear procesos críticos. |

### **2.4 Extracción de Drivers Arquitectónicos** {#2.4-extracción-de-drivers-arquitectónicos}

La presente seccion traduce las necesidades abstractas del negocio en directrices tecnicas inquebrantables. Constituye el contrato fundamental que guiara el paso del Espacio del Problema (Nivel CIM) al Espacio de la Solución (Niveles PIM y PSM). Ningun desarrollador debe programar una funcionalidad que no este sustentada por uno de los siguientes drivers.

#### 2.4.1 Drivers de Requerimientos Funcionales (RFS) y Casos de Uso Expandidos: {#2.4.1-drivers-de-requerimientos-funcionales-(rfs)-y-casos-de-uso-expandidos:}

Estos drivers definen las características operacionales exactas que el sistema debe ejecutar. Se han extraído de la expansión de los Casos de Uso de Negocio y han sido acotados para guiar el desarrollo de los microservicios.

| ID | Dominio / Módulo | Descripción Detallada del Requerimiento Funcional | Prioridad |
| ----- | ----- | ----- | ----- |
| **RF-01** | Identidad (Go) | El sistema debe permitir el registro de nuevos usuarios capturando sus datos y aplicando un algoritmo de hash seguro a su contraseña local, la cual es de carácter estrictamente obligatorio. | Alta |
| **RF-02** | Identidad (Go) | El sistema debe validar el inicio de sesión local y emitir un Token JWT o Cookie de Sesión firmada para autorizar las peticiones subsecuentes. | Alta |
| **RF-03** | Identidad (Go) | El sistema debe permitir la creación de perfiles secundarios, validando matemáticamente en el backend que la cuenta no exceda el límite estricto de 5 perfiles activos. | Alta |
| **RF-04** | Identidad (Go) | El sistema debe ejecutar el trigger directamente en el motor de base de datos para registrar inmutablemente cualquier cambio de contraseñas. | Alta |
| **RF-05** | Suscripciones (TS) | El sistema debe desplegar los planes de suscripción (Básico, Estándar, Premium) con sus respectivas características y precios actualizados. | Alta |
| **RF-06** | Suscripciones (TS) | El sistema debe procesar el pago recurrente invocando obligatoriamente el Procedimiento Almacenado nativo en la base de datos para garantizar la transacción ACID. | Alta |
| **RF-07** | Suscripciones (TS) | El sistema debe proveer un panel de autogestión para que el usuario pueda hacer upgrade, downgrade o cancelación de su suscripción activa. | Media |
| **RF-08** | Catálogo (Python) | El sistema debe permitir la búsqueda de contenido en la cartelera aplicando filtros multicriterio simultáneos por categoría, género y actores. | Alta |
| **RF-09** | Catálogo (Python) | El sistema debe proyectar la ficha técnica del contenido (título, sinopsis, reparto) consumiendo una Vista SQL materializada para optimizar los tiempos de lectura. | Alta |
| **RF-10** | Calificaciones (Python) | El sistema debe permitir al usuario autenticado emitir una calificación discreta (de 1 a 5 estrellas) para un contenido específico. | Media |
| **RF-11** | Calificaciones (Python) | El sistema debe delegar el cálculo del porcentaje de recomendación global ejecutando una Función SQL nativa en el motor de persistencia. | Media |
| **RF-12** | Financiero FX (Python) | El sistema debe convertir el precio de los planes en dólares a la moneda local del usuario consultando una API de Divisas externa. | Media |
| **RF-13** | Financiero FX (Python) | El sistema debe almacenar temporalmente la tasa de cambio obtenida en una Caché de Redis, asignándole un Tiempo de Vida (TTL) definido para mitigar la latencia. | Media |
| **RF-14** | Historial (Go) | El sistema debe registrar en la base de datos de historial la temporada, el episodio y el segundo exacto al momento de que el usuario detiene la reproducción del video. | Alta |
| **RF-15** | Historial (Go) | El sistema debe consultar el último registro de tiempo del perfil activo para reanudar el flujo de video exactamente en la marca de tiempo donde se dejó. | Alta |
| **RF-16** | Notificaciones (TS) | El sistema debe encolar de forma asíncrona, mediante el patrón Outbox, los mensajes de confirmación de registro y los recibos de cobro de suscripción. | Baja |
| **RF-17** | Notificaciones (TS) | El sistema debe despachar las alertas de nuevas publicaciones de contenido hacia el servidor SMTP configurado sin bloquear el hilo principal de ejecución. | Baja |
| **RF-18** | Administración (Python) | El sistema debe exponer un Panel de Administración web protegido por rol de Administrador (validación JWT/Cookies en el API Gateway) para gestionar el catálogo y la cartelera desde el frontend. | Alta |
| **RF-19** | Administración / Catálogo (Python) | El sistema debe permitir al Administrador agregar nuevo contenido (películas/series) con sus metadatos y portadas. | Alta |
| **RF-20** | Administración / Catálogo (Python) | El sistema debe permitir al Administrador actualizar/editar los metadatos y portadas de contenido existente. | Alta |
| **RF-21** | Administración / Catálogo (Python) | El sistema debe permitir al Administrador eliminar contenido mediante borrado lógico (Soft-Delete), dejando rastro en la bitácora de auditoría. | Alta |
| **RF-22** | Administración / Catálogo (Python) | El sistema debe permitir al Administrador programar/calendarizar la fecha de estreno que controla la visibilidad del contenido en la cartelera. | Media |
| **RF-23** | Almacenamiento / GCS (Python) | El sistema debe desacoplar la multimedia pesada (portadas y video) hacia Buckets de Google Cloud Storage y servirla al frontend mediante URLs firmadas. | Alta |
| **RF-24** | Auditoría (Transversal · SQL nativo) | El sistema debe registrar automáticamente, mediante triggers en el motor de base de datos, toda operación INSERT/UPDATE/DELETE (usuario responsable, timestamp, tabla afectada, estado anterior y estado nuevo) en una tabla exclusiva de auditoría por microservicio. | Alta |
| **RF-25** | Reportes / Administración | El sistema debe generar y exportar el reporte de auditoría del Panel de Administración en formatos `.csv` y PDF, accesible únicamente al rol Administrador. | Media |

#### 2.4.2 Drivers de Atributos de Calidad (Escenarios EAC): {#2.4.2-drivers-de-atributos-de-calidad-(escenarios-eac):}

Los Requerimientos No Funcionales se formalizan a través de Escenarios de Atributos de Calidad (EAC), alineados con los fundamentos de la norma ISO 25000\. Esto elimina la ambigüedad y establece métricas exactas (Fuente, Estímulo, Entorno, Artefacto, Respuesta y Medida de Respuesta) que la arquitectura debe satisfacer y evaluar en tiempo de ejecución.

| ID | Atributo ISO | Escenario Formal de Calidad (EAC) |
| ----- | ----- | ----- |
| **EAC-01** | Rendimiento / Eficiencia | **Fuente:** Módulo de Suscripciones (TS). **Estímulo:** Solicita el tipo de cambio de divisas para procesar un cobro. **Entorno:** Día de estrenos con picos altos de concurrencia y transacciones financieras. **Artefacto:** Módulo Financiero FX Cache (Redis). **Respuesta:** El sistema intercepta la petición y recupera la tasa de cambio directamente desde la memoria temporal, evitando la latencia de red. **Medida:** Latencia de resolución y entrega menor a 50 milisegundos. |
| **EAC-02** | Disponibilidad / Tolerancia a Fallos | **Fuente:** Caída interna del sistema. **Estímulo:** Caída abrupta del motor de BD de Calificaciones o del servicio de Notificaciones. **Entorno:** Momento normal de operación de streaming de video. **Artefacto:** Arquitectura de Microservicios. **Respuesta:** El sistema aísla la falla mediante separación estricta de dominios; el Gateway rechaza las acciones del servicio caído de forma controlada sin afectar el catálogo ni bloquear la reproducción principal de video. **Medida:** El usuario continúa su visualización sin interrupciones perceptibles, manteniendo una disponibilidad global del 99.5%. |
| **EAC-03** | Seguridad (Autorización) | **Fuente:** Cliente (Frontend Web/Mobile) o atacante externo. **Estímulo:** Intento de acceso a un endpoint protegido (ej. modificar perfil o cobro) en la red interna. **Entorno:** Internet público (Zona Desmilitarizada DMZ). **Artefacto:** API Gateway (Enrutador de borde). **Respuesta:** El Gateway intercepta la petición, exige la presencia de un Token JWT y valida matemáticamente su firma antes de enrutar. **Medida:** Rechazo absoluto (HTTP 401 Unauthorized) del 100% de las peticiones que carezcan de un token válido y firmado. |
| **EAC-04** | Disponibilidad / Despliegue (Zero-Downtime) · *Fase 2* | **Fuente:** Pipeline de CD (rama `release`). **Estímulo:** Despliegue de una nueva versión de imágenes a GKE. **Entorno:** Usuarios consumiendo streaming de video en producción. **Artefacto:** Deployments de Kubernetes con estrategia RollingUpdate (`maxUnavailable=0`, `maxSurge=1`). **Respuesta:** El clúster actualiza los Pods de forma progresiva sin cortar las transmisiones activas y ejecuta rollback automático (`kubectl rollout undo`) si un Pod entra en `CrashLoopBackOff`. **Medida:** Cero Pods indisponibles durante el rollout; el servicio se mantiene disponible y la reversión ante fallo de arranque es automática. |
| **EAC-05** | Integridad / Trazabilidad (Auditoría) · *Fase 2* | **Fuente:** Cualquier microservicio con base de datos relacional. **Estímulo:** Operación transaccional (INSERT/UPDATE/DELETE) sobre una tabla operacional. **Entorno:** Operación normal y ante intentos de fraude o fallas. **Artefacto:** Triggers de auditoría en el motor PostgreSQL. **Respuesta:** Cada cambio queda registrado de forma inmutable en la tabla exclusiva de auditoría con usuario responsable, timestamp y estados anterior/nuevo, dentro de la misma transacción del negocio. **Medida:** 100% de las operaciones transaccionales auditadas; ningún cambio queda sin rastro. |

#### 2.4.3 Drivers de Restricción: {#2.4.3-drivers-de-restricción:}

Estas son las limitantes impuestas por el entorno, el cliente o la dirección técnica del Laboratorio de Software Avanzado. Las decisiones de diseño tecnológico (Nivel PSM) deben subordinarse obligatoriamente a este marco limitante.

| ID | Tipo de Restricción | Descripción de la Restricción | Impacto Arquitectónico y Gobernanza |
| ----- | ----- | ----- | ----- |
| **RES-01** | Tecnológica y Ecosistema | Es de carácter obligatorio el diseño e implementación de un backend políglota. Se exige el uso simultáneo de Go, TypeScript y Python. | Distribución estricta de dominios según la conveniencia técnica del lenguaje para cada microservicio. |
| **RES-02** | Arquitectónica de Datos | Se impone el patrón *Database per Microservice*. Queda estrictamente prohibido que dos microservicios compartan un mismo esquema de base de datos. | Cero llaves foráneas (FK) físicas entre distintos dominios. Aislamiento absoluto de la persistencia. |
| **RES-03** | Desarrollo y Gobernanza | Queda estrictamente prohibido el uso de herramientas de autogeneración de bases de datos o de ORMs mágicos como Prisma o Supabase. | Toda inserción, actualización o migración debe programarse manualmente. |
| **RES-04** | Persistencia y Lógica | Es mandatorio delegar lógica pesada y de auditoría a los motores de bases de datos. | Implementación obligatoria en código SQL nativo de Procedimientos Almacenados, Vistas Materializadas, Funciones y Triggers. |
| **RES-05** | Infraestructura y Despliegue | La arquitectura física debe ser contenerizada mediante Docker y orquestada con docker-compose. El despliegue a producción debe realizarse obligatoriamente en GCP. | Uso de Máquinas Virtuales (Compute Engine) para segmentar el ecosistema, prohibiendo despliegues manuales fuera de contenedores. |

### 2.5 Modelado de Casos de Uso Expandidos (Nivel CIM)

Esta seccion documenta graficamente la expansion de los procesos de negocio definidos en la primera descomposicion. Cada diagrama representa un Modulo del sistema y establece la base visual de donde se extrajeron matematicamente los Drivers de Requerimientos Funcionales (RF). Las imagenes a continuacion demuestran la interaccion directa de los actores externos con el sistema, eliminando cualquier ambiguedad operativa.<br/><br/>

### Módulo 1: Gestión de Autenticación y Perfiles


- CDU-N1-01: Registrar Usuario
- CDU-N1-02: Iniciar Sesión
- CDU-N1-04: Cerrar Sesión
- CDU-N1-05: Crear Perfil
- CDU-N1-06: Editar Perfil
- CDU-N1-07: Eliminar Perfil
- CDU-N1-08: Seleccionar Perfil


![Módulo 1](/-SA_PROYECTO_G4/assets/f2/identidad.png)





### Especificación CDU-N1-01 — Registrar Usuario

| Campo | Descripción |
|---|---|
| **Nombre** | Registrar Usuario |
| **Código** | CDU-N1-01 |
| **Actores** | Usuario Invitado |
| **Descripción** | Permite a una persona no autenticada crear una cuenta en QuetxalTV proporcionando correo electrónico, contraseña y el nombre de su primer perfil. Al completarse exitosamente, la cuenta queda activa, el primer perfil es creado de forma atómica y se emite un JWT que inicia sesión automáticamente. |
| **Precondiciones** | El correo electrónico no debe estar registrado previamente en el sistema. El usuario no debe tener una sesión activa vigente. |
| **Post Condiciones** | Cuenta creada con estado "Activo". Primer perfil asociado creado con el nombre proporcionado. JWT firmado emitido y almacenado en cookie HttpOnly. Evento de creación de contraseña registrado por el trigger de auditoría en base de datos. Notificación de bienvenida encolada mediante el patrón Outbox para envío asíncrono. |
| **Flujo principal** | 1. El Usuario Invitado accede a la página de registro (`/register`). 2. El sistema muestra el formulario con campos: correo electrónico, contraseña y nombre del perfil principal. 3. El usuario ingresa su correo electrónico. 4. El usuario ingresa su contraseña (mínimo 8 caracteres). 5. El usuario ingresa el nombre de su perfil principal. 6. El usuario presiona el botón "Crear cuenta". 7. El sistema valida el formato del correo y verifica que no exista en la base de datos. 8. El sistema aplica bcrypt (costo por defecto) al password proporcionado. 9. El sistema ejecuta la transacción atómica: crea el registro en `usuarios` y el registro en `perfiles`. 10. El sistema dispara el trigger de auditoría que registra inmutablemente el evento de creación de contraseña. 11. El sistema genera un JWT firmado HS256 con claims `{usuario_id, rol, email}` y lo almacena en cookie de sesión HttpOnly, Secure, SameSite=Lax. 12. El sistema encola una notificación de bienvenida (patrón Outbox) con los datos del nuevo usuario. 13. El sistema redirige al usuario al selector de perfiles (`/profiles`). |
| **Flujos alternos** | **FA1 — Correo ya registrado:** FA1.1 El sistema detecta violación de constraint única (SQLSTATE 23505). FA1.2 El sistema devuelve HTTP 409 con mensaje "Este correo ya tiene una cuenta registrada". FA1.3 El usuario puede corregir el correo o navegar a "Iniciar sesión". **FA2 — Campos obligatorios vacíos o inválidos:** FA2.1 El sistema resalta visualmente los campos con error. FA2.2 El usuario completa o corrige la información. FA2.3 Se retoma el flujo principal desde el paso 7. **FA3 — Contraseña menor a 8 caracteres:** FA3.1 El sistema muestra "La contraseña debe tener al menos 8 caracteres". FA3.2 El usuario corrige la contraseña. FA3.3 Se retoma el flujo principal desde el paso 7. **FA4 — Error de base de datos:** FA4.1 La transacción hace rollback completo. FA4.2 El sistema responde con HTTP 500. FA4.3 El usuario recibe un mensaje genérico de error y puede reintentar. |
| **Reglas de negocio** | El correo electrónico debe ser único en toda la plataforma. La contraseña nunca se almacena en texto plano; se aplica bcrypt sin excepción. La creación del usuario y la del primer perfil es una operación atómica: si falla cualquier parte, no se crea ningún registro. El nombre del primer perfil no puede estar vacío ni exceder 30 caracteres. Todo usuario nuevo recibe el rol `usuario` por defecto. |
| **Reglas de calidad** | El sistema debe responder en menos de 3 segundos tras presionar "Crear cuenta". El campo contraseña debe ocultarse visualmente. El formulario debe marcar visualmente los campos obligatorios. Los mensajes de error de validación deben ser descriptivos sin revelar detalles internos del sistema. |

---

### Especificación CDU-N1-02 — Iniciar Sesión

| Campo | Descripción |
|---|---|
| **Nombre** | Iniciar Sesión |
| **Código** | CDU-N1-02 |
| **Actores** | Usuario Invitado, Usuario Registrado, Usuario Suscriptor |
| **Descripción** | Permite a cualquier usuario con cuenta existente autenticarse en QuetxalTV mediante correo electrónico y contraseña, obteniendo un JWT válido almacenado en cookie de sesión segura que autoriza las peticiones subsiguientes a la API. |
| **Precondiciones** | El usuario debe tener una cuenta registrada con estado "Activo". La cuenta debe ser de tipo local (con contraseña), no exclusivamente OAuth. |
| **Post Condiciones** | JWT firmado emitido y almacenado en cookie HttpOnly con TTL de 24 horas. El usuario es redirigido al selector de perfiles (incluye CDU-N1-08). |
| **Flujo principal** | 1. El usuario accede a la página de inicio de sesión (`/login`). 2. El sistema muestra el formulario con campos: correo electrónico y contraseña. 3. El usuario ingresa su correo electrónico. 4. El usuario ingresa su contraseña. 5. El usuario presiona "Iniciar sesión". 6. El sistema busca la cuenta por correo electrónico en la base de datos. 7. El sistema verifica que la cuenta esté activa. 8. El sistema compara la contraseña proporcionada con el hash almacenado usando bcrypt. 9. El sistema genera un JWT firmado (HS256) con claims `{usuario_id, rol, email, exp}`. 10. El sistema almacena el JWT en la cookie `session` (HttpOnly, Secure, SameSite=Lax, expira en 24h). 11. El sistema devuelve HTTP 200 con `{usuario_id, expira_en}`. 12. El sistema redirige al usuario al selector de perfiles para ejecutar CDU-N1-08. |
| **Flujos alternos** | **FA1 — Correo no registrado:** FA1.1 El sistema devuelve HTTP 401. FA1.2 El sistema muestra "Credenciales inválidas" (sin revelar si el correo existe). FA1.3 El usuario puede intentar de nuevo o registrarse. **FA2 — Contraseña incorrecta:** FA2.1 El sistema devuelve HTTP 401 con mensaje "Credenciales inválidas". FA2.2 El usuario puede corregir su contraseña. **FA3 — Cuenta inactiva:** FA3.1 El sistema devuelve HTTP 401 con mensaje "La cuenta no está activa". FA3.2 El usuario debe contactar soporte. **FA4 — Cuenta exclusivamente OAuth:** FA4.1 El sistema devuelve HTTP 401 con mensaje indicando que la cuenta solo admite inicio de sesión externo. |
| **Reglas de negocio** | El sistema nunca revela si un correo existe en la plataforma para mitigar ataques de enumeración de usuarios. El JWT tiene TTL de 24 horas; no existe mecanismo de refresh en el alcance actual del MVP. La cookie debe ser HttpOnly para prevenir acceso desde JavaScript (mitigación XSS). |
| **Reglas de calidad** | La respuesta del sistema no debe exceder 2 segundos. Los inputs deben sanitizarse antes de procesarse. Los reintentos de login no tienen límite de bloqueo en el MVP, pero el sistema debe registrar los intentos fallidos. |

---

### Especificación CDU-N1-04 — Cerrar Sesión

| Campo | Descripción |
|---|---|
| **Nombre** | Cerrar Sesión |
| **Código** | CDU-N1-04 |
| **Actores** | Usuario Registrado, Usuario Suscriptor |
| **Descripción** | Permite al usuario autenticado terminar su sesión activa en QuetxalTV, invalidando la cookie de sesión JWT y limpiando el estado local del perfil seleccionado. |
| **Precondiciones** | El usuario debe tener una sesión activa (cookie `session` con JWT válido presente). |
| **Post Condiciones** | La cookie `session` es invalidada (sobreescrita con valor vacío y MaxAge=-1). El localStorage del navegador se limpia (se elimina `selectedProfile`). El usuario es redirigido a la página de inicio de sesión. |
| **Flujo principal** | 1. El usuario selecciona "Cerrar sesión" desde el menú desplegable de usuario en la barra de navegación. 2. El sistema envía POST a `/api/auth/logout`. 3. El API Gateway recibe la petición y ordena al cliente sobreescribir la cookie `session` con valor vacío, Path="/", HttpOnly=true, MaxAge=-1. 4. El sistema devuelve HTTP 200 con `{"mensaje": "sesion cerrada"}`. 5. El frontend limpia `selectedProfile` del localStorage del navegador. 6. El frontend redirige al usuario a `/login`. |
| **Flujos alternos** | **FA1 — El usuario ya no tiene sesión activa:** FA1.1 El sistema procesa el logout de forma idempotente (sin error). FA1.2 El usuario es redirigido a `/login`. **FA2 — Error de red durante el logout:** FA2.1 El frontend limpia el estado local (localStorage) de todas formas. FA2.2 El usuario es redirigido a `/login`. |
| **Reglas de negocio** | El cierre de sesión debe ser accesible desde cualquier página de la plataforma mediante el menú de usuario. Al cerrar sesión, el perfil seleccionado en localStorage se elimina para evitar acceso no autorizado desde el mismo navegador. La operación es idempotente: hacer logout sin sesión activa no genera error. |
| **Reglas de calidad** | El proceso completo de logout debe completarse en menos de 1 segundo. No debe ser posible acceder a rutas protegidas después del logout con el mismo JWT (la cookie debe estar ausente). |

---

### Especificación CDU-N1-05 — Crear Perfil

| Campo | Descripción |
|---|---|
| **Nombre** | Crear Perfil |
| **Código** | CDU-N1-05 |
| **Actores** | Usuario Registrado, Usuario Suscriptor |
| **Descripción** | Permite al usuario autenticado agregar un nuevo perfil de visualización a su cuenta en QuetxalTV. El sistema valida que la cuenta no supere el límite estricto de 5 perfiles activos simultáneos. Incluye la selección del perfil recién creado (CDU-N1-08). |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido. La cuenta del usuario debe tener menos de 5 perfiles registrados. |
| **Post Condiciones** | Nuevo perfil creado y asociado al `usuario_id` del token JWT. El perfil queda disponible en el selector de perfiles. Se ejecuta CDU-N1-08 para establecer el contexto del nuevo perfil. |
| **Flujo principal** | 1. El usuario autenticado accede a la sección "Administrar perfiles" (`/profiles/manage`). 2. El usuario selecciona la opción "Agregar perfil" (`/profiles/add`). 3. El sistema muestra el formulario de creación con campos: nombre, idioma preferido y opción de perfil infantil. 4. El usuario ingresa el nombre del perfil. 5. El usuario selecciona el idioma (por defecto "es"). 6. El usuario indica si el perfil es infantil. 7. El usuario presiona "Guardar". 8. El sistema envía POST a `/api/auth/profiles` con el JWT en la cookie. 9. El API Gateway extrae el `usuario_id` del JWT (nunca del body por seguridad). 10. El sistema verifica en base de datos que la cuenta no supere 5 perfiles. 11. El sistema crea el registro del nuevo perfil. 12. El sistema devuelve HTTP 201 con los datos del perfil creado. 13. El sistema redirige al selector de perfiles (CDU-N1-08). |
| **Flujos alternos** | **FA1 — Límite de 5 perfiles alcanzado:** FA1.1 El sistema devuelve HTTP 422 (FailedPrecondition). FA1.2 El sistema muestra "La cuenta ya alcanzó el máximo de 5 perfiles". FA1.3 El botón "Agregar perfil" se oculta cuando se tienen 5 perfiles. **FA2 — Nombre de perfil vacío o inválido:** FA2.1 El sistema devuelve HTTP 400 con mensaje de validación. FA2.2 El usuario corrige el nombre. **FA3 — Nombre de perfil ya existe en la cuenta:** FA3.1 El sistema devuelve HTTP 409. FA3.2 El sistema muestra "Ya existe un perfil con ese nombre en tu cuenta". FA3.3 El usuario elige otro nombre. |
| **Reglas de negocio** | El límite de 5 perfiles por cuenta es estricto y se valida en el backend (no solo en el frontend). El `usuario_id` se obtiene exclusivamente del JWT para prevenir falsificación de identidad. El nombre del perfil no puede estar vacío ni exceder 30 caracteres. El nombre debe ser único dentro de la misma cuenta. |
| **Reglas de calidad** | El formulario de creación de perfil no debe requerir más de 3 campos obligatorios. El sistema debe responder en menos de 2 segundos. El botón "Agregar perfil" debe ocultarse visualmente en el frontend cuando se alcancen los 5 perfiles. |

---

### Especificación CDU-N1-06 — Editar Perfil

| Campo | Descripción |
|---|---|
| **Nombre** | Editar Perfil |
| **Código** | CDU-N1-06 |
| **Actores** | Usuario Registrado, Usuario Suscriptor |
| **Descripción** | Permite al usuario autenticado modificar el nombre de un perfil existente en su cuenta. Solo el perfil administrador (primer perfil, ordenado alfabéticamente) puede además editar el nombre desde la sección "Información personal" de la cuenta. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido. El perfil a editar debe existir y pertenecer a la cuenta del usuario autenticado. |
| **Post Condiciones** | El nombre del perfil queda actualizado en la base de datos. El `localStorage.selectedProfile.nombre` se actualiza en el navegador si es el perfil activo. |
| **Flujo principal** | 1. El usuario accede a "Administrar perfiles" (`/profiles/manage`). 2. El usuario selecciona el perfil que desea editar. 3. El sistema navega a la página de edición del perfil (`/profiles/manage/{id}`). 4. El sistema muestra el formulario con el nombre actual del perfil precargado. 5. El usuario modifica el nombre del perfil. 6. El usuario presiona "Guardar cambios". 7. El sistema envía PUT a `/api/profiles/{id}` con el nuevo nombre. 8. El API Gateway valida el JWT y extrae `usuario_id`. 9. El sistema ejecuta `UPDATE perfiles SET nombre = $1 WHERE id = $2 AND usuario_id = $3`. 10. El sistema verifica que la actualización afectó al menos 1 fila. 11. El sistema devuelve HTTP 200 con los datos actualizados. 12. El frontend actualiza `localStorage.selectedProfile.nombre` si corresponde. 13. El sistema muestra confirmación "Perfil actualizado correctamente". |
| **Flujos alternos** | **FA1 — Nombre ya existe en la cuenta:** FA1.1 El sistema detecta violación de constraint única (SQLSTATE 23505). FA1.2 El sistema devuelve HTTP 409. FA1.3 El sistema muestra "Ya existe un perfil con ese nombre. Intenta con otro." FA1.4 El usuario elige un nombre diferente. **FA2 — Perfil no encontrado o no pertenece al usuario:** FA2.1 El sistema devuelve HTTP 404. FA2.2 El sistema muestra mensaje de error y redirige a la gestión de perfiles. **FA3 — Nombre vacío:** FA3.1 El botón "Guardar cambios" permanece deshabilitado si el campo está vacío. FA3.2 El sistema muestra validación del lado cliente. |
| **Reglas de negocio** | Solo se puede editar el nombre de perfiles que pertenezcan al `usuario_id` del JWT autenticado. El nombre del perfil debe ser único dentro de la misma cuenta. El nombre no puede estar vacío ni exceder 30 caracteres. El botón "Guardar" se deshabilita si el nombre no ha cambiado respecto al original. |
| **Reglas de calidad** | El campo de nombre debe mostrar el valor actual precargado. El sistema debe responder en menos de 2 segundos. Los cambios deben reflejarse en la interfaz sin necesidad de recargar la página. |

---

### Especificación CDU-N1-07 — Eliminar Perfil

| Campo | Descripción |
|---|---|
| **Nombre** | Eliminar Perfil |
| **Código** | CDU-N1-07 |
| **Actores** | Usuario Registrado, Usuario Suscriptor |
| **Descripción** | Permite al usuario administrador (perfil principal, índice 0 ordenado alfabéticamente) eliminar perfiles secundarios de su cuenta. El perfil principal no puede eliminarse. La operación requiere confirmación explícita del usuario. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido. El perfil a eliminar debe existir y pertenecer a la cuenta del usuario autenticado. El usuario debe estar operando con el perfil administrador (primero alfabéticamente). Solo se pueden eliminar perfiles que no sean el principal (índice > 0). |
| **Post Condiciones** | El perfil queda eliminado de la base de datos. La lista de perfiles en la interfaz se actualiza automáticamente sin recargar la página. |
| **Flujo principal** | 1. El administrador accede a "Administrar perfiles" (`/profiles/manage`). 2. El sistema muestra la grilla de perfiles con botones "Eliminar" visibles para todos excepto el perfil principal. 3. El administrador presiona "Eliminar" en el perfil deseado. 4. El sistema solicita confirmación mediante diálogo: "¿Eliminar el perfil '{nombre}'?". 5. El administrador confirma la acción. 6. El sistema envía DELETE a `/api/profiles/{id}`. 7. El API Gateway valida el JWT y extrae `usuario_id`. 8. El sistema ejecuta `DELETE FROM perfiles WHERE id = $1 AND usuario_id = $2`. 9. El sistema verifica que la operación afectó al menos 1 fila. 10. El sistema devuelve HTTP 204 (No Content). 11. El frontend elimina el perfil de la lista local sin recargar la página. |
| **Flujos alternos** | **FA1 — El administrador cancela la confirmación:** FA1.1 No se realiza ninguna acción. FA1.2 El usuario permanece en la página de administración. **FA2 — Perfil no encontrado o no pertenece al usuario:** FA2.1 El sistema devuelve HTTP 404 (ErrPerfilNoEncontrado → codes.NotFound). FA2.2 El frontend muestra el mensaje de error devuelto por la API. **FA3 — Error interno del servidor:** FA3.1 El sistema devuelve HTTP 500. FA3.2 El frontend muestra "No se pudo eliminar el perfil". **FA4 — Intento de eliminar el perfil principal:** FA4.1 El botón "Eliminar" no se muestra para el perfil en índice 0 (validación frontend). FA4.2 Si la petición llega al backend, el servidor valida por `usuario_id` y devuelve error apropiado. |
| **Reglas de negocio** | Únicamente el perfil administrador (primer perfil en orden alfabético, índice 0) tiene la capacidad de eliminar otros perfiles. El perfil principal nunca puede ser eliminado. La eliminación es permanente e irreversible. Se debe pedir confirmación explícita antes de ejecutar la eliminación. |
| **Reglas de calidad** | El botón "Eliminar" solo debe aparecer visible para perfiles secundarios (índice > 0). La confirmación debe mostrarse mediante diálogo modal antes de ejecutar. El sistema debe responder en menos de 2 segundos. La lista de perfiles debe actualizarse en tiempo real tras la eliminación exitosa. |

---

### Especificación CDU-N1-08 — Seleccionar Perfil

| Campo | Descripción |
|---|---|
| **Nombre** | Seleccionar Perfil |
| **Código** | CDU-N1-08 |
| **Actores** | Usuario Registrado, Usuario Suscriptor |
| **Descripción** | Permite al usuario autenticado elegir con cuál de sus perfiles desea navegar la plataforma. La selección establece el contexto de visualización y personalización. Este caso de uso es incluido por CDU-N1-02 (tras el login) y por CDU-N1-05 (tras crear un perfil). |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido. La cuenta debe tener al menos un perfil registrado. |
| **Post Condiciones** | El perfil seleccionado queda almacenado en `localStorage.selectedProfile` con `{id, nombre}`. El usuario es redirigido a la página de inicio de contenido (`/browse`). |
| **Flujo principal** | 1. El sistema carga la página del selector de perfiles (`/profiles`). 2. El sistema realiza GET a `/api/profiles` para obtener la lista de perfiles de la cuenta. 3. El sistema muestra visualmente todos los perfiles disponibles con nombre e inicial. 4. El usuario hace clic en el perfil de su elección. 5. El sistema almacena `{id, nombre}` del perfil seleccionado en `localStorage.selectedProfile`. 6. El sistema redirige al usuario a la página principal de contenido (`/browse`). |
| **Flujos alternos** | **FA1 — La cuenta no tiene perfiles:** FA1.1 El sistema detecta que la lista está vacía. FA1.2 El sistema redirige automáticamente a la creación del primer perfil. **FA2 — Error al cargar los perfiles (error de red):** FA2.1 El sistema muestra un mensaje de error. FA2.2 El usuario puede recargar la página para reintentar. **FA3 — JWT expirado al cargar el selector:** FA3.1 El API Gateway devuelve HTTP 401. FA3.2 El sistema redirige al usuario a `/login`. |
| **Reglas de negocio** | El perfil seleccionado se almacena en `localStorage`, no en el JWT; esto permite cambio de perfil sin necesidad de re-autenticación. El perfil administrador se identifica comparando `selectedProfile.id` con `allProfiles[0].id` (primer perfil en orden alfabético). Los perfiles se muestran ordenados alfabéticamente por nombre. |
| **Reglas de calidad** | El selector de perfiles debe cargarse en menos de 2 segundos. La lista de perfiles debe presentarse de forma visual e intuitiva (avatar con inicial y nombre). El selector debe ser accesible en todo momento desde la barra de navegación para cambiar de perfil. |

---

### Módulo 2: Gestión de Suscripciones

- CDU-N2-01: Adquirir Plan de Suscripción
- CDU-N2-02: Procesar Cobro Recurrente
- CDU-N2-03: Actualizar Plan de Suscripción
- CDU-N2-04: Cancelar Suscripción Activa

![Módulo 2](/-SA_PROYECTO_G4/assets/f2/suscripciones.png)  <br/><br/>

### Especificación CDU-N2-01 — Adquirir Plan de Suscripción

| Campo | Descripción |
|---|---|
| **Nombre** | Adquirir Plan de Suscripción |
| **Código** | CDU-N2-01 |
| **Actores** | Usuario Registrado |
| **Descripción** | Permite a un usuario autenticado sin suscripción activa seleccionar y contratar uno de los planes disponibles en QuetxalTV (Básico, Estándar o Premium). El precio del plan se presenta en la moneda local del usuario (mediante CDU-N5-01). La adquisición incluye el procesamiento del primer cobro (CDU-N2-02). |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido. El usuario no debe tener una suscripción activa previamente. Deben existir planes activos publicados en el sistema. |
| **Post Condiciones** | Suscripción creada con estado "Activa" y asociada al `usuario_id`. Primer cobro procesado mediante el Stored Procedure ACID. El usuario adquiere el rol efectivo de Usuario Suscriptor. Notificación de confirmación de suscripción encolada vía Outbox. |
| **Flujo principal** | 1. El Usuario Registrado accede a la sección de planes (`/account/plans`). 2. El sistema carga y muestra los planes disponibles con nombre, características y precio. 3. El sistema consulta CDU-N5-01 para mostrar el precio en moneda local del usuario. 4. El usuario compara los planes y selecciona el de su preferencia. 5. El usuario proporciona los datos del método de pago. 6. El usuario confirma la contratación. 7. El sistema ejecuta CDU-N2-02 (Procesar Cobro Recurrente). 8. El sistema registra la nueva suscripción activa vinculada al `usuario_id`. 9. El sistema encola la notificación de confirmación de suscripción (Outbox). 10. El sistema redirige al usuario a la página de cuenta (`/account`). |
| **Flujos alternos** | **FA1 — Pago rechazado:** FA1.1 El sistema recibe la respuesta de rechazo del cobro desde el Stored Procedure. FA1.2 La suscripción no se activa. FA1.3 El sistema muestra "El pago fue rechazado. Verifique los datos de su tarjeta." FA1.4 El usuario puede reintentar con otro método de pago. **FA2 — Usuario ya tiene suscripción activa:** FA2.1 El sistema redirige directamente a la gestión de plan (CDU-N2-04). **FA3 — No hay planes disponibles:** FA3.1 El sistema muestra mensaje informativo y permite contactar soporte. |
| **Reglas de negocio** | Solo los Usuarios Registrados sin suscripción activa pueden adquirir un nuevo plan. El precio mostrado al usuario debe incluir la conversión a moneda local (integración con Módulo 5 FX). El primer cobro se procesa inmediatamente al contratar. El cobro recurrente posterior se gestionará automáticamente en el ciclo de facturación. |
| **Reglas de calidad** | Los planes deben mostrarse con comparativa clara de características. El precio en moneda local debe actualizarse en tiempo real. El proceso de contratación no debe exceder 3 pasos desde la selección del plan hasta la confirmación. El sistema debe responder en menos de 5 segundos incluyendo el procesamiento del cobro. |

---

### Especificación CDU-N2-02 — Procesar Cobro Recurrente

| Campo | Descripción |
|---|---|
| **Nombre** | Procesar Cobro Recurrente |
| **Código** | CDU-N2-02 |
| **Actores** | Usuario Suscriptor |
| **Descripción** | Gestiona el procesamiento del cobro periódico de la suscripción activa del usuario, invocando obligatoriamente un Stored Procedure en base de datos para garantizar la atomicidad ACID de la transacción financiera. También es invocado por CDU-N2-01 para el primer cobro. |
| **Precondiciones** | El usuario debe tener una suscripción activa con método de pago válido registrado. El Stored Procedure de cobro debe estar creado en la base de datos del billing-service. |
| **Post Condiciones** | Cobro registrado en el historial de transacciones. Estado de suscripción actualizado (activa si cobro exitoso, suspendida si rechazado). Notificación de recibo encolada vía Outbox para envío asíncrono al correo del usuario. |
| **Flujo principal** | 1. El sistema (cron job o trigger de CDU-N2-01) detecta que debe procesarse un cobro. 2. El sistema recupera los datos del suscriptor y del plan activo. 3. El sistema invoca el Stored Procedure `procesar_cobro(usuario_id, plan_id, monto)` en la base de datos. 4. El Stored Procedure inicia una transacción ACID. 5. El Stored Procedure ejecuta la transacción financiera con los datos del método de pago registrado. 6. El motor de base de datos procesa la transacción y registra el resultado. 7. El Stored Procedure registra el resultado en la tabla de transacciones. 8. El Stored Procedure actualiza el estado de la suscripción según el resultado. 9. El Stored Procedure hace COMMIT de la transacción. 10. El sistema encola la notificación de recibo o de fallo de pago (Outbox). |
| **Flujos alternos** | **FA1 — Cobro rechazado:** FA1.1 El Stored Procedure registra el rechazo. FA1.2 La suscripción se marca como "Pago pendiente" o "Suspendida". FA1.3 El sistema encola notificación de fallo de pago al usuario. FA1.4 El usuario recibe email con instrucciones para actualizar su método de pago. **FA2 — Error en el procesamiento del cobro:** FA2.1 El Stored Procedure detecta el error. FA2.2 Hace ROLLBACK de la transacción. FA2.3 El sistema programa un reintento para más tarde. **FA3 — Error interno en el Stored Procedure:** FA3.1 Se ejecuta ROLLBACK automático. FA3.2 El sistema registra el error en logs. FA3.3 El estado de la suscripción no se modifica. |
| **Reglas de negocio** | El cobro SIEMPRE se procesa a través del Stored Procedure (nunca lógica ad-hoc en código de aplicación) para garantizar consistencia ACID. Si el cobro falla, la suscripción no se cancela automáticamente; el sistema permite un periodo de gracia. El historial de transacciones es inmutable; los registros no se eliminan, solo se marcan. |
| **Reglas de calidad** | La transacción financiera debe ser atómica: se cobra y se registra, o no se hace nada. El tiempo de respuesta del procesamiento no debe exceder 10 segundos. Todos los cobros deben quedar registrados con timestamp, monto, moneda y resultado. |

---

### Especificación CDU-N2-03 — Actualizar Plan de Suscripción

| Campo | Descripción |
|---|---|
| **Nombre** | Actualizar Plan de Suscripción |
| **Código** | CDU-N2-03 |
| **Actores** | Usuario Suscriptor |
| **Descripción** | Permite al Usuario Suscriptor cambiar su plan activo por uno de mayor (upgrade) o menor (downgrade) valor. Este caso de uso extiende a CDU-N2-01. El cambio de plan puede implicar un cobro prorrateado o un crédito según la política de facturación. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido. El usuario debe tener una suscripción activa. El nuevo plan seleccionado debe ser diferente al plan actual. |
| **Post Condiciones** | La suscripción queda asociada al nuevo plan. El historial de cambios de plan queda registrado. Se procesa el cobro diferencial si aplica. Notificación de cambio de plan encolada. |
| **Flujo principal** | 1. El Usuario Suscriptor accede a "Mi suscripción" o "Cambiar plan" desde la página de cuenta (`/account/plans`). 2. El sistema muestra los planes disponibles destacando el plan actualmente contratado. 3. El sistema muestra el precio en moneda local (CDU-N5-01). 4. El usuario selecciona el nuevo plan. 5. El sistema muestra un resumen del cambio (plan anterior, plan nuevo, diferencia de precio). 6. El usuario confirma el cambio. 7. El sistema invoca CDU-N2-02 para procesar el cobro ajustado si aplica. 8. El sistema actualiza la suscripción con el nuevo plan. 9. El sistema encola notificación de confirmación de cambio. 10. El sistema muestra confirmación del cambio exitoso. |
| **Flujos alternos** | **FA1 — El usuario selecciona el mismo plan actual:** FA1.1 El botón de confirmación permanece deshabilitado. FA1.2 El sistema no realiza ninguna acción. **FA2 — Fallo en el cobro del upgrade:** FA2.1 El sistema mantiene el plan anterior activo. FA2.2 Se muestra mensaje de error al usuario indicando el fallo del cobro. **FA3 — El usuario cancela el proceso:** FA3.1 No se realiza ningún cambio. FA3.2 El usuario regresa a la vista de cuenta. |
| **Reglas de negocio** | El cambio de plan es efectivo inmediatamente tras el cobro exitoso. El sistema debe mostrar claramente la diferencia de precio entre planes antes de confirmar. El cambio de plan se registra en el historial de la cuenta. Solo el perfil administrador puede cambiar el plan de suscripción. |
| **Reglas de calidad** | La pantalla de comparación de planes debe ser clara y mostrar las diferencias de características. El tiempo de respuesta no debe exceder 5 segundos. El proceso de cambio no debe requerir más de 3 interacciones del usuario. |

---

### Especificación CDU-N2-04 — Cancelar Suscripción Activa

| Campo | Descripción |
|---|---|
| **Nombre** | Cancelar Suscripción Activa |
| **Código** | CDU-N2-04 |
| **Actores** | Usuario Suscriptor |
| **Descripción** | Permite al Usuario Suscriptor cancelar su suscripción activa en QuetxalTV. La cancelación puede ser inmediata o al final del período facturado actual, según la política del sistema. El acceso a contenido se mantiene hasta el fin del período pagado. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido. El usuario debe tener una suscripción con estado "Activa". Solo el perfil administrador puede cancelar la suscripción. |
| **Post Condiciones** | La suscripción queda marcada como "Cancelada" o "Pendiente de cancelación". El cobro automático futuro queda desactivado. Notificación de cancelación encolada vía Outbox para envío al correo del usuario. |
| **Flujo principal** | 1. El Usuario Suscriptor accede a "Mi suscripción" desde la página de cuenta. 2. El sistema muestra la información de la suscripción activa y la opción "Cancelar suscripción". 3. El usuario selecciona "Cancelar suscripción". 4. El sistema muestra un diálogo de confirmación con información sobre cuándo finalizará el acceso. 5. El usuario confirma la cancelación. 6. El sistema actualiza el estado de la suscripción a "Cancelada". 7. El sistema desactiva el cobro automático recurrente. 8. El sistema encola la notificación de cancelación (Outbox). 9. El sistema muestra confirmación: "Tu suscripción ha sido cancelada. Tendrás acceso hasta [fecha fin del período]." |
| **Flujos alternos** | **FA1 — El usuario cancela el proceso de cancelación:** FA1.1 No se realiza ningún cambio. FA1.2 La suscripción permanece activa. **FA2 — La suscripción ya estaba en proceso de cancelación:** FA2.1 El sistema informa que la cancelación ya fue solicitada. FA2.2 Muestra la fecha en que el acceso terminará. **FA3 — Error al actualizar el estado:** FA3.1 El sistema devuelve error. FA3.2 La suscripción mantiene su estado anterior. FA3.3 Se recomienda al usuario contactar soporte. |
| **Reglas de negocio** | Solo el perfil administrador de la cuenta puede cancelar la suscripción. La cancelación no genera reembolso del período ya facturado. El acceso al contenido se mantiene hasta el fin del período pagado. La cancelación desactiva únicamente los cobros futuros. |
| **Reglas de calidad** | El diálogo de confirmación debe ser claro respecto a la fecha de fin de acceso. El sistema debe mostrar un mensaje de confirmación post-cancelación. La operación debe completarse en menos de 3 segundos. |

---

### Modulo 3: Catálogo y Consumo de Contenido

- CDU-N3-01: Explorar Cartelera de Contenido
- CDU-N3-02: Reproducir Contenido Multimedia
- CDU-N3-03: Consultar Ficha Técnica y Reparto
- CDU-N3-04: Gestionar Filtros

![Módulo 3](/-SA_PROYECTO_G4/assets/f2/catalogo.png)  <br/><br/>



---

### Especificación CDU-N3-01 — Explorar Cartelera de Contenido

| Campo | Descripción |
|---|---|
| **Nombre** | Explorar Cartelera de Contenido |
| **Código** | CDU-N3-01 |
| **Actores** | Usuario Registrado, Usuario Suscriptor |
| **Descripción** | Permite al usuario autenticado navegar y explorar el catálogo de contenido disponible en QuetxalTV (series y películas). La cartelera presenta las tarjetas de contenido organizadas por categorías y géneros. Es el punto de entrada para CDU-N3-03 (Ficha Técnica) y CDU-N3-04 (Filtros). |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido y un perfil seleccionado. El catálogo debe tener contenido disponible. |
| **Post Condiciones** | Se presenta al usuario la cartelera con el contenido disponible. El historial de navegación del perfil puede ser actualizado. |
| **Flujo principal** | 1. El usuario autenticado accede a la página principal de contenido (`/browse`) o a las secciones específicas (`/series`, `/movies`). 2. El sistema envía una petición al catalog-service mediante el API Gateway. 3. El catalog-service consulta el catálogo filtrando por tipo si se especificó (serie/película). 4. El sistema devuelve la lista de contenido con sus datos básicos (título, carátula, género, año). 5. El sistema presenta el contenido organizado en filas por categoría o género. 6. El usuario navega por la cartelera haciendo scroll o usando la barra de navegación. 7. El usuario puede seleccionar un título para ver su ficha técnica (CDU-N3-03) o reproducirlo (CDU-N3-02). |
| **Flujos alternos** | **FA1 — Catálogo vacío:** FA1.1 El sistema muestra un mensaje informativo indicando que no hay contenido disponible. **FA2 — Error al consultar el catalog-service:** FA2.1 El sistema muestra un mensaje de error genérico. FA2.2 Se ofrece la opción de recargar. **FA3 — JWT expirado:** FA3.1 El API Gateway devuelve HTTP 401. FA3.2 El sistema redirige al usuario a `/login`. |
| **Reglas de negocio** | Solo los usuarios autenticados (Registrados y Suscriptores) pueden explorar la cartelera. La reproducción del contenido (CDU-N3-02) requiere además suscripción activa. El catálogo se consulta en tiempo real desde el catalog-service (Python). |
| **Reglas de calidad** | La cartelera debe cargarse en menos de 3 segundos. Las tarjetas de contenido deben mostrar imagen de portada, título y género. La interfaz debe ser responsive y funcionar correctamente en dispositivos móviles. |

---

### Especificación CDU-N3-02 — Reproducir Contenido Multimedia

| Campo | Descripción |
|---|---|
| **Nombre** | Reproducir Contenido Multimedia |
| **Código** | CDU-N3-02 |
| **Actores** | Usuario Suscriptor |
| **Descripción** | Permite al Usuario Suscriptor iniciar la reproducción de una serie o película del catálogo. El sistema recupera el último timestamp registrado para el perfil activo (CDU-N6-01) y retoma la reproducción desde ese punto exacto. Al detener o pausar el video, el progreso se registra automáticamente. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido. El usuario debe tener una suscripción activa. El usuario debe tener un perfil seleccionado. El contenido solicitado debe existir en el catálogo. |
| **Post Condiciones** | El video comienza a reproducirse desde el punto donde fue detenido anteriormente (o desde el inicio si es la primera vez). El progreso de visualización queda registrado en el history-service mediante CDU-N6-01. |
| **Flujo principal** | 1. El Usuario Suscriptor selecciona un título desde la cartelera o desde la ficha técnica. 2. El sistema consulta al history-service el último timestamp registrado para el `perfil_id` activo y el `contenido_id`. 3. Si existe un registro previo, el sistema retoma la reproducción desde ese timestamp exacto. 4. Si no existe registro previo, la reproducción inicia desde el segundo 0. 5. El sistema inicia el streaming del contenido. 6. El usuario reproduce, pausa, retrocede o avanza el contenido. 7. Cada vez que el usuario pausa o a intervalos regulares, el sistema registra el timestamp actual (CDU-N6-01). 8. Al finalizar el contenido, el sistema registra el timestamp final y marca el contenido como completado. |
| **Flujos alternos** | **FA1 — El usuario no tiene suscripción activa:** FA1.1 El sistema detecta que el usuario es Registrado sin suscripción. FA1.2 El sistema redirige a la página de planes (`/account/plans`) con mensaje "Suscríbete para ver este contenido". **FA2 — Error al recuperar el historial:** FA2.1 El sistema reproduce desde el inicio (falla silenciosa). FA2.2 El progreso sigue registrándose normalmente. **FA3 — Error de streaming (contenido no disponible):** FA3.1 El sistema muestra un mensaje de error. FA3.2 Se ofrece al usuario regresar a la cartelera. |
| **Reglas de negocio** | La reproducción de contenido premium requiere suscripción activa sin excepción. El sistema debe reanudar la reproducción desde el segundo exacto donde el usuario la dejó (integración con CDU-N6-01). El registro del progreso no debe bloquear ni interrumpir la experiencia de reproducción. |
| **Reglas de calidad** | La reproducción debe iniciar en menos de 3 segundos tras la selección. El registro del timestamp de progreso no debe añadir latencia perceptible a la experiencia de reproducción. El reproductor debe funcionar correctamente en los principales navegadores modernos. |

---

### Especificación CDU-N3-03 — Consultar Ficha Técnica y Reparto

| Campo | Descripción |
|---|---|
| **Nombre** | Consultar Ficha Técnica y Reparto |
| **Código** | CDU-N3-03 |
| **Actores** | Usuario Registrado, Usuario Suscriptor |
| **Descripción** | Permite al usuario autenticado consultar la información detallada de un título del catálogo: título, sinopsis, año de estreno, género, elenco principal y porcentaje de recomendación global. El sistema consume una Vista Materializada SQL del catalog-service para optimizar los tiempos de lectura. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido y un perfil seleccionado. El contenido consultado debe existir en el catálogo. |
| **Post Condiciones** | Se presenta la ficha técnica completa del contenido. Si el usuario es Suscriptor, tiene acceso al botón de reproducción (CDU-N3-02). |
| **Flujo principal** | 1. El usuario selecciona un título desde la cartelera (CDU-N3-01) o desde resultados de búsqueda. 2. El sistema envía una petición al catalog-service: GET `/catalog/contenido/{id}/ficha`. 3. El catalog-service consulta la Vista Materializada `ficha_tecnica_mv` del contenido solicitado. 4. El sistema retorna los datos de la ficha: título, sinopsis, año, género, duración, elenco, calificación promedio y porcentaje de recomendación. 5. El sistema presenta la información en la página de detalle del contenido. 6. El usuario puede leer la sinopsis, ver el elenco y consultar las calificaciones. 7. Si el usuario es Suscriptor, puede presionar "Reproducir" para iniciar CDU-N3-02. |
| **Flujos alternos** | **FA1 — Contenido no encontrado:** FA1.1 El sistema devuelve HTTP 404. FA1.2 El sistema muestra mensaje "Contenido no disponible" y ofrece regresar a la cartelera. **FA2 — Error al consultar el catalog-service:** FA2.1 El sistema muestra un error genérico. FA2.2 Se ofrece al usuario recargar la página. |
| **Reglas de negocio** | La consulta de la ficha técnica utiliza la Vista Materializada SQL para optimizar el rendimiento de lectura. El porcentaje de recomendación se obtiene del rating-service mediante la función SQL nativa (CDU-N4-02). Tanto Usuarios Registrados como Suscriptores pueden consultar fichas técnicas, pero solo los Suscriptores pueden reproducir el contenido. |
| **Reglas de calidad** | La ficha técnica debe cargarse en menos de 2 segundos (gracias a la Vista Materializada). La información del elenco debe ser legible y presentarse de forma clara. La página debe mostrar el porcentaje de recomendación de forma visual (ej. barra de progreso o porcentaje). |

---

### Especificación CDU-N3-04 — Gestionar Filtros

| Campo | Descripción |
|---|---|
| **Nombre** | Gestionar Filtros |
| **Código** | CDU-N3-04 |
| **Actores** | Usuario Registrado, Usuario Suscriptor |
| **Descripción** | Permite al usuario autenticado aplicar filtros simultáneos de búsqueda multicriterio sobre la cartelera de contenido: por categoría, género, actor y tipo (serie o película). Este caso de uso extiende a CDU-N3-01. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido. El catálogo debe tener contenido disponible. |
| **Post Condiciones** | La cartelera muestra únicamente el contenido que cumple los criterios de filtro aplicados. Los filtros activos quedan visibles en la interfaz. |
| **Flujo principal** | 1. El usuario autenticado accede a la cartelera (CDU-N3-01) y activa el panel de búsqueda/filtros. 2. El sistema presenta las opciones de filtro disponibles: título (texto libre), categoría, género, actor y tipo. 3. El usuario ingresa o selecciona uno o más criterios de filtro simultáneamente. 4. El sistema envía la consulta al catalog-service: GET `/catalog/buscar?titulo=&categoria=&genero=&actor=`. 5. El catalog-service ejecuta la consulta `BuscarContenido` con los criterios recibidos. 6. El sistema aplica los filtros de forma combinada (AND lógico entre criterios). 7. El sistema devuelve los resultados filtrados. 8. La interfaz actualiza la cartelera con los resultados que cumplen los criterios. 9. Los filtros activos se muestran visualmente como chips/etiquetas. 10. El usuario puede remover filtros individuales o limpiar todos los filtros para volver a la cartelera completa. |
| **Flujos alternos** | **FA1 — No hay resultados para los criterios aplicados:** FA1.1 El sistema muestra "No se encontró contenido con los filtros aplicados". FA1.2 Se sugiere al usuario ampliar los criterios de búsqueda. **FA2 — Error al consultar el catalog-service:** FA2.1 El sistema muestra error genérico. FA2.2 Se ofrece limpiar filtros y recargar. |
| **Reglas de negocio** | Los filtros se aplican de forma combinada (multicriterio simultáneo). Cada criterio adicional reduce el conjunto de resultados (filtros AND). El usuario puede aplicar cualquier combinación válida de filtros. El filtro de título realiza búsqueda por subcadena (no requiere coincidencia exacta). |
| **Reglas de calidad** | Los resultados filtrados deben mostrarse en menos de 2 segundos. La interfaz debe mostrar visualmente los filtros activos en todo momento. El campo de búsqueda por título debe funcionar con búsqueda en tiempo real o al presionar Enter. |

---


### Modulo 4: Sistema de Calificaciones y Recomendaciones



- CDU-N4-01: Emitir/Actualizar Calificación
- CDU-N4-02: Consultar % de Recomendación
- CDU-N4-03: Consultar mi Calificación actual
- CDU-N4-04: Registrar en Bitácora de Auditoría (Trigger)

![Módulo 4](/-SA_PROYECTO_G4/assets/f2/calificaciones.png)  <br/><br/>



---

### Especificación CDU-N4-01 — Emitir/Actualizar Calificación

| Campo | Descripción |
|---|---|
| **Nombre** | Emitir/Actualizar Calificación |
| **Código** | CDU-N4-01 |
| **Actores** | Usuario Suscriptor |
| **Descripción** | Permite al Usuario Suscriptor calificar un título del catálogo mediante **estrella (1 a 5)** o **pulgar (positivo/negativo)**. La operación es un *upsert*: emitir y modificar son la **misma** operación (`INSERT ... ON CONFLICT (perfil_id, contenido_id) DO UPDATE` en el `rating-service`), con un único voto por par `(perfil_id, contenido_id)`. El RPC `Calificar` devuelve el % de recomendación recalculado mediante la función SQL nativa (CDU-N4-02). |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido y un perfil seleccionado. El usuario debe tener una suscripción activa. El contenido a calificar debe existir en el catálogo. |
| **Post Condiciones** | La calificación del usuario queda registrada o actualizada para el par `(perfil_id, contenido_id)`. El porcentaje de recomendación global del contenido se actualiza (o se recalcula al ser consultado). |
| **Flujo principal** | 1. El Usuario Suscriptor accede a la ficha técnica de un contenido (CDU-N3-03). 2. El sistema muestra el selector de calificación (1 a 5 estrellas) con la calificación previa del usuario si existe. 3. El usuario selecciona la cantidad de estrellas que desea asignar (1 a 5). 4. El usuario confirma su calificación. 5. El sistema envía la calificación al rating-service: POST/PUT `/rating/{contenido_id}` con el valor seleccionado. 6. El rating-service registra o actualiza la calificación asociada al `perfil_id` activo y al `contenido_id`. 7. El sistema devuelve HTTP 200/201 con la confirmación. 8. La interfaz actualiza visualmente la calificación del usuario y el porcentaje de recomendación global. |
| **Flujos alternos** | **FA1 — El usuario ya calificó ese contenido previamente:** FA1.1 El sistema actualiza la calificación existente en lugar de crear un duplicado. FA1.2 Se muestra la nueva calificación reflejada. **FA2 — Valor de calificación inválido (fuera de 1-5):** FA2.1 El frontend previene la selección de valores fuera del rango. FA2.2 El backend rechaza la petición con HTTP 400. **FA3 — Error al registrar la calificación:** FA3.1 El sistema muestra error genérico. FA3.2 La calificación del usuario no se modifica. |
| **Reglas de negocio** | La calificación es por perfil, no por cuenta de usuario (diferentes perfiles de la misma cuenta pueden calificar de forma independiente). Solo los Usuarios Suscriptores pueden emitir calificaciones. Un perfil puede calificar cada contenido solo una vez; las calificaciones subsecuentes actualizan la anterior. Los valores válidos son enteros del 1 al 5 inclusive. |
| **Reglas de calidad** | El selector de calificación debe ser intuitivo y visual (iconos de estrella). El cambio de calificación debe reflejarse en la interfaz en tiempo real. La operación de registro debe completarse en menos de 2 segundos. |

---

### Especificación CDU-N4-02 — Consultar % de Recomendación

| Campo | Descripción |
|---|---|
| **Nombre** | Consultar % de Recomendación |
| **Código** | CDU-N4-02 |
| **Actores** | Usuario Registrado, Usuario Suscriptor |
| **Descripción** | Permite a cualquier usuario autenticado consultar el porcentaje de recomendación global de un título, calculado a partir de todas las calificaciones emitidas por los usuarios de la plataforma. El cálculo se delega a una Función SQL nativa en el motor de base de datos del rating-service. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido. El contenido consultado debe existir en el catálogo. |
| **Post Condiciones** | Se presenta el porcentaje de recomendación global calculado para el contenido especificado. |
| **Flujo principal** | 1. El usuario accede a la ficha técnica de un contenido (CDU-N3-03). 2. El sistema solicita al rating-service el porcentaje de recomendación: GET `/rating/{contenido_id}/porcentaje`. 3. El rating-service invoca la función SQL nativa `calcular_porcentaje_recomendacion(contenido_id)`. 4. La función SQL calcula el promedio ponderado de calificaciones y lo convierte a porcentaje. 5. El rating-service devuelve el porcentaje calculado (0-100%). 6. El sistema muestra el porcentaje en la ficha técnica (ej. "87% de recomendación"). |
| **Flujos alternos** | **FA1 — El contenido no tiene calificaciones aún:** FA1.1 La función SQL devuelve NULL o 0. FA1.2 El sistema muestra "Sin calificaciones aún". **FA2 — Error al invocar el rating-service:** FA2.1 El campo de recomendación se oculta o muestra "No disponible". FA2.2 El resto de la ficha técnica se muestra normalmente (fallo aislado). |
| **Reglas de negocio** | El cálculo del porcentaje de recomendación se ejecuta obligatoriamente mediante una Función SQL nativa en el motor de base de datos (no en código de aplicación). El porcentaje es público y visible para todos los usuarios autenticados (Registrados y Suscriptores). El fallo del rating-service no debe impedir la visualización del resto de la ficha técnica. |
| **Reglas de calidad** | El porcentaje debe calcularse y mostrarse en menos de 1 segundo. La métrica debe presentarse de forma visual clara (porcentaje numérico y/o indicador gráfico). El servicio de calificaciones es resiliente: su fallo es aislado y no afecta al resto del sistema. |

---


### Especificación CDU-N4-03 — Consultar mi Calificación actual

| Campo | Descripción |
|---|---|
| **Nombre** | Consultar mi Calificación actual |
| **Código** | CDU-N4-03 |
| **Actores** | Usuario Suscriptor |
| **Descripción** | Permite al Usuario Suscriptor consultar la calificación que **él mismo** asignó a un contenido (tipo y valor), para que la interfaz pueda resaltarla. Implementado por el RPC `ObtenerCalificacionUsuario(perfil_id, contenido_id)` del `rating-service`, que lee la tabla `calificacion_usuario`. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido y un perfil seleccionado. El contenido consultado debe existir en el catálogo. |
| **Post Condiciones** | Se devuelve la calificación del perfil para ese contenido: `{existe, tipo, valor}` (o `existe=false` si el perfil aún no lo ha calificado). |
| **Flujo principal** | 1. El usuario abre la ficha técnica de un contenido (CDU-N3-03). 2. El sistema solicita al rating-service la calificación del perfil activo: `ObtenerCalificacionUsuario(perfil_id, contenido_id)`. 3. El rating-service consulta la tabla `calificacion_usuario` por el par `(perfil_id, contenido_id)`. 4. Si existe, retorna `{tipo, valor}`; si no, retorna `existe=false`. 5. La interfaz resalta la estrella/pulgar previamente seleccionado (o muestra el selector vacío). |
| **Flujos alternos** | **FA1 — El perfil aún no ha calificado el contenido:** FA1.1 El servicio devuelve `existe=false`. FA1.2 La UI muestra el selector sin resaltar. **FA2 — Error al invocar el rating-service:** FA2.1 El campo de calificación se muestra neutro. FA2.2 El resto de la ficha técnica se muestra normalmente (fallo aislado). |
| **Reglas de negocio** | La consulta es por `perfil_id`, no por cuenta: cada perfil ve su propia calificación. Es una operación de solo lectura. Mantiene la consistencia entre lo que el usuario emitió (CDU-N4-01) y lo que ve en la UI. |
| **Reglas de calidad** | La consulta debe completarse en menos de 1 segundo. El valor mostrado debe coincidir exactamente con la última calificación emitida por el perfil. |

---

### Especificación CDU-N4-04 — Registrar en Bitácora de Auditoría (Trigger) · *Fase 2*

| Campo | Descripción |
|---|---|
| **Nombre** | Registrar en Bitácora de Auditoría (Trigger) |
| **Código** | CDU-N4-04 |
| **Actores** | Sistema (Trigger de Base de Datos) |
| **Descripción** | Caso de uso transversal de Fase 2. Cada `INSERT`/`UPDATE` sobre la tabla `calificacion_usuario` (provocado por CDU-N4-01) **dispara automáticamente** un trigger que registra el evento en la tabla exclusiva de **bitácora de auditoría**: usuario responsable, timestamp exacto, tabla afectada, estado anterior y estado nuevo. Es incluido (`<<include>>`) por CDU-N4-01. |
| **Precondiciones** | Deben existir la tabla de bitácora de auditoría y el trigger asociado en `rating_db`. |
| **Post Condiciones** | Se crea un registro inmutable en la bitácora de auditoría con el cambio realizado. |
| **Flujo principal** | 1. CDU-N4-01 ejecuta el `INSERT`/`UPDATE` sobre `calificacion_usuario`. 2. El trigger de auditoría captura los valores `OLD` y `NEW` de la fila. 3. El trigger inserta una fila en la bitácora con `{usuario_responsable, timestamp, tabla, estado_anterior, estado_nuevo}`. 4. La transacción de calificación se confirma junto con su registro de auditoría. |
| **Flujos alternos** | **FA1 — La operación es un INSERT (primera calificación):** FA1.1 El `estado_anterior` se registra como nulo/vacío. **FA2 — Falla la escritura en la bitácora:** FA2.1 La transacción completa hace rollback (atomicidad): no hay cambio sin auditoría. |
| **Reglas de negocio** | La auditoría es **automática** mediante trigger; no es invocable por ningún actor humano. Aplica a toda operación transaccional (`INSERT`/`UPDATE`) sobre tablas relacionales. Los registros de auditoría son inmutables. |
| **Reglas de calidad** | El trigger no debe añadir latencia perceptible a la operación de calificación. La bitácora debe garantizar trazabilidad completa para auditorías contra fallas o fraudes. |

---


### Módulo 5: Servicio Financiero FX

- CDU-N5-01: Calcular Tarifa en Moneda Local
- CDU-N5-02: Consultar Tasa de Cambio Actual
- CDU-N5-03: Utilizar Tasa de Cambio de Respaldo


![Módulo 5](/-SA_PROYECTO_G4/assets/f2/servicio_fx.png)  <br/><br/>


---

### Especificación CDU-N5-01 — Calcular Tarifa en Moneda Local

| Campo | Descripción |
|---|---|
| **Nombre** | Calcular Tarifa en Moneda Local |
| **Código** | CDU-N5-01 |
| **Actores** | Usuario Registrado, Usuario Suscriptor |
| **Descripción** | Permite al sistema presentar el precio de los planes de suscripción convertido a la moneda local del usuario, consultando la tasa de cambio vigente mediante CDU-N5-02. El precio base está en dólares (USD) y se convierte a la moneda correspondiente según la geolocalización o preferencia del usuario. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido. Deben existir planes de suscripción activos. El servicio FX (fx-service) debe estar disponible. |
| **Post Condiciones** | El precio de cada plan se muestra en la moneda local del usuario. La tasa de cambio utilizada queda almacenada en caché Redis con TTL definido. |
| **Flujo principal** | 1. El usuario accede a la vista de planes de suscripción (`/account/plans`). 2. El sistema solicita al fx-service la conversión de precios: POST `/fx/convertir` con `{monto, moneda_destino}`. 3. El fx-service ejecuta CDU-N5-02 para obtener la tasa de cambio actual (desde Redis o desde la API externa). 4. El fx-service realiza el cálculo: `precio_local = precio_usd × tasa_de_cambio`. 5. El fx-service retorna el precio convertido y la moneda correspondiente. 6. El sistema presenta los precios de los planes en moneda local con el símbolo de moneda correspondiente. |
| **Flujos alternos** | **FA1 — API de Divisas externa no disponible y caché expirada:** FA1.1 El fx-service no puede obtener la tasa actualizada. FA1.2 El sistema muestra los precios en USD como fallback. FA1.3 Se indica al usuario que los precios están en dólares. **FA2 — Moneda local no soportada:** FA2.1 El sistema usa USD como moneda por defecto. |
| **Reglas de negocio** | Los precios base de los planes siempre se almacenan en USD. La conversión a moneda local es una capa de presentación y no altera el precio base. La tasa utilizada para cobro real es la vigente al momento del procesamiento del cargo (CDU-N2-02). |
| **Reglas de calidad** | La conversión de precios debe completarse en menos de 500ms (gracias al caché Redis). Los precios deben mostrarse con 2 decimales y el símbolo de la moneda correspondiente. El fallback a USD no debe interrumpir el flujo de adquisición de plan. |

---

### Especificación CDU-N5-02 — Consultar Tasa de Cambio Actual

| Campo | Descripción |
|---|---|
| **Nombre** | Consultar Tasa de Cambio Actual |
| **Código** | CDU-N5-02 |
| **Actores** | Usuario Registrado, Usuario Suscriptor, API de Divisas |
| **Descripción** | Permite al fx-service obtener la tasa de cambio vigente para un par de monedas determinado. El sistema consulta primero el caché Redis; si la tasa está disponible y no ha expirado (TTL vigente), la retorna directamente sin llamar a la API externa. Si el caché está vacío o expirado, consulta la API de Divisas externa y actualiza el caché. Este caso de uso es incluido por CDU-N5-01. |
| **Precondiciones** | El fx-service debe estar operativo. Debe existir conexión a Redis. La API de Divisas externa debe estar disponible (para el caso de caché expirado). |
| **Post Condiciones** | La tasa de cambio para el par de monedas solicitado es retornada al solicitante. Si se consultó la API externa, la tasa queda almacenada en Redis con su TTL configurado. |
| **Flujo principal** | 1. El fx-service recibe la solicitud de tasa de cambio para un par de monedas (ej. USD/GTQ). 2. El sistema consulta Redis para la clave `fx:{par_monedas}`. 3. Si la tasa existe en caché (TTL vigente), se retorna directamente desde Redis. 4. Si el caché está vacío o expirado, el sistema consulta la API de Divisas externa. 5. La API externa retorna la tasa de cambio actual. 6. El sistema almacena la tasa en Redis con el TTL configurado (ej. 1 hora). 7. El sistema retorna la tasa obtenida al solicitante (CDU-N5-01). |
| **Flujos alternos** | **FA1 — Tasa encontrada en caché Redis (ruta óptima):** FA1.1 El sistema retorna la tasa en menos de 50ms. FA1.2 No se realiza ninguna llamada a la API externa. **FA2 — API de Divisas externa no disponible:** FA2.1 El sistema no puede actualizar el caché. FA2.2 Si existe una tasa expirada en Redis, el sistema la retorna como fallback. FA2.3 Si no existe ninguna tasa, se retorna error al solicitante. FA2.4 El fx-service gestiona el fallback a USD. |
| **Reglas de negocio** | El caché Redis mitiga la latencia y reduce la dependencia de la API externa. El TTL del caché debe balancear frescura de datos vs. carga sobre la API externa. El sistema debe funcionar con un caché ligeramente expirado antes de fallar completamente (tolerancia a fallos). |
| **Reglas de calidad** | La consulta con caché activo debe completarse en menos de 50ms (EAC-01). La consulta a la API externa no debe superar los 3 segundos de timeout. El sistema debe registrar los tiempos de respuesta para monitoreo de SLA. |

---

### Especificación CDU-N5-03 — Utilizar Tasa de Cambio de Respaldo

| Campo | Descripción |
|---|---|
| **Nombre** | Utilizar Tasa de Cambio de Respaldo |
| **Código** | CDU-N5-03 |
| **Actores** | API de Divisas (FX) «Sistema Externo» |
| **Descripción** | Extiende (`<<extend>>`) a CDU-N5-02. Cuando la API de Divisas externa no está disponible o no devuelve la tasa, el `fx-service` usa como **respaldo** la última tasa almacenada en **PostgreSQL** (`_obtener_tasa_con_respaldo`). Garantiza la resiliencia del cálculo de precios ante fallos del proveedor externo. |
| **Precondiciones** | El caché Redis no tiene la tasa o está expirada, y la consulta al proveedor externo falló (`ProveedorFXNoDisponible` o `TasaNoEncontrada`). |
| **Post Condiciones** | Se retorna la tasa de respaldo obtenida de PostgreSQL. Si tampoco existe respaldo vigente, se retorna el error "No existe tasa externa ni tasa de respaldo vigente". |
| **Flujo principal** | 1. CDU-N5-02 no encuentra la tasa en Redis. 2. El fx-service intenta obtenerla del proveedor externo. 3. El proveedor falla o no la tiene. 4. El fx-service consulta `repo.obtener_tasa(origen, destino)` en PostgreSQL. 5. Si existe, retorna la tasa de respaldo (y se cachea). |
| **Flujos alternos** | **FA1 — No existe tasa de respaldo en PostgreSQL:** FA1.1 El servicio lanza `TasaNoEncontrada`. FA1.2 La capa superior gestiona el fallback (ej. mostrar precios en USD). |
| **Reglas de negocio** | El respaldo es un mecanismo interno de resiliencia, no invocable por un usuario. La prioridad de fuentes es: caché Redis → API externa → PostgreSQL (respaldo). |
| **Reglas de calidad** | El respaldo debe permitir seguir mostrando precios aunque la API externa esté caída. La conmutación a respaldo debe ser transparente para el usuario. |

---


### Módulo 6: Historial de Reproducción



- CDU-N6-01: Registrar Progreso de Visualización
- CDU-N6-02: Consultar Historial de Reproducción
- CDU-N6-03: Reanudar Reproducción

![Módulo 6](/-SA_PROYECTO_G4/assets/f2/historial.png)  <br/><br/>



---

### Especificación CDU-N6-01 — Registrar Progreso de Visualización

| Campo | Descripción |
|---|---|
| **Nombre** | Registrar Progreso de Visualización |
| **Código** | CDU-N6-01 |
| **Actores** | Usuario Suscriptor |
| **Descripción** | Registra en el history-service el timestamp exacto (temporada, episodio y segundo) en el que el Usuario Suscriptor detiene o pausa la reproducción de un contenido. Este dato es consumido por CDU-N3-02 para reanudar la reproducción en el punto exacto. El registro es asíncrono para no interrumpir la experiencia de visualización. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido y un perfil activo seleccionado. El usuario debe estar reproduciendo un contenido (CDU-N3-02 activo). |
| **Post Condiciones** | El timestamp de progreso queda registrado en el history-service para el par `(perfil_id, contenido_id)`. El registro es el más reciente disponible para reanudar la reproducción en la próxima sesión. |
| **Flujo principal** | 1. El Usuario Suscriptor pausa o detiene la reproducción de un contenido. 2. El reproductor captura el timestamp actual: `{contenido_id, temporada, episodio, segundo_actual}`. 3. El sistema envía de forma asíncrona una petición al history-service: POST `/history/progreso`. 4. El payload incluye `{perfil_id, contenido_id, temporada, episodio, segundo}`. 5. El history-service persiste el registro en su base de datos (HistoryDB). 6. En caso de que ya exista un registro para ese par `(perfil_id, contenido_id)`, el sistema lo actualiza con el nuevo timestamp. 7. El history-service retorna HTTP 200/201 de forma asíncrona. 8. La experiencia de visualización no se interrumpe por este proceso. |
| **Flujos alternos** | **FA1 — Error al registrar el progreso (error de red o servicio caído):** FA1.1 El error se captura silenciosamente. FA1.2 El reproductor continúa funcionando normalmente. FA1.3 El sistema puede reintentar el registro en el siguiente evento de pausa. **FA2 — El perfil_id no es válido:** FA2.1 El history-service rechaza la petición con HTTP 400. FA2.2 El fallo es silencioso para el usuario. **FA3 — Primera vez que el usuario reproduce el contenido:** FA3.1 No existe registro previo en la base de datos. FA3.2 El sistema crea un nuevo registro en lugar de actualizar uno existente. |
| **Reglas de negocio** | El registro del progreso es siempre por `perfil_id`, no por `usuario_id`, permitiendo que cada perfil de la cuenta tenga su propio historial independiente. El registro debe ejecutarse de forma asíncrona para garantizar que no bloquea ni afecta la experiencia de reproducción. El dato más reciente siempre sobrescribe al anterior para el mismo par `(perfil_id, contenido_id)`. El historial registra hasta nivel de episodio para contenido en serie. |
| **Reglas de calidad** | El registro del timestamp no debe añadir latencia perceptible a la experiencia de reproducción (EAC-02 — aislamiento de fallos). El sistema debe ser capaz de registrar de forma masiva y concurrente el progreso de múltiples usuarios simultáneos (el history-service en Go está diseñado para alta concurrencia). El tiempo de persistencia no debe superar 1 segundo. |

---

### Especificación CDU-N6-02 — Consultar Historial de Reproducción

| Campo | Descripción |
|---|---|
| **Nombre** | Consultar Historial de Reproducción |
| **Código** | CDU-N6-02 |
| **Actores** | Usuario Suscriptor |
| **Descripción** | Permite al Usuario Suscriptor consultar la lista de contenidos de su historial reciente ("Seguir viendo") con su porcentaje visto. Implementado por el RPC `GetHistory(perfil_id)` del `history-service`. |
| **Precondiciones** | El usuario debe tener sesión activa con JWT válido y un perfil seleccionado. |
| **Post Condiciones** | Se devuelve la lista de items del historial del perfil con su progreso (`segundo_exacto`, `duracion_total`, `porcentaje_visto`, `actualizado_en`). |
| **Flujo principal** | 1. El usuario accede a la sección "Seguir viendo" / su historial. 2. El sistema solicita al history-service: `GetHistory(perfil_id)`. 3. El history-service consulta su base de datos y retorna los items del perfil ordenados por más reciente. 4. El sistema cruza con el catalog-service para complementar (título, portada). 5. La interfaz presenta el historial con el progreso de cada contenido. |
| **Flujos alternos** | **FA1 — El perfil no tiene historial:** FA1.1 Se devuelve lista vacía. FA1.2 La UI muestra "Aún no has reproducido contenido". **FA2 — Error al invocar el history-service:** FA2.1 La sección se muestra vacía sin afectar el resto de la navegación (fallo aislado). |
| **Reglas de negocio** | El historial es por `perfil_id`, independiente entre perfiles de la misma cuenta. Es una operación de solo lectura. |
| **Reglas de calidad** | El historial debe cargarse en menos de 2 segundos. El progreso debe mostrarse de forma visual (barra de avance). |

---

### Especificación CDU-N6-03 — Reanudar Reproducción

| Campo | Descripción |
|---|---|
| **Nombre** | Reanudar Reproducción |
| **Código** | CDU-N6-03 |
| **Actores** | Usuario Suscriptor |
| **Descripción** | Permite obtener el punto exacto (temporada, episodio, segundo) donde el perfil dejó un contenido, para reanudar la reproducción desde ahí. Implementado por el RPC `GetResume(perfil_id, contenido_id)` del `history-service`; es consumido por la reproducción (CDU-N3-02). |
| **Precondiciones** | El usuario debe tener sesión activa con perfil seleccionado. Debe existir un registro de progreso previo para el par `(perfil_id, contenido_id)`. |
| **Post Condiciones** | Se devuelve el `HistoryItem` con el punto exacto de reanudación; la reproducción inicia desde ese timestamp. |
| **Flujo principal** | 1. El usuario selecciona un contenido para reproducir (CDU-N3-02). 2. El sistema solicita `GetResume(perfil_id, contenido_id)` al history-service. 3. El history-service retorna el último punto guardado (temporada, episodio, segundo_exacto). 4. El reproductor inicia desde ese punto exacto. |
| **Flujos alternos** | **FA1 — No existe progreso previo:** FA1.1 El history-service no retorna punto. FA1.2 La reproducción inicia desde el segundo 0. **FA2 — Error al invocar el history-service:** FA2.1 La reproducción inicia desde el inicio (fallo aislado, no bloquea). |
| **Reglas de negocio** | La reanudación es por `perfil_id`. El punto de reanudación corresponde al último progreso registrado por CDU-N6-01. |
| **Reglas de calidad** | La obtención del punto de reanudación no debe retrasar perceptiblemente el inicio de la reproducción (< 1 segundo). |

---



### Módulo 7: Notificaciones por Correo Electrónico

- CDU-N7-01: Encolar Notificación
- CDU-N7-02: Servir Correo Electrónico
- CDU-N7-03: Programar/Calendarizar Estreno


![Módulo 7](/-SA_PROYECTO_G4/assets/f2/notificaciones.png)  <br/><br/>


---

### Especificación CDU-N7-01 — Encolar Notificación

| Campo | Descripción |
|---|---|
| **Nombre** | Encolar Notificación |
| **Código** | CDU-N7-01 |
| **Actores** | Servicios Internos (Auth / Billing / Catálogo) |
| **Descripción** | Los **microservicios internos** (auth-service, billing-service, catalog-service) — **no el usuario** — invocan al `notification-service` vía gRPC `EncolarCorreo(usuario_id, tipo, destinatario, datos)` para encolar un correo transaccional (tipos `registro`, `recibo`, `nuevo_contenido`) usando el patrón **Outbox**. El envío efectivo lo realiza un worker en segundo plano (CDU-N7-02). El usuario es el *receptor*, no el iniciador. |
| **Precondiciones** | Debe haberse producido un evento de negocio que requiera notificación: registro de nuevo usuario, cobro procesado, o publicación de nuevo contenido. El notification-service debe estar operativo. El correo del destinatario debe ser válido y estar disponible en el payload del evento. |
| **Post Condiciones** | El mensaje de notificación queda encolado en la base de datos del notification-service (tabla Outbox) con estado "Pendiente". El proceso de despacho (CDU-N7-02) procesa la cola de forma asíncrona. |
| **Flujo principal** | 1. Un microservicio origen (auth-service o billing-service) produce un evento de negocio que requiere notificación. 2. El microservicio invoca al notification-service mediante gRPC: `EncolarCorreo(UsuarioId, Tipo, Destinatario, Datos)`. 3. El notification-service recibe la solicitud y crea un registro en su tabla Outbox con estado "Pendiente". 4. El notification-service devuelve confirmación de encolado al microservicio origen. 5. El notification-service desencadena CDU-N7-02 para procesar la cola de forma asíncrona. 6. Los tipos de notificación soportados son: `registro`, `cobro_exitoso`, `cobro_fallido`, `cancelacion`, `nuevo_contenido`. |
| **Flujos alternos** | **FA1 — El notification-service no está disponible:** FA1.1 El microservicio origen registra el fallo en logs. FA1.2 La operación de negocio principal (ej. registro de usuario) continúa y se completa exitosamente. FA1.3 La notificación se pierde en este escenario del MVP. **FA2 — Correo del destinatario no disponible:** FA2.1 El notification-service registra el evento sin destinatario. FA2.2 El evento queda en la Outbox pero el despacho fallará en CDU-N7-02. |
| **Reglas de negocio** | Las notificaciones se procesan de forma completamente asíncrona y desacoplada del hilo principal de negocio. El patrón Outbox garantiza que la notificación se intente enviar al menos una vez. El fallo del notification-service nunca debe impedir que las operaciones de negocio principales (registro, cobro) se completen. |
| **Reglas de calidad** | El encolado de la notificación debe completarse en menos de 500ms sin impactar el tiempo de respuesta de la operación de negocio principal. Los tipos de notificación deben estar documentados y versionados. El notification-service debe ser capaz de manejar picos de demanda sin bloquear a otros servicios. |

---

### Especificación CDU-N7-02 — Servir Correo Electrónico

| Campo | Descripción |
|---|---|
| **Nombre** | Servir Correo Electrónico |
| **Código** | CDU-N7-02 |
| **Actores** | Usuario Registrado, Usuario Suscriptor, Servidor SMTP |
| **Descripción** | El notification-service procesa la cola Outbox y despacha los correos electrónicos pendientes al servidor SMTP configurado. El proceso es completamente asíncrono y no bloquea ningún hilo de ejecución principal. Este caso de uso es incluido por CDU-N7-01. |
| **Precondiciones** | Deben existir notificaciones con estado "Pendiente" en la tabla Outbox del notification-service. El servidor SMTP debe ser alcanzable. Las credenciales SMTP deben estar configuradas en las variables de entorno del notification-service. |
| **Post Condiciones** | El correo electrónico es enviado exitosamente al destinatario. El registro en la tabla Outbox se actualiza a estado "Enviado" con timestamp de envío. Si el envío falla, el registro queda en estado "Fallido" con el detalle del error. |
| **Flujo principal** | 1. El notification-service detecta registros con estado "Pendiente" en la tabla Outbox (polling o trigger). 2. El sistema toma el siguiente registro pendiente y construye el mensaje de correo según el tipo de notificación. 3. El sistema aplica la plantilla HTML correspondiente al tipo: `registro`, `cobro_exitoso`, `cobro_fallido`, `cancelacion`, `nuevo_contenido`. 4. El sistema envía el correo al servidor SMTP externo con los campos: `From`, `To`, `Subject`, `Body (HTML)`. 5. El servidor SMTP procesa y entrega el correo al destinatario. 6. El notification-service actualiza el registro Outbox a estado "Enviado". 7. El sistema continúa procesando el siguiente registro pendiente en la cola. |
| **Flujos alternos** | **FA1 — Servidor SMTP no disponible (timeout):** FA1.1 El notification-service captura el error de conexión. FA1.2 El registro Outbox se actualiza a estado "Fallido" con el detalle del error. FA1.3 El sistema puede reintentar el envío en el siguiente ciclo de procesamiento. **FA2 — Dirección de correo del destinatario inválida:** FA2.1 El servidor SMTP rechaza el correo con error SMTP apropiado. FA2.2 El registro se marca como "Fallido". FA2.3 No se realizan más reintentos para este registro. **FA3 — Plantilla de correo no encontrada para el tipo indicado:** FA3.1 El sistema registra el error en logs. FA3.2 El registro Outbox se marca como "Fallido". |
| **Reglas de negocio** | El despacho de correos es estrictamente asíncrono y no bloquea ningún otro proceso del sistema. Cada registro Outbox se procesa una vez; los reintentos están controlados para evitar spam. El servidor SMTP y las credenciales se configuran exclusivamente mediante variables de entorno (nunca en código fuente). Los correos fallidos se registran con el error para análisis posterior. |
| **Reglas de calidad** | El despacho asíncrono no debe añadir latencia perceptible al flujo de negocio principal (EAC-02). Los correos deben seguir plantillas HTML estilizadas con la identidad visual de QuetxalTV. El tiempo entre el encolado y el envío efectivo no debe superar 60 segundos en condiciones normales. El sistema debe registrar métricas de tasa de entrega exitosa vs. fallida. |

---

### Especificación CDU-N7-03 — Programar/Calendarizar Estreno · *Fase 2*

| Campo | Descripción |
|---|---|
| **Nombre** | Programar/Calendarizar Estreno |
| **Código** | CDU-N7-03 |
| **Actores** | Administrador |
| **Descripción** | Caso de uso de Fase 2 que conecta el Panel de Administración con las notificaciones. El Administrador programa/calendariza el estreno de nuevo contenido; al activarse el estreno, el catalog-service **dispara** (`<<trigger>>`) la notificación de tipo `nuevo_contenido` (CDU-N7-01) hacia los usuarios. |
| **Precondiciones** | El usuario debe tener rol de Administrador y sesión activa. El contenido a estrenar debe estar cargado en el catálogo. |
| **Post Condiciones** | El estreno queda calendarizado; al cumplirse la fecha, se encola la notificación `nuevo_contenido` y el contenido pasa a estar visible en la cartelera. |
| **Flujo principal** | 1. El Administrador define la fecha/hora de estreno de un contenido desde el Panel de Administración. 2. El sistema registra el estreno programado (Trigger/Disparador). 3. Al cumplirse la fecha, el catalog-service invoca `EncolarCorreo(tipo=nuevo_contenido)` en el notification-service (CDU-N7-01). 4. El contenido se publica en la cartelera y los usuarios reciben la alerta de estreno. |
| **Flujos alternos** | **FA1 — El Administrador cancela o reprograma el estreno antes de la fecha:** FA1.1 Se actualiza/elimina el disparador programado. **FA2 — Usuario sin rol de Administrador:** FA2.1 El API Gateway rechaza con HTTP 403. |
| **Reglas de negocio** | Solo el Administrador puede programar estrenos. El disparo de la notificación `nuevo_contenido` es automático al activarse el estreno. La calendarización es parte del CRUD del catálogo (Fase 2). |
| **Reglas de calidad** | El estreno debe reflejarse en la cartelera y disparar las alertas de forma oportuna respecto a la fecha programada. |


---

## Módulo 8: Panel de Administrador

- CDU-N8-01: Iniciar Sesión como Administrador
- CDU-N8-02: Agregar Nuevo Contenido (Película/Serie)
- CDU-N8-03: Actualizar/Editar Metadatos
- CDU-N8-04: Eliminar Título
- CDU-N8-05: Programar/Calendarizar Estreno
- CDU-N8-06: Generar Reporte de Auditoría (CSV/PDF)

![Módulo 8](/-SA_PROYECTO_G4/assets/f2/admin.png)  <br/><br/>

---

### Especificación CDU-N8-01 — Iniciar Sesión como Administrador

| Campo | Descripción |
|---|---|
| **Nombre** | Iniciar Sesión como Administrador |
| **Código** | CDU-N8-01 |
| **Actores** | Administrador |
| **Descripción** | Permite al Administrador autenticarse en el Panel de Administración de Quetxal TV. |
| **Precondiciones** | El usuario debe tener credenciales de administrador válidas. |
| **Post Condiciones** | Sesión de administrador iniciada con un token de acceso válido. |
| **Flujo principal** | 1. El Administrador accede a la pantalla de login del panel. 2. Ingresa sus credenciales. 3. El sistema valida las credenciales y el rol de Administrador. 4. El sistema emite el JWT y redirige al dashboard. |
| **Flujos alternos** | **FA1 — Credenciales inválidas:** FA1.1 El sistema rechaza el acceso. FA1.2 Muestra mensaje de error. |
| **Reglas de negocio** | Solo los usuarios con rol explícito de 'Administrador' pueden acceder a este panel. |
| **Reglas de calidad** | El proceso de autenticación debe ser seguro y rápido (< 2 segundos). |

---

### Especificación CDU-N8-02 — Agregar Nuevo Contenido (Película/Serie)

| Campo | Descripción |
|---|---|
| **Nombre** | Agregar Nuevo Contenido (Película/Serie) |
| **Código** | CDU-N8-02 |
| **Actores** | Administrador |
| **Descripción** | Permite al Administrador agregar un nuevo título al catálogo. Involucra llenar un formulario con metadatos y subir archivos multimedia. |
| **Precondiciones** | Sesión activa como Administrador. Los archivos multimedia deben cumplir los formatos permitidos. |
| **Post Condiciones** | El nuevo contenido queda registrado en la base de datos y los archivos en GCS. |
| **Flujo principal** | 1. El Administrador llena el formulario de metadatos (título, sinopsis, etc.). 2. Sube archivo de video y portada. 3. El sistema guarda los metadatos en la base de datos (catalog-service). 4. El sistema guarda los archivos en Google Cloud Storage (GCS). |
| **Flujos alternos** | **FA1 — GCS Upload Fail:** FA1.1 El bucket rechaza el archivo por timeout o token HMAC inválido (Error 500). FA1.2 Se notifica al administrador del fallo en la subida. **FA2 — DB Timeout:** FA2.1 El microservicio catalog-service no responde. FA2.2 La operación falla. |
| **Reglas de negocio** | Todo contenido debe tener metadatos completos y archivos multimedia válidos. |
| **Reglas de calidad** | La subida de archivos debe ser resiliente y manejar archivos grandes sin bloquear el frontend. |

---

### Especificación CDU-N8-03 — Actualizar/Editar Metadatos

| Campo | Descripción |
|---|---|
| **Nombre** | Actualizar/Editar Metadatos |
| **Código** | CDU-N8-03 |
| **Actores** | Administrador |
| **Descripción** | Permite al Administrador modificar la información descriptiva de un título existente en el catálogo. |
| **Precondiciones** | Sesión activa como Administrador. El contenido debe existir. |
| **Post Condiciones** | Los metadatos del título se actualizan en la base de datos. |
| **Flujo principal** | 1. El Administrador busca y selecciona un contenido. 2. Modifica los campos necesarios en el formulario de edición. 3. Guarda los cambios. 4. El sistema actualiza la base de datos del catalog-service. |
| **Flujos alternos** | **FA1 — Datos inválidos:** FA1.1 El sistema detecta campos obligatorios faltantes o con formato incorrecto. FA1.2 Muestra error de validación. |
| **Reglas de negocio** | Las actualizaciones de metadatos deben reflejarse inmediatamente en el catálogo. |
| **Reglas de calidad** | El tiempo de actualización en base de datos debe ser < 2 segundos. |

---

### Especificación CDU-N8-04 — Eliminar Título

| Campo | Descripción |
|---|---|
| **Nombre** | Eliminar Título |
| **Código** | CDU-N8-04 |
| **Actores** | Administrador |
| **Descripción** | Permite al Administrador remover un título del catálogo. La eliminación ejecuta un borrado lógico (Soft-Delete) o físico con un trigger de auditoría. |
| **Precondiciones** | Sesión activa como Administrador. El contenido debe existir. |
| **Post Condiciones** | El contenido deja de estar disponible en el catálogo y se registra en la auditoría. |
| **Flujo principal** | 1. El Administrador selecciona un título y elige la opción de eliminar. 2. El Administrador confirma la eliminación. 3. El sistema ejecuta el Soft-Delete o borra los registros. 4. El sistema lanza el trigger de auditoría para registrar el cambio. |
| **Flujos alternos** | **FA1 — Restricción de Integridad:** FA1.1 Falla en la base de datos si hay historial atado sin borrado en cascada (Error 409). FA1.2 El sistema informa que no se puede eliminar el título. |
| **Reglas de negocio** | Se debe requerir confirmación antes de eliminar. La acción debe dejar rastro en la auditoría. |
| **Reglas de calidad** | La eliminación debe mantener la integridad referencial en todo momento. |

---

### Especificación CDU-N8-05 — Programar/Calendarizar Estreno

| Campo | Descripción |
|---|---|
| **Nombre** | Programar/Calendarizar Estreno |
| **Código** | CDU-N8-05 |
| **Actores** | Administrador |
| **Descripción** | Permite al Administrador establecer una fecha futura en la que un contenido oculto pasará a ser visible en el catálogo. |
| **Precondiciones** | Sesión activa como Administrador. El contenido debe estar en estado oculto o borrador. |
| **Post Condiciones** | El contenido queda en estado "Programado" y se hará visible en la fecha especificada. |
| **Flujo principal** | 1. El Administrador selecciona un contenido oculto. 2. Define la fecha y hora de visibilidad. 3. El sistema actualiza el estado a "Programado". 4. En la fecha definida, el sistema lo hace visible. |
| **Flujos alternos** | **FA1 — Validación Fallida:** FA1.1 La fecha definida es en el pasado o tiene formato inválido. FA1.2 El sistema rechaza la solicitud (Error 400). |
| **Reglas de negocio** | El contenido programado no debe ser visible para usuarios finales hasta alcanzar la fecha/hora exacta. |
| **Reglas de calidad** | El servicio encargado de publicar el contenido debe ser preciso y no tener desfases significativos. |

---

### Especificación CDU-N8-06 — Generar Reporte de Auditoría (CSV/PDF)

| Campo | Descripción |
|---|---|
| **Nombre** | Generar Reporte de Auditoría (CSV/PDF) |
| **Código** | CDU-N8-06 |
| **Actores** | Administrador |
| **Descripción** | Permite al Administrador generar y descargar un archivo (CSV o PDF) con el registro histórico de las acciones realizadas en el panel (ej. eliminaciones, ediciones). |
| **Precondiciones** | Sesión activa como Administrador. Deben existir registros de auditoría. |
| **Post Condiciones** | El administrador recibe un archivo con el reporte. |
| **Flujo principal** | 1. El Administrador define los filtros, como el rango de fechas. 2. El sistema consulta la tabla de auditoría en la base de datos. 3. El sistema genera el archivo en el formato seleccionado (.csv o PDF). 4. Se inicia la descarga del archivo. |
| **Flujos alternos** | **FA1 — Memory Limit:** FA1.1 La consulta es muy grande y sobrecarga el microservicio. FA1.2 El sistema debe paginar o abortar la operación notificando al Administrador. |
| **Reglas de negocio** | Solo el Administrador tiene permiso para generar y visualizar reportes de auditoría. |
| **Reglas de calidad** | La generación del reporte no debe afectar el rendimiento general del sistema. |



---

## **3\. Gobernanza y Entrelazamiento (Matrices de Trazabilidad)** {#3.-gobernanza-y-entrelazamiento-(matrices-de-trazabilidad)}


### 3.1 Matriz: Stakeholders vs. Requerimientos Funcionales {#3.1-matriz:-stakeholders-vs.-requerimientos-funcionales}

### Stakeholders

| ID | Stakeholder | Tipo |
|----|------------|------|
| ST-01 | Usuario Invitado | Usuario externo no autenticado |
| ST-02 | Usuario Registrado | Usuario autenticado sin suscripción activa |
| ST-03 | Usuario Suscriptor | Usuario autenticado con suscripción activa |
| ST-04 | Administrador | Operador interno de la plataforma; gestiona catálogo, estrenos y reportes desde el Panel de Administración (Fase 2) |
| ST-05 | API de Divisas (FX) | Sistema externo de tipo de cambio |
| ST-06 | Servidor SMTP | Infraestructura de correo transaccional |
| ST-07 | Juan Pablo (Auxiliar SA) | Autoridad de negocio / patrocinador del proyecto |
| ST-08 | Ingeniero SRE / Arquitecto | Responsable del diseño técnico y despliegue |

---

### Matriz: Stakeholders vs Requerimientos Funcionales

| Stakeholder | RF-01 | RF-02 | RF-03 | RF-04 | RF-05 | RF-06 | RF-07 | RF-08 | RF-09 | RF-10 | RF-11 | RF-12 | RF-13 | RF-14 | RF-15 | RF-16 | RF-17 |
|------------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|
| ST-01 Usuario Invitado | X | | | | | | | | | | | | | | | | |
| ST-02 Usuario Registrado | | X | | | X | | X | X | X | | X | X | | | | X | |
| ST-03 Usuario Suscriptor | | X | X | | X | X | X | X | X | X | X | X | | X | X | X | |
| ST-05 API de Divisas | | | | | | | | | | | | X | X | | | | |
| ST-06 Servidor SMTP | | | | | | | | | | | | | | | | X | X |
| ST-07 Juan Pablo (SA) | X | X | X | X | X | X | | X | X | | X | | X | X | X | | |
| ST-08 Ing. SRE / Arquitecto | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X |


### 3.2 Matriz: Requerimientos Funcionales vs. Casos de Uso {#3.2-matriz:-requerimientos-funcionales-vs.-casos-de-uso}


### Leyenda de Casos de Uso

| Código | Nombre |
|---------|---------|
| CDU - N1-01 | Registrar Usuario |
| CDU - N1-02 | Iniciar Sesión |
| CDU - N1-04 | Cerrar Sesión |
| CDU - N1-05 | Crear Perfil |
| CDU - N1-06 | Editar Perfil |
| CDU - N1-07 | Eliminar Perfil |
| CDU - N1-08 | Seleccionar Perfil |
| CDU - N2-01 | Adquirir Plan de Suscripción |
| CDU - N2-02 | Procesar Cobro Recurrente |
| CDU - N2-04 | Actualizar Plan de Suscripción |
| CDU - N2-05 | Cancelar Suscripción |
| CDU - N3-01 | Explorar Cartelera |
| CDU - N3-02 | Reproducir Contenido |
| CDU - N3-03 | Consultar Ficha Técnica |
| CDU - N3-04 | Gestionar Filtros |
| CDU - N4-01 | Emitir/Actualizar Calificación |
| CDU - N4-02 | Consultar % de Recomendación |
| CDU - N4-03 | Consultar mi Calificación actual |
| CDU - N4-04 | Registrar en Bitácora de Auditoría (Trigger) · Fase 2 |
| CDU - N5-01 | Calcular Tarifa Local |
| CDU - N5-02 | Consultar Tasa de Cambio |
| CDU - N5-03 | Utilizar Tasa de Cambio de Respaldo |
| CDU - N6-01 | Registrar Progreso |
| CDU - N6-02 | Consultar Historial de Reproducción |
| CDU - N6-03 | Reanudar Reproducción |
| CDU - N7-01 | Encolar Notificación |
| CDU - N7-02 | Servir Correo Electrónico |
| CDU - N7-03 | Programar/Calendarizar Estreno · Fase 2 |

----

### Matriz: Requerimientos Funcionales vs. Casos de Uso

| RF | CDU - N1-01 | CDU - N1-02 | CDU - N1-04 | CDU - N1-05 | CDU - N1-06 | CDU - N1-07 | CDU - N1-08 | CDU - N2-01 | CDU - N2-02 | CDU - N2-04 | CDU - N2-05 | CDU - N3-01 | CDU - N3-02 | CDU - N3-03 | CDU - N3-04 | CDU - N4-01 | CDU - N4-02 | CDU - N4-03 | CDU - N5-01 | CDU - N5-02 | CDU - N6-01 | CDU - N7-01 | CDU - N7-02 | CDU - N4-04 | CDU - N5-03 | CDU - N6-02 | CDU - N6-03 | CDU - N7-03 |
|-----|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------ | ------ | ------ | ------ | ------ | ------ |
| RF-01 Registro usuarios | X | | | | | | | | | | | | | | | | | | | | | | |  |  |  |  |  |
| RF-02 Login local + JWT | | X | X | | | | X | | | | | | | | | | | | | | | | |  |  |  |  |  |
| RF-03 Límite 5 perfiles | | | | X | | X | | | | | | | | | | | | | | | | | |  |  |  |  |  |
| RF-04 Trigger auditoría | X | | | | | | | | | | | | | | | | | | | | | | | X |  |  |  |  |
| RF-05 Despliegue planes | | | | | | | X | | X | | | | | | | | | | | | | | |  |  |  |  |  |
| RF-06 Cobro recurrente | | | | | | | | X | | | | | | | | | | | | | | | |  |  |  |  |  |
| RF-07 Autogestión suscripción | | | | | | | | | X | X | | | | | | | | | | | | | |  |  |  |  |  |
| RF-08 Búsqueda multicriterio | | | | | | | | | | | | X | | | X | | | | | | | | |  |  |  |  |  |
| RF-09 Ficha técnica | | | | | | | | | | | | | | X | | | | | | | | | |  |  |  |  |  |
| RF-10 Calificación contenido | | | | | | | | | | | | | | | | X | | | | | | | |  |  |  |  |  |
| RF-11 % Recomendación | | | | | | | | | | | | | | | | | X |  | | | | | |  |  |  |  |  |
| RF-12 Conversión moneda | | | | | | | X | | | | | | | | | | | | X | | | | |  |  |  |  |  |
| RF-13 Caché Redis FX | | | | | | | | | | | | | | | | | | | | X | | | |  | X |  |  |  |
| RF-14 Registro timestamp | | | | | | | | | | | | | X | | | | | | | | X | | |  |  | X |  |  |
| RF-15 Reanudación exacta | | | | | | | | | | | | | X | | | | | | | | | | |  |  |  | X |  |
| RF-16 Encolado notificaciones | | | | | | | | X | | | | | | | | | | | | | | X | |  |  |  |  | X |
| RF-17 Envío correo SMTP | | | | | | | | | | | | | | | | | | | | | | | X |  |  |  |  |  |


### 3.3 Matriz: Stakeholders vs. Casos de Uso {#3.3-matriz:-stakeholders-vs.-casos-de-uso}

### Matriz: Stakeholders vs. Casos de Uso


| Stakeholder | CDU - N1-01 | CDU - N1-02 | CDU - N1-04 | CDU - N1-05 | CDU - N1-06 | CDU - N1-07 | CDU - N1-08 | CDU - N2-01 | CDU - N2-02 | CDU - N2-04 | CDU - N2-05 | CDU - N3-01 | CDU - N3-02 | CDU - N3-03 | CDU - N3-04 | CDU - N4-01 | CDU - N4-02 | CDU - N4-03 | CDU - N5-01 | CDU - N5-02 | CDU - N6-01 | CDU - N7-01 | CDU - N7-02 | CDU - N4-04 | CDU - N5-03 | CDU - N6-02 | CDU - N6-03 | CDU - N7-03 |
|------------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|-------- | ------ | ------ | ------ | ------ | ------ |
| ST-01 Usuario Invitado | X | | | | | | | | | | | | | | | | | | | | | | |  |  |  |  |  |
| ST-02 Usuario Registrado | | X | X | | | | X | X | | | X | | X | X | | X | X |  | X | | X | | |  |  |  |  |  |
| ST-03 Usuario Suscriptor | | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | |  |  | X | X |  |
| ST-05 API de Divisas | | | | | | | | | | | | | | | | | | | X | X | | | |  | X |  |  |  |
| ST-06 Servidor SMTP | | | | | | | | | | | | | | | | | | | | | | X | X |  |  |  |  |  |
| ST-07 Juan Pablo (SA) | X | X | | X | | | | X | X | | X | X | X | | | X | | X | | | | X | |  |  |  |  |  |
| ST-08 Ing. SRE / Arquitecto | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X |

----

> **Nota (Fase 2):** Los requerimientos funcionales de Fase 2 se formalizaron como **RF-18 a RF-25** (§2.4.1) y los no funcionales como **EAC-04 y EAC-05** (§2.4.2). Se incorporó el stakeholder dedicado **Administrador (ST-04)** al catálogo (§2.2) y a las matrices (§3.1 y §3.5). La trazabilidad del Administrador y de los RF de Fase 2 con los casos de uso del Panel de Administración (`CDU-N8-01` a `CDU-N8-06`) y de estrenos (`CDU-N7-03`) se documenta en la **§3.5 Trazabilidad de Fase 2**.


### 3.4 Matriz: Requerimientos vs. Requerimientos (Dependencias de ejecución) {#3.4-matriz:-requerimientos-vs.-requerimientos-(dependencias-de-ejecución)}

### Matriz: Requerimientos vs. Requerimientos (Dependencias de ejecución)

| RF ↓ / RF → | RF-01 | RF-02 | RF-03 | RF-04 | RF-05 | RF-06 | RF-07 | RF-08 | RF-09 | RF-10 | RF-11 | RF-12 | RF-13 | RF-14 | RF-15 | RF-16 | RF-17 |
|-------------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|
| RF-01 Registro | — | | | | | | | | | | | | | | | | |
| RF-02 Login/JWT | X | — | | | | | | | | | | | | | | | |
| RF-03 Límite perfiles | | X | — | | | | | | | | | | | | | | |
| RF-04 Trigger auditoría | X | | | — | | | | | | | | | | | | | |
| RF-05 Planes suscripción | | X | | | — | | | | | | | | | | | | |
| RF-06 Cobro recurrente | | X | | | X | — | | | | | | | | | | | |
| RF-07 Autogestión suscripción | | X | | | X | X | — | | | | | | | | | | |
| RF-08 Búsqueda multicriterio | | X | | | | | | — | | | | | | | | | |
| RF-09 Ficha técnica | | X | | | | | | X | — | | | | | | | | |
| RF-10 Calificación | | X | | | | | | | | — | | | | | | | |
| RF-11 % Recomendación | | | | | | | | | X | | — | | | | | | |
| RF-12 Conversión moneda | | | | | X | | | | | | | — | X | | | | |
| RF-13 Caché Redis FX | | | | | | | | | | | | X | — | | | | |
| RF-14 Registro timestamp | | X | X | | | | | | | | | | | — | | | |
| RF-15 Reanudación exacta | | X | X | | | | | | | | | | | X | — | | |
| RF-16 Encolado notificaciones | | | | | X | | | | | | | | | | | — | |
| RF-17 Envío correo SMTP | | | | | | | | | | | | | | | | X | — |
----

### 3.5 Trazabilidad de Fase 2 (Administrador · RF-18+ · CDU-N8) {#3.5-trazabilidad-de-fase-2}

Esta sección formaliza las relaciones de Fase 2 que en la primera entrega quedaron pendientes: el stakeholder **Administrador (ST-04)**, los requerimientos **RF-18 a RF-25** y los casos de uso del Panel de Administración (**CDU-N8-01** a **CDU-N8-06**) y de estrenos (**CDU-N7-03**).

#### Matriz: Administrador (ST-04) vs. Casos de Uso de Fase 2

| Caso de Uso | Nombre | Administrador (ST-04) |
|---|---|:--:|
| CDU-N8-01 | Iniciar Sesión como Administrador | X |
| CDU-N8-02 | Agregar Nuevo Contenido (Película/Serie) | X |
| CDU-N8-03 | Actualizar/Editar Metadatos | X |
| CDU-N8-04 | Eliminar Título | X |
| CDU-N8-05 | Programar/Calendarizar Estreno | X |
| CDU-N8-06 | Generar Reporte de Auditoría (CSV/PDF) | X |
| CDU-N7-03 | Programar/Calendarizar Estreno (notificación) | X |

#### Matriz: Requerimientos de Fase 2 (RF-18..RF-25) vs. Casos de Uso

| RF | Descripción | Casos de Uso asociados |
|---|---|---|
| RF-18 | Panel de Administración protegido por rol | CDU-N8-01 |
| RF-19 | Agregar nuevo contenido | CDU-N8-02 |
| RF-20 | Actualizar/editar metadatos y portadas | CDU-N8-03 |
| RF-21 | Eliminar contenido (Soft-Delete + auditoría) | CDU-N8-04, CDU-N4-04 |
| RF-22 | Programar/calendarizar estreno | CDU-N8-05, CDU-N7-03 |
| RF-23 | Multimedia en GCS (URLs firmadas) | CDU-N3-02, CDU-N8-02 |
| RF-24 | Auditoría transaccional por triggers | CDU-N4-04, CDU-N8-04 |
| RF-25 | Reporte de auditoría exportable (.csv/PDF) | CDU-N8-06 |

## **4\. Fase 2: Espacio de la Solución Conceptual (Nivel PIM)** {#4.-fase-2:-espacio-de-la-solución-conceptual-(nivel-pim)}

<div align="center">
  <img src="../ProyectoSA-NoOficial/assets/Diagramas Proyecto 1-Vista 4+1.svg" alt="Modelo 4+1" width="900"/>
</div>


### **4.1 Vista de Escenarios (+1)** {#4.1-vista-de-escenarios-(+1)}

### Vista general
<div align="center">
  <img src="./docs/img/modelo4vistas/vista4+1.png" alt="Modelo 4+1" width="900"/>
</div>

### Vista Logica
<div align="center">
  <img src="./docs/img/modelo4vistas/vistaLogica.png" alt="Modelo 4+1" width="900"/>
</div>

### Administradir

<div align="center">
  <img src="./docs/img/modelo4vistas/admin.png" alt="Modelo 4+1" width="900"/>
</div>

### Invitador

<div align="center">
  <img src="./docs/img/modelo4vistas/invitado.png" alt="Modelo 4+1" width="900"/>
</div>

### Registrado

<div align="center">
  <img src="./docs/img/modelo4vistas/registrado.png" alt="Modelo 4+1" width="900"/>
</div>

### Suscriptor
<div align="center">
  <img src="./docs/img/modelo4vistas/suscriptor.png" alt="Modelo 4+1" width="900"/>
</div>

### Vista +1

<div align="center">
  <img src="./docs/img/modelo4vistas/v+1.png" alt="Modelo 4+1" width="900"/>
</div>

### Vista de Despliegue
<div align="center">
  <img src="./docs/img/modelo4vistas/despliegue.png" alt="Modelo 4+1" width="900"/>
</div>


*Casos de uso críticos que validan la arquitectura.*

![Vista de Escenarios +1](https://www.plantuml.com/plantuml/png/RLJDJXin4BxxAKRfeQ0AA9KGAeeYI0XKLQbI5j9Bf9Nn3el1iRV-2QHL7wOFmAcFa1VhsDaDcvGS8dlccvbllXdliVFS-Z1LC9Pqp2-uow-roOTEeEPM6iSKtdhm1gmixpmKqgBmqcZc7gIkkELJgBXuu2LcVguGeflhKc4B41mAxX1-CQ1Vd-2bDK4N0wECXJV3_RE3i-7IPso1jhQ__t1us3zDzXDhpMDZtZyu_DXdlndpqbF5n1mAX1VIiFLkV_i81jpHcJpNpi30Bfwz56GuiJ-2zCHpyLSdmzQtWFw9AxWQRpF6XQSodMiNOYx8WXDMLcJh07Un5zj0ChGpMT0fkxWQJNItcn4Ld78OFdcqslHwASHDVSNOIXZe3AbeZNof35i3On6ofeVjJgrN-ciax5nYIQ7Mm1vyCQNKC9_eSzHekP3KJ-psy_UhL9S7VxSUV8xEDwWHsbkfq2LePKswhCE7JnKfpYq9wHT_b2dDH6-DK2sUHL0KDGTIG6AaIZV1FIVCAvm7Pbh5D7jmYThCw5IBcYYdu9imprsuMOyRMIFG4Np4Ine4bi6QXYuvN5xn-GPZFLiyczZU9GfvOuXYNwAUePO5Nmu3TP6JybAzGZH3XKBGTiUUZVOnpDHXvF6vI4Q_7ZNcYhBRg7kSHhitEA77CbjMdYMOn_p-qM_gersO9jfZMM1KEVCM-LJg4WQdNvVwkiQq7amL0cN-IGG-qMOOAxcQw3cGUAL5jwH_bppp-6ZUaZIAnoOnlWq5zQApkDcmizDRxitgjbgDbQKPzChG38zodwbmdnffgy1g0EpkzjgpWoFeTgKMAXJOwx6s9o9VHhK1R3bY-UNxQjNUr9FLZEkixKd-btdD6V7jiMsWrrmfzsfg6sbNzeYgXx61OSVK5Ns9_m4=)

![Casos de Uso General](https://www.plantuml.com/plantuml/png/ZLJTJjim5BxtKnnbDzj5AzgjWqMe0agOUW6QLd6DBFkG7U7QqR7DXgOz5O_0Y-6aILlII2Dt_dwEFt-sSkQ3v13NHXYy3n0SC9M_0cXYL86S5Vw1R2LPhg6Iwa6Mk0fF1g6cfIqDxWcYHoKzmby1S9749RjezS8Pn_2XEBcQ5Tzgnh56Rj5fSNpvUPhGSsRtkmKd5xDYUYJ-xOsMAYHcSF1Ly_K7RsS42Ydkul8MYZ-Lj9gqos4oXk_e0xqyMz08vp6W3QIaQf0d-85yJmOzVBoXHpImM5v_4c8J8hlrKJ8vMDf72bAx3AG7QXTzqKyioGVkPBnTzeMhw1LJbR16wBTB8ThY8Rj-UTRHE9ZaiDHrOYrrrhJILP-bWuvk9gEZ9EcsviGsUpI3exhhGl2GSPfcMrAKR1vztKTdCwuaEsJvaiC2cGSTBeOXoonP69EZQfhk3Ah6XlHVSoXqAhXlm0OSSXmdXw4rsKDF2m-vJd9OeK6bqjC_CFeTanwMwAuSHgFvsrhxpAQvtTs_0wzxsxs1ZjZqSuYtDGmGtLd5Va0OZtVxGmwdfsILYHhdSx65MytUeG-LJPvtAJS9_oyLPsXr-X-z0W==)

----
### **4.2 Vista Lógica y Estilos Arquitectónicos** {#4.2-vista-lógica-y-estilos-arquitectónicos}


#### 4.2.1 Diagrama de Bloques de Alto Nivel:

<div align="center">
  <img src="./assets/DiagramaAltoNivelF2.svg" alt="" width="900"/>
</div>

#### 4.2.2 Frontera Lógica de Datos (Diagramas ER Desacoplados): {#4.2.2-frontera-lógica-de-datos-(diagramas-er-desacoplados):}

*Obligatorio: Un esquema por cada microservicio, sin llaves foráneas cruzadas y con Triggers/SPs modelados visualmente.*

Cada microservicio expone su propio esquema (patrón *Database per Microservice*, RES-02): **sin llaves foráneas físicas entre dominios** (las referencias cruzadas son lógicas, por `id`), y con sus **vistas, triggers, funciones y stored procedures** modelados (RES-04). A continuación, el ER de cada dominio por separado:

**Dominio 1 — Identidad (Go) · IdentityDB**

<p align="center"><img src="assets/er/er-1-identidad.png" width="860" alt="ER — Identidad"/></p>

**Dominio 2 — Suscripciones (TypeScript) · BillingDB**

<p align="center"><img src="assets/er/er-2-suscripciones.png" width="860" alt="ER — Suscripciones"/></p>

**Dominio 3 — Catálogo (Python) · CatalogDB**

<p align="center"><img src="assets/er/er-3-catalogo.png" width="860" alt="ER — Catálogo"/></p>

**Dominio 4 — Calificaciones (Python) · RatingsDB**

<p align="center"><img src="assets/er/er-4-calificaciones.png" width="860" alt="ER — Calificaciones"/></p>

**Dominio 5 — Servicio FX (Python) · FXDB + Redis**

<p align="center"><img src="assets/er/er-5-fx.png" width="860" alt="ER — Servicio FX"/></p>

**Dominio 6 — Historial (Go) · HistoryDB**

<p align="center"><img src="assets/er/er-6-historial.png" width="860" alt="ER — Historial"/></p>

**Dominio 7 — Notificaciones (TypeScript) · NotificationDB**

<p align="center"><img src="assets/er/er-7-notificaciones.png" width="860" alt="ER — Notificaciones"/></p>

### **4.3 Vista de Procesos** {#4.3-vista-de-procesos}

#### **4.3.1 Diagramas de Actividades:**  {#4.3.1-diagramas-de-actividades:}

Flujos de trabajo de los procesos de negocio.

**1. Registro y Pago:**
![1_registro_y_pago.puml](https://www.plantuml.com/plantuml/png/bLRTRYCr5BwVfpWI5qcaXNOB1JPpmIPfMegsgwZ9mcLruZcPcCxOaUr95IWFmmFq0l40IEJ5EBOdOJ9DbwMLsjG-lz_tdUE-jGwDgye2BYJc1aky6mWdrpB3ZEpTe7BBkmdcEd7I5RGtWeoWOGUVmotbqZgZJzxfNAfNyCDFirSmhQmmSYNazay56_21O62tJqeOhNIIs7kfLiW10KCmju5V4-2l8OhxtEXAPIDTQ0EVZR-zF1-_YNVQP6JgyxFnDnTVdeNpWJ7weJv-FJmVdvqclpKos0TP5gXebw4PvStOVpVEPqifxXLP2p7sp7T_gPNRnJ__-dpauoUFeqAISWJTI-x9aSfwZqa0DP4BwFxzruol2KJ5HWWceeGPVjS3joG5tVUwnodwroetP1bOTDfwU6jJdVhRiLfldn2iBgIGhihQ1e-3oJLSeQC7t3nwXrlAf94v0OBdyEI39GDJCcifA3hmwUwWzeYbGMKhD5835rSWpD6IpnRg2fu-b8MBOV0Q6TftfRrTxNqynnL3OT1uSO1Kt0eMqBtLHHyk3L4lZNKuRHG66xuM4TuqeO8BwKwtJnwkewWtK1JQ6D8iES6tXblO_e4l0bbunNuAYXy7SCXY_v_exNgDf6zWYNRfpLjLFy_r8nOyUI0CPQGyZ1IYHyMD6gSH2U7GjWJNoFxzR3Q1hqvVf-7u1MZP_gQY892IbCMVGr_4CsUY7nloxmEMzem7ChiZhPXEb6NKjowuOzlO4BtqiAws0a8EkKZYp-EJrnyK9GgglJq9Mc0nvO2OSuZ-b0eIGcescF0sy8MqbXGTKSZABoucnGTDEVE1JbXqZeoW5S_tYfpS1Lf7ZXRIn7qPVEkTeE-vD6PdlVsTZNHx6RIPWGyAMGBQo5yeIp-Y_o3ONOFuhx8zEGVKy22OodcReImAgVATl21qdzzEHkaUw9P9QDaFBymCiXH4xFYTHngwWz7r1JFPdnWj_2ZQGtWNlEahW_5FwP5JhF7-2Civ1sI1OHRso84RGYUyDjX96-Nu8UfVyRXbBpfkm3LAJ8_sCgdcJ3M7M3EY6ZgsceS8Za7yObKPmLD9MSUBwOPV1DOH30qJoBfF5jhSnwbv5ZT8cIKV-Jz0QiCRiq7msUbfFNgj_TFSGBpMLdx-i3KIdpAmeguYPdy6Ra1sFtkgedMS7lzkCaMYgAJP0ToP62fbLNQYVKOEnJB009YZLB6YGvpgQiPAw68FSwkA62vwlzTEBfWHJy1pF6rLqdznbHuidnKFkcDwCAxMy3BmfpcZnc5uHazuPEHSDsi8QJD-wgStiyc-WJ0RTGIceV7MxQ5W-7b1cfoIj_oH_x5A_W4=)

**2. Consumo de Video:**
![2_consumo_video.puml](https://www.plantuml.com/plantuml/png/XLNHRjis57tNLrna3xM15acQTiDiOAiZnqs7DGWI9tiCM8csxooH0aavTPT-p3uWJ_k00SkFxP2KLBbfDXimPFBUmyDppxrwOvqmhYuBch9O6b6AcqdcUCEvoAMzIRMoTQblhZcNEd7i2ja5KYwf5qilQ58xgHnd8kE7lnJzyjlyELsB0ljnOKiDdayDa3IuT4QAajLoc2HspQeIm2OHSDsM_aW8dsEHhPT6rofFTQ4DVNToD7ivcyOzRN9fclN3rz-_JW_2-iGOVTii7qnV_J0vJ3xtJh2tN1P2oVQ4FigF9_xRMv-lE5ihQIsz3AjpByHCAxTxxESakKiBXWQI1ZE3VQdouLqID4v6bxAGMSPQ2QeLLT8ikF1ArBOMXlKu6HtNDXEKXKJEeSwvB1xkixeGfEbI6fP3H9qRQGFAteMiZCxhZCqUra_Kvk5UaDK5P-pgt6FRLbwFwYio1iV9-JjwAvoy5TkxPFGEfvbCLaw04whNb6eJ2aSBDh7K8PSNDFZdxxbUIqKe-URXJmJfduVaLbWPdEaXz1bTIASD-9tEv-Vqwk2GhfIetKeR_YJpCIA-gL98pDcq6Wagz9ALZqT08WkB-Ck7-t34DSHOm6cK5e9B2uA5PuW0I6YuYhTu5lmfdWqzIEI-in-tlwB_-097DDFc0-Uv36oUv8_CzxM4v89AdOk2zjxBtpN-kPegc8syzMWZ3RH3SbVdlOZgRudV_Zs1UA9CxRmQQGXt-rt7U4TiE9CKohwyE4yRhNYHnD_axb4m2XwQi01cAPt8XTDHlareo2rTNVmQ_gVJCs-MvbYQ7jC-fI9RWPslayMLEw6-86q9bbp2ePg4DnQZFmQMINvat7auVeBJ8w3d3O-UWxVak8Hoegm8ucQn1eyDtVG1E5I-6i87jtKQFz6Yw08u7vR_v1DZLu6H9n1ryUspemnaB863-E9BIhGLfY7o4DZnnR4BRTQjks9m2pr8LxLQsoODuCFeXz5L70m8mqEW1ipEDJ4eXs3PAg2JM0fMOHLyf73XCI2b49ME3iZA9OQejgDkgn6hgWjKR70gCQa-87NeRzvLifiTRLRti2jzTrwS-g4Zjt1au-294iKM4yRkdy8CscnR0tmB-AkG7ZYwjf73iImhtQdlHsPeCSZKZ5SHOlyBVthSWtuBmS5x5VPWXrZ_HlrGt75FNxfTCLw8VghmilQHC9EcjfSmLzZsMld5JsVw_-P7M_9ArDOF_OobYHSAaEDs9lIAjc0LYRRbsZ46iD5KPYcJDtZ4Ypxv5m==)

#### **4.3.2 Diagramas de Secuencia:**  {#4.3.2-diagramas-de-secuencia:}

Intercambio dinámico de mensajes y sincronización.

**1. Usuario Invitado:**

<div align="center">
  <img src="./docs/img/modelo4vistas/invitado.png" alt="Modelo 4+1" width="900"/>
</div>

**2. Usuario Registrado:**

<div align="center">
  <img src="./docs/img/modelo4vistas/registrado.png" alt="Modelo 4+1" width="900"/>
</div>

**3. Usuario Suscriptor:**

<div align="center">
  <img src="./docs/img/modelo4vistas/suscriptor.png" alt="Modelo 4+1" width="900"/>
</div>

**4. Usuario Suscriptor:**
<div align="center">
  <img src="./docs/img/modelo4vistas/admin.png" alt="Modelo 4+1" width="900"/>
</div>

#### **4.3.3 Diagrama de flujo:**  {#4.3.3-diagrama-de-flujo:}
<div align="center">
  <img src="assets/Diagrama_flujo_CICD_QuetxalTV_Proyecto2.png" alt="Modelo 4+1" width="900"/>
</div>

## Justificación del diseño del pipeline CI/CD

El pipeline CI/CD de Quetxal TV fue diseñado para automatizar la validación, construcción y despliegue de la plataforma, reduciendo errores manuales y asegurando que cada cambio pase por controles antes de llegar a la nube.

En la fase de Integración Continua se separaron los jobs por tecnología: Go, TypeScript/NestJS y Python. Esto permite probar cada microservicio con sus propias herramientas y detectar con mayor facilidad en qué stack ocurre un error. Además, cada job ejecuta pruebas unitarias y valida una cobertura mínima del 75%, deteniendo el pipeline si no se cumple el umbral requerido.

Después de las pruebas, el pipeline construye y publica imágenes Docker para los servicios de la aplicación. Esto permite versionar cada componente y mantener trazabilidad entre el código, la imagen generada y el despliegue realizado.

El flujo de despliegue se divide por ramas. La rama `develop` despliega automáticamente hacia Google Compute Engine usando Docker Compose, funcionando como ambiente de integración en la nube. La rama `release` se orienta al despliegue en Google Kubernetes Engine, aplicando manifiestos de Kubernetes, estrategia RollingUpdate, health checks y rollback automático en caso de fallos.

El backup de bases de datos se maneja como un workflow separado y programado, ya que no es necesario generar respaldos en cada push. Este flujo respalda las bases PostgreSQL operacionales y excluye Redis por ser utilizado como caché.

También se separó el flujo de Build & Push Database/Cache y el Deploy Database. La construcción de imágenes de bases de datos solo publica imágenes actualizadas, mientras que el despliegue de bases se ejecuta de forma manual/controlada para evitar afectar volúmenes o datos persistentes.

Finalmente, el pipeline utiliza GitHub Secrets para proteger credenciales sensibles como tokens, llaves SSH, usuarios, contraseñas e información de conexión. Con esta estructura, el proceso queda organizado, seguro, trazable y alineado con una arquitectura de microservicios desplegada en la nube.


### **4.4 Vista de Desarrollo (Componentes)** {#4.4-vista-de-desarrollo-(componentes)}

#### **4.4.1 Diagrama de Componentes:**  {#4.4.1-diagrama-de-componentes:}

Decisión Arquitectónica: Se ha diseñado el modelo de componentes utilizando notación icónica estricta (interfaces provistas/requeridas) para garantizar el Entrelazamiento Arquitectónico de los contratos gRPC. Adicionalmente, por restricción estricta de la rúbrica de evaluación (Gobernanza de SA), este diagrama ha sido elevado a un Nivel PSM (Platform Specific Model).

Justificación de Gobernanza: Para dar cumplimiento a los Drivers de Restricción, el diagrama refleja de manera explícita el contenedor de alto nivel del proveedor cloud (Google Cloud Platform). Asimismo, cada componente de software incluye la etiqueta exacta de su asignación tecnológica:

1. Mapeo de contenedores Docker por cada microservicio.  
2. Distribución del ecosistema políglota (Go, TypeScript, Python).  
3. Inclusión del componente de Middleware JWT adherido al API Gateway en la Capa de Entrada.  
4. Definición explícita de los motores de persistencia, incluyendo PostgreSQL y la capa en memoria de Redis para el servicio financiero.

![Diagrama de Componentes](./assets/Diagramas%20Proyecto%201-Componentes%20PSM.drawio.png)

### **4.5 Análisis Estructural: Arquitectura Síncrona vs. Asíncrona** {#4.5-análisis-estructural:-arquitectura-síncrona-vs.-asíncrona}

La arquitectura **combina deliberadamente dos estilos de comunicación** según la naturaleza de cada interacción: gRPC síncrono cuando el usuario necesita una respuesta inmediata, y un patrón **Outbox transaccional** asíncrono cuando la acción puede diferirse y no debe bloquear el flujo principal.

#### Comunicación Síncrona (gRPC, *request-response*)

- **Dónde:** el **API Gateway** traduce cada petición HTTP/REST del cliente en una llamada **gRPC** (sobre HTTP/2, contratos `.proto`) al microservicio correspondiente; y hay llamadas **servicio-a-servicio**: `billing → fx` (`ConsultarTasa`/`ConvertirMonto`) para calcular el precio del plan en la moneda local (RF-12), y la validación del JWT (`auth.ValidarToken`) que el Gateway ejecuta **antes** de dejar pasar a una ruta protegida (EAC-03).
- **Cómo funciona:** es **bloqueante**: el llamador espera la respuesta. Da **consistencia inmediata** y un contrato fuertemente tipado.
- **Por qué aquí:** se usa donde el resultado se necesita **en el momento** para responderle al usuario: explorar/filtrar la cartelera y ver la ficha técnica, obtener la tasa de cambio para mostrar un precio, validar la sesión, o leer/guardar el progreso de reproducción.
- **Costo arquitectónico:** **acoplamiento temporal** — si el servicio destino está caído, la llamada falla; y en cadenas largas la latencia se acumula.

#### Comunicación Asíncrona (patrón *Transactional Outbox* + worker)

- **Dónde:** las **notificaciones por correo** (confirmación de registro y recibos de cobro — RF-16/RF-17).
- **Cómo funciona:** el servicio productor (auth en el registro, billing en el cobro) **no llama directo** al servicio de correo; en su lugar escribe el mensaje en la tabla **`buzon_salida` (Outbox)** dentro de la **misma transacción** del negocio (`sp_encolar_correo`). El `notification-service` corre un **worker** que consume la vista **`vista_buzon_pendiente` (cola FIFO)**, envía vía **SMTP** y aplica una **política de reintentos** (`fn_reintentar_envio` + trigger `trg_limitar_reintentos`: hasta 3 intentos, luego marca `'fallido'`). En el auth-service (Go) el encolado se dispara incluso en una goroutine *fire-and-forget*, para no bloquear el registro.
- **Por qué aquí:** enviar correo es **lento y poco fiable** (depende de un SMTP externo) y **no está en la ruta crítica**. El Outbox **desacopla**: el flujo principal hace *commit* aunque el correo aún no salga (**consistencia eventual**), y si el SMTP o el servicio de notificaciones está caído los mensajes **esperan en la cola y se reintentan** — esto es lo que sostiene el escenario **EAC-02 (disponibilidad / tolerancia a fallos)**.
- **Nota de diseño:** a diferencia de un broker dedicado (RabbitMQ/Kafka), aquí la cola es una **tabla en PostgreSQL** consultada por *polling*. Es una decisión coherente con las restricciones del proyecto (*Database per Microservice* y delegar lógica a la BD, RES-02/RES-04): cero infraestructura extra a cambio de una pequeña latencia de *polling*.

#### Comparativa

| Eje | Síncrono — **gRPC** | Asíncrono — **Outbox + worker** |
|---|---|---|
| Uso | Gateway↔servicios · `billing→fx` · `auth.ValidarToken` · catálogo/rating/historial | Notificaciones (registro, recibos) |
| Estilo | *Request-response* bloqueante | Encolar + procesar diferido (FIFO) |
| Acoplamiento | Temporal (el destino debe estar vivo) | Desacoplado (commit aunque notif. esté caído) |
| Consistencia | Inmediata / fuerte | Eventual |
| Tolerancia a fallos | Baja (la llamada falla si el destino cae) | Alta: reintentos y mensajes en espera (**EAC-02**) |
| Atributo dirigido | Rendimiento y simplicidad de lectura | Disponibilidad y desacople (RNF-01) |

**Conclusión:** el criterio de elección es la **criticidad temporal** de la operación. Lo que el usuario debe ver *ya* (catálogo, precio, sesión, progreso) va **síncrono por gRPC**; lo que puede ocurrir *después* sin frenar al usuario (correos) va **asíncrono por el Outbox**, ganando resiliencia y desacople a cambio de consistencia eventual.

## **5\. Fase 3: Espacio de la Solución Tecnológica (Nivel PSM e ISM)** {#5.-fase-3:-espacio-de-la-solución-tecnológica-(nivel-psm-e-ism)}

*Asignación física a la infraestructura en Google Cloud Platform y justificación de código.*

### **5.1 Vista Física (Despliegue)** {#5.1-vista-física-(despliegue)}

![Vista Física](./assets/Diagramas%20Proyecto%201-Diagrama%20de%20Despliegue.drawio.png)

![Diagrama de Despliegue Kubernetes](./assets/Diagramas_Proyecto_2_Despliegue_Kubernetes.drawio.png)
### **5.2 Justificación Tecnológica (Gobernanza)** {#5.2-justificación-tecnológica-(gobernanza)}

Esta seccion fundamenta las decisiones tomadas para la asignacion de recursos en el Nivel PSM (Modelo Especifico de la Plataforma) y el Nivel ISM (Modelo Especifico de Implementacion). Toda tecnologia seleccionada esta estrictamente subordinada a la resolucion de los Drivers Arquitectonicos (Requerimientos Funcionales, Escenarios de Calidad y Restricciones) definidos en la Fase 1\.

Ecosistema Backend Políglota (Go, Python, TypeScript) Que: Implementaremos una arquitectura de microservicios distribuida obligatoriamente en tres lenguajes de programación. Por que: El Driver de Restriccion RES-01 impone el uso de un ecosistema poliglota para el proyecto. Para que: Para asignar la herramienta mas eficiente a la naturaleza de cada dominio. Go manejara la alta concurrencia y el enrutamiento perimetral (Identidad, Historial y API Gateway) mediante el uso de Goroutines; Python procesara la logica relacional y de integracion (Catalogo, Calificaciones y FX); y TypeScript orquestara la asincronia (Suscripciones y Notificaciones) aprovechando su Event-Loop nativo.

Cache en Memoria con Redis para Servicio Financiero (FX) Que: Utilizaremos Redis como motor In-Memory de clave-valor con politicas de expiracion estricta (TTL). Por que: Consultar una API externa en cada transaccion de pago genera cuellos de botella que violan el Atributo de Calidad de Rendimiento (EAC-01). Para que: Para mitigar la latencia de red. Redis almacenara temporalmente la tasa de cambio en la memoria RAM, respondiendo a las peticiones del sistema en microsegundos. El TTL garantiza la consistencia eventual de los datos, forzando la actualizacion de la tarifa antes de que la informacion financiera quede obsoleta frente al mercado real.

Prohibicion de ORMs Magicos y Uso de SQL Nativo Que: Descartamos el uso de herramientas de autogeneracion o mapeo objeto-relacional (ORM) como Prisma o Supabase, utilizando en su lugar scripts SQL nativos y manuales. Por que: El Driver de Restriccion RES-03 y RES-04 exigen delegar la logica pesada y de auditoria directamente al motor de base de datos para garantizar la integridad, sin depender de la capa de codigo backend. Para que: Para poder implementar un Procedimiento Almacenado que blinde los cobros (Atomicidad ACID), un Trigger para la auditoria inmutable de credenciales, una Funcion matematica para recalcular calificaciones y una Vista Materializada para la cartelera. Esto centraliza la seguridad y el rendimiento en la capa de persistencia.

API Gateway como Punto de Entrada Unico (Go) Que: Se implementa un enrutador perimetral utilizando el ecosistema de Go. Por que: Exponer los microservicios directamente a internet viola el Atributo de Calidad de Seguridad (EAC-03) y acopla los clientes directamente a la red interna. Para que: Para centralizar la validacion de los tokens JWT, rechazar peticiones no autorizadas en la frontera de la Zona Desmilitarizada (DMZ) y actuar como un traductor de interoperabilidad que recibe peticiones HTTP/REST del cliente y las convierte en llamadas gRPC de alta velocidad para la comunicacion inter-servicios.

## 5.3 Toma y Justificación de Decisiones Técnicas

### 2.1 Lenguajes de Programación Utilizados
*   **¿Qué?**: Go, Python y TypeScript.
*   **¿Por qué?**: Go ofrece un rendimiento excepcional, tiempos de compilación bajos y un manejo nativo de concurrencia sumamente eficiente. Python destaca por su agilidad en el desarrollo y un rico ecosistema de librerías para manipulación de datos. TypeScript provee tipado estático robusto sobre JavaScript, previniendo errores en tiempo de ejecución.
*   **¿Para qué?**: Para cumplir de forma estricta con la restricción del backend políglota, delegando responsabilidades según la fortaleza de cada lenguaje: Go para servicios perimetrales de alta concurrencia, Python para la lógica de catálogos y evaluación, y TypeScript para el frontend y lógicas de dominio complejas.

### 2.2 Frameworks utilizados en el desarrollo
*   **¿Qué?**: Next.js (Frontend), NestJS (Backend TypeScript para billing), y librerías base gRPC (Go/Python).
*   **¿Por qué?**: Next.js permite renderizado del lado del servidor (SSR) optimizando la carga inicial del cliente. NestJS impone una arquitectura limpia y modular basada en decoradores e inyección de dependencias. Para Go y Python se optó por implementaciones puras de servidores gRPC sin frameworks web pesados (como FastAPI o Gin).
*   **¿Para qué?**: Para estandarizar el desarrollo de interfaces (Next.js), estructurar sólidamente el servicio de facturación asegurando mantenibilidad (NestJS), y garantizar comunicaciones internas de red con la menor latencia posible mediante el uso de Protocol Buffers y gRPC puro en el resto de la malla.

### 2.3 Mapeo de Aplicaciones por Microservicio
*   **¿Qué?**:
    *   **Go**: `api-gateway`, `auth-service`, `history-service`.
    *   **Python**: `catalog-service`, `fx-service`, `rating-service`.
    *   **TypeScript**: `billing-service` (NestJS), `notification-service` (Node.js), `frontend` (Next.js).
*   **¿Por qué?**: Se asignó Go a la puerta de enlace (API Gateway) y autenticación por su rapidez manejando miles de peticiones y enrutamiento seguro. Python se usó en el catálogo, reviews y conversiones de moneda por su agilidad transaccional. TypeScript se asignó a pagos y notificaciones para mantener coherencia de ecosistema y tipado fuerte en dominios sensibles.
*   **¿Para qué?**: Para distribuir la carga cognitiva del desarrollo en el equipo y asegurar que cada dominio del negocio se resuelva de manera desacoplada con la pila tecnológica óptima.

### 2.4 Herramienta de Automatización CI/CD
*   **¿Qué?**: GitHub Actions.
*   **¿Por qué?**: Está integrado de forma nativa en el control de versiones del repositorio, provee "Runners" administrados que no requieren infraestructura on-premise, y su configuración declarativa mediante YAML facilita la creación condicional de pipelines.
*   **¿Para qué?**: Para orquestar la compilación automatizada de imágenes, ejecutar pruebas unitarias con un umbral de cortocircuito crítico del 75%, y bifurcar lógicamente el despliegue automático: hacia Google Compute Engine (VMs) al impactar la rama `develop`, y hacia Google Kubernetes Engine al impactar la rama `release`.

### 2.5 Ecosistema de Base de Datos
*   **¿Qué?**: PostgreSQL (Base de datos relacional) y Redis (Caché en memoria).
*   **¿Por qué?**: PostgreSQL es un motor robusto, maduro y estrictamente transaccional (ACID) que soporta la programación de Procedimientos Almacenados y Triggers, siendo un requerimiento obligatorio de la rúbrica para la tabla de auditoría. Redis es un almacén clave-valor extremadamente rápido.
*   **¿Para qué?**: PostgreSQL gestiona la persistencia bajo el patrón "Database per Microservice" aislando la data de cada dominio de negocio. Redis se utiliza específicamente para cachear los tipos de cambio (evitando saturar APIs externas en el `fx-service`) y acelerar consultas recurrentes.

### 2.6 Servicios de Nubes Utilizados
*   **¿Qué?**: Infraestructura de Google Cloud Platform (GCP) incluyendo GKE, Compute Engine y Google Cloud Storage (GCS).
*   **¿Por qué?**: GCP provee un ecosistema altamente interoperable. GKE ofrece el estándar de la industria para orquestación nativa de Kubernetes. Cloud Storage es un servicio gestionado para blobs escalable y rentable.
*   **¿Para qué?**: Google Compute Engine provee la flexibilidad de máquinas virtuales para las pruebas en `develop`. GKE orquesta la topología de producción (`release`) garantizando alta disponibilidad con estrategias de Rollout y Health Checks. Finalmente, GCS abstrae y almacena la multimedia pesada (videos y portadas) entregando el contenido directamente al frontend mediante URLs firmadas/públicas.

### 2.7 Mecanismos de Seguridad (Autenticación y Autorización)
*   **¿Qué?**: JSON Web Tokens (JWT) a nivel lógico y ConfigMaps/Secrets a nivel de infraestructura.
*   **¿Por qué?**: JWT provee autenticación "Stateless" (sin estado), ideal para sistemas distribuidos ya que no satura una base de datos centralizada validando cada petición. Los Secrets de Kubernetes cifran la información en etcd.
*   **¿Para qué?**: JWT se utiliza para afirmar la identidad del usuario en el API Gateway y propagar dichos claims firmados hacia la red interna de microservicios. Adicionalmente, se prohibió el hardcoding; por lo tanto, los ConfigMaps inyectan la configuración genérica, mientras que los Secrets de K8s resguardan y montan de forma segura las credenciales de BD y llaves privadas en tiempo de ejecución de los Pods.


### 5.4 Manifiestos y Estrategias Operativas de Kubernetes
---

## 8. Manifiestos y Configuraciones de Objetos de Kubernetes

Los objetos de Kubernetes se organizaron en manifiestos declarativos YAML para separar infraestructura base, bases de datos, microservicios, API Gateway e Ingress. Esta organización permite que el pipeline de CD despliegue el entorno de producción de forma repetible, controlada y versionada.

### 8.1 Deployments: Réplicas y Alta Disponibilidad

* **Dónde se aplicó**: Manifiestos de Deployments en `k8s/microservices/*.yaml`, `k8s/databases/*.yaml` y `k8s/api-gateway.yaml`.

* **Cómo se aplicó**: Cada microservicio principal se definió como un objeto `Deployment`, indicando el número de réplicas, la imagen del contenedor, puertos internos, variables de entorno, recursos de CPU/memoria y sondas de salud. En los microservicios y frontend se configuraron `replicas: 2`, permitiendo que existan dos instancias activas del mismo componente.

Estructura base aplicada en los manifiestos:

    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: auth-service
      namespace: quetxal-tv-prod
      labels:
        app: auth-service
    spec:
      replicas: 2
      selector:
        matchLabels:
          app: auth-service
      template:
        metadata:
          labels:
            app: auth-service
        spec:
          containers:
          - name: auth-service
            image: tu-registro/quetxal-auth-service:latest
            ports:
            - containerPort: 50051
              name: grpc
            envFrom:
            - configMapRef:
                name: quetxal-config
            env:
            - name: AUTH_DB_NAME
              valueFrom:
                secretKeyRef:
                  name: quetxal-secrets
                  key: AUTH_DB_NAME

* **Por qué se aplicó**: El uso de Deployments permite administrar el ciclo de vida de los Pods de forma declarativa. Kubernetes puede crear, reemplazar o reiniciar Pods automáticamente según el estado deseado. Al usar `replicas: 2`, la malla de servicios mantiene alta disponibilidad, ya que si una instancia falla, otra puede continuar atendiendo solicitudes mientras Kubernetes recupera la réplica perdida.

### 8.2 Services: ClusterIP vs. NodePort vs. LoadBalancer

* **Dónde se aplicó**: Objetos `Service` definidos en los manifiestos de `k8s/microservices/*.yaml`, `k8s/databases/*.yaml` y `k8s/api-gateway.yaml`.

* **Cómo se aplicó**: Los servicios internos del clúster se declararon como `ClusterIP`. Este tipo de Service permite descubrimiento interno entre componentes sin exponer cada microservicio directamente a internet.

Estructura base aplicada en los manifiestos:

    apiVersion: v1
    kind: Service
    metadata:
      name: auth-service
      namespace: quetxal-tv-prod
    spec:
      type: ClusterIP
      selector:
        app: auth-service
      ports:
      - port: 50051
        targetPort: 50051

En el proyecto se usa `ClusterIP` para servicios gRPC como `auth-service`, `billing-service`, `catalog-service`, `fx-service`, `history-service` y `notification-service`. También se usa `ClusterIP` para bases de datos PostgreSQL, Redis y el `api-gateway`.

* **Por qué se aplicó**: Se eligió `ClusterIP` porque los microservicios, bases de datos y caché no deben exponerse públicamente. El acceso externo se concentra mediante el recurso `Ingress`, definido en `k8s/ingress.yaml`, que enruta el tráfico hacia los servicios correspondientes. Esta decisión evita usar `NodePort` o `LoadBalancer` por componente, reduciendo superficie de ataque y manteniendo la comunicación interna controlada dentro del namespace `quetxal-tv-prod`.

### 8.3 ConfigMaps y Secrets: Abstracción y Seguridad

* **Dónde se aplicó**: Manifiestos base en `k8s/base/configmap.yaml` y `k8s/base/secrets.yaml`, con referencias desde los Deployments de microservicios, bases de datos y API Gateway.

* **Cómo se aplicó**: Las variables no sensibles se gestionan mediante `ConfigMap`, mientras que credenciales, contraseñas, secretos JWT, datos SMTP, Redis y accesos a Google Cloud Storage se gestionan mediante un `Secret` de tipo `Opaque`.

Estructura base de ConfigMap:

    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: quetxal-config
      namespace: quetxal-tv-prod
    data:
      AUTH_SERVICE_ADDR: "auth-service:50051"
      BILLING_SERVICE_ADDR: "billing-service:50052"
      FX_SERVICE_ADDR: "fx-service:50053"
      NOTIFICATION_SERVICE_ADDR: "notification-service:50054"
      CATALOG_SERVICE_ADDR: "catalog-service:50055"
      HISTORY_SERVICE_ADDR: "history-service:50057"

Estructura base de Secret sin credenciales explícitas:

    apiVersion: v1
    kind: Secret
    metadata:
      name: quetxal-secrets
      namespace: quetxal-tv-prod
    type: Opaque
    stringData:
      AUTH_DB_NAME: "${AUTH_DB_NAME}"
      AUTH_DB_USER: "${AUTH_DB_USER}"
      AUTH_DB_PASSWORD: "${AUTH_DB_PASSWORD}"
      JWT_SECRET: "${JWT_SECRET}"
      REDIS_PASSWORD: "${REDIS_PASSWORD}"
      GCS_ACCESS_KEY: "${GCS_ACCESS_KEY}"
      GCS_SECRET_KEY: "${GCS_SECRET_KEY}"
      GCS_BUCKET_NAME: "${GCS_BUCKET_NAME}"

Durante el pipeline de CD, GitHub Actions toma los secretos almacenados en el repositorio y genera temporalmente `k8s/base/secrets-injected.yaml` mediante `envsubst`. Luego aplica ese manifiesto al clúster con `kubectl apply`.

* **Por qué se aplicó**: Esta estrategia cumple con la restricción de no escribir credenciales directamente en los YAML. Además, permite cambiar credenciales o endpoints sin modificar el código fuente de los microservicios. Kubernetes inyecta los valores en tiempo de ejecución usando `configMapRef` y `secretKeyRef`.

---

## 9. Estrategia Operativa de Despliegue Zero-Downtime

La estrategia de despliegue busca que las nuevas versiones de Quetxal TV puedan publicarse sin interrumpir el acceso de los usuarios al frontend, catálogo, autenticación, historial, pagos, calificaciones y servicios internos.

### 9.1 Rollout Estándar y Estrategia RollingUpdate

* **Dónde se aplicó**: Bloque `strategy.rollingUpdate` en los Deployments ubicados en `k8s/microservices/*.yaml` y `k8s/api-gateway.yaml`.

* **Cómo se aplicó**: Los microservicios y el frontend usan `replicas: 2` junto con la estrategia `RollingUpdate`.

Estructura base aplicada:

    strategy:
      type: RollingUpdate
      rollingUpdate:
        maxSurge: 1
        maxUnavailable: 0

Matemáticamente, para los microservicios con `replicas: 2`:

* `maxSurge: 1`: Kubernetes puede crear temporalmente 1 Pod adicional por encima del número deseado de réplicas. Es decir, durante el despliegue pueden existir hasta 3 Pods: 2 antiguos estables y 1 nuevo en proceso de arranque.
* `maxUnavailable: 0`: Kubernetes no puede dejar indisponible ningún Pod durante la actualización. Un Pod antiguo solo puede ser reemplazado cuando el nuevo Pod ya pasó su `readinessProbe` y está en estado `Ready`.

Flujo operativo del RollingUpdate:

* Estado inicial: 2 Pods estables ejecutando la versión anterior.
* Kubernetes crea 1 Pod adicional con la nueva versión.
* El nuevo Pod debe pasar su `readinessProbe`.
* Cuando el nuevo Pod está `Ready`, Kubernetes puede retirar 1 Pod antiguo.
* El proceso se repite hasta que todos los Pods ejecutan la nueva versión.

En el caso del `api-gateway`, el manifiesto usa porcentajes:

    strategy:
      type: RollingUpdate
      rollingUpdate:
        maxSurge: 25%
        maxUnavailable: 25%

Con `replicas: 2`, Kubernetes redondea `maxSurge` hacia arriba y `maxUnavailable` hacia abajo. Por ello, operativamente puede crear 1 Pod adicional y mantener 0 Pods indisponibles durante el despliegue.

* **Por qué se aplicó**: Esta configuración permite despliegues progresivos sin apagar completamente el servicio. Para Quetxal TV, esto garantiza que los usuarios puedan seguir navegando el catálogo, autenticándose y consumiendo contenido multimedia mientras se reemplazan gradualmente los Pods de la versión anterior por los de la nueva versión.

### 9.2 Rollback Automatizado

* **Dónde se aplicó**: Pipeline de despliegue en `.github/workflows/deploy-k8s.yml`.

* **Cómo se aplicó**: Después de aplicar los manifiestos con `kubectl apply`, el pipeline ejecuta una verificación del estado del rollout con:

    kubectl rollout status deployment/$SERVICE -n quetxal-tv-prod --timeout=60s

El arreglo `SERVICES` definido en el workflow contiene los Deployments principales del entorno:

    auth-service
    billing-service
    catalog-service
    frontend
    fx-service
    history-service
    notification-service

Si alguno de estos Deployments no completa el rollout dentro del tiempo configurado, el paso falla. Esto puede ocurrir si la nueva versión no arranca correctamente, si los Pods quedan en estado no disponible o si entran en fallos como `CrashLoopBackOff`.

Ante una falla, GitHub Actions activa el bloque condicionado con `if: failure()` y ejecuta automáticamente:

    kubectl rollout undo deployment/$SERVICE -n quetxal-tv-prod

Este comando indica a Kubernetes que restaure el Deployment hacia la revisión estable anterior.

* **Por qué se aplicó**: El rollback automatizado reduce el Tiempo Medio de Recuperación (MTTR). En lugar de requerir intervención manual para diagnosticar y revertir un despliegue defectuoso, el pipeline detecta la falla del rollout y ejecuta la reversión de forma automática, manteniendo la continuidad operativa del entorno en GKE.

---

## 10. Monitoreo de Salud de la Aplicación (Health Checks)

Los manifiestos incluyen sondas de Kubernetes para monitorear la disponibilidad y vitalidad de los componentes desplegados. Estas sondas permiten que Kubernetes decida cuándo un Pod puede recibir tráfico y cuándo debe ser reiniciado.

### 10.1 Readiness Probe

* **Dónde se aplicó**: Bloques `readinessProbe` en los contenedores definidos en `k8s/microservices/*.yaml`, `k8s/databases/*.yaml` y `k8s/api-gateway.yaml`.

* **Cómo se aplicó**: Se configuraron distintos tipos de readiness según el componente:

Microservicios gRPC:

    readinessProbe:
      tcpSocket:
        port: 50051
      initialDelaySeconds: 5
      periodSeconds: 10

API Gateway:

    readinessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 10

Frontend:

    readinessProbe:
      httpGet:
        path: /
        port: 3000
      initialDelaySeconds: 15
      periodSeconds: 10

PostgreSQL:

    readinessProbe:
      exec:
        command: ["pg_isready", "-U", "$(POSTGRES_USER)", "-d", "$(POSTGRES_DB)"]
      initialDelaySeconds: 5
      periodSeconds: 10

Redis:

    readinessProbe:
      exec:
        command: ["sh", "-c", "redis-cli -a \"$REDIS_PASSWORD\" ping | grep PONG"]
      initialDelaySeconds: 5
      periodSeconds: 10

* **Por qué se aplicó**: La `Readiness Probe` evita que Kubernetes envíe tráfico a Pods que todavía no están listos. Esto es clave durante despliegues RollingUpdate, porque un Pod nuevo solo reemplaza a uno antiguo cuando ya está marcado como `Ready`.

### 10.2 Liveness Probe

* **Dónde se aplicó**: Bloques `livenessProbe` en los contenedores definidos en los manifiestos Kubernetes del proyecto.

* **Cómo se aplicó**: Se configuraron sondas de vitalidad según el tipo de componente:

Microservicios gRPC:

    livenessProbe:
      tcpSocket:
        port: 50051
      initialDelaySeconds: 15
      periodSeconds: 20

API Gateway:

    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 20

Frontend:

    livenessProbe:
      httpGet:
        path: /
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 20

PostgreSQL:

    livenessProbe:
      exec:
        command: ["pg_isready", "-U", "$(POSTGRES_USER)", "-d", "$(POSTGRES_DB)"]
      initialDelaySeconds: 15
      periodSeconds: 20

Redis:

    livenessProbe:
      exec:
        command: ["sh", "-c", "redis-cli -a \"$REDIS_PASSWORD\" ping | grep PONG"]
      initialDelaySeconds: 15
      periodSeconds: 20

* **Por qué se aplicó**: La `Liveness Probe` permite a Kubernetes detectar contenedores que dejaron de responder correctamente. Si la sonda falla repetidamente, Kubernetes reinicia el Pod afectado, aplicando un mecanismo de auto-recuperación sin intervención manual.

### 10.3 Relación entre Health Checks y Zero-Downtime

Las sondas de salud son parte central de la estrategia Zero-Downtime. Durante un RollingUpdate, Kubernetes no considera disponible un Pod nuevo hasta que su `readinessProbe` sea exitosa. Esto permite que los Pods antiguos sigan atendiendo tráfico mientras los nuevos terminan de iniciar.

La combinación de:

* `replicas: 2`
* `maxSurge: 1`
* `maxUnavailable: 0`
* `readinessProbe`
* `livenessProbe`
* `kubectl rollout status`
* `kubectl rollout undo`

permite que el despliegue sea progresivo, observable y reversible. De esta forma, el sistema mantiene disponibilidad durante actualizaciones y puede regresar automáticamente a una versión estable si la nueva versión presenta fallos.




### **5.5 Aplicación de Principios SOLID (Nivel ISM)** {#5.3-aplicación-de-principios-solid-(nivel-ism)}

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

##### Resumen — dónde vive cada principio

| Principio | Servicios con evidencia | Mecanismo |
|---|---|---|
| **SRP** | auth (4 capas), catalog, notification, billing, fx | Separación handler / service / repository / domain |
| **OCP** | auth, fx, billing/catalog/rating, api-gateway | Interfaces de repositorio y de caché; servicios cerrados a modificación |
| **LSP** | auth, fx, catalog, rating, history | Implementaciones que cumplen el contrato de su interfaz / servicer gRPC |
| **ISP** | auth, fx, api-gateway, contratos `.proto` | Interfaces pequeñas y específicas por dominio |
| **DIP** | auth, billing, fx, catalog, notification | Inyección por constructor; el negocio depende de abstracciones, no de la BD |

---

#### SRP — Single Responsibility Principle

> *Una clase debe tener una sola razón para cambiar.* Cada capa tiene una única
> responsabilidad: el **handler/controller** habla el protocolo (gRPC/HTTP), el
> **service** tiene la lógica de negocio, el **repository** accede a datos y el
> **domain** son entidades puras.

##### 1.1 auth-service (Go) — las 4 capas separadas

<p align="center"><img src="docs/img/solid/srp-01-auth-handler.png" width="820" alt="SRP — auth handler (transporte)"/></p>

<p align="center"><sub><code>backend/auth-service/internal/grpc/handler.go</code></sub></p>

- **Dónde:** auth-service, **capa de transporte / adaptador gRPC**.
- **Cómo:** `AuthHandler` solo traduce gRPC ↔ dominio: recibe `*pb.LoginRequest`, delega en
  `AuthService` y convierte los errores de dominio a códigos gRPC con `aGRPC`. No contiene
  lógica de negocio ni SQL.
- **Por qué (mantenibilidad):** si cambia el contrato gRPC, solo se toca esta capa; el negocio
  queda intacto.

<p align="center"><img src="docs/img/solid/srp-02-auth-service.png" width="820" alt="SRP — auth service (negocio)"/></p>

<p align="center"><sub><code>backend/auth-service/internal/service/auth_service.go</code></sub></p>

- **Dónde:** auth-service, **capa de lógica de negocio**.
- **Cómo:** `AuthService` concentra las reglas: normaliza el email, valida la contraseña,
  encripta con **Bcrypt** y orquesta el registro/login. Llama al repositorio por su interfaz,
  sin saber que detrás hay PostgreSQL.
- **Por qué (mantenibilidad / seguridad):** las reglas de negocio viven en un único lugar
  auditable; un cambio de política (longitud de password, hashing) no afecta transporte ni datos.

<p align="center"><img src="docs/img/solid/srp-03-auth-repository.png" width="820" alt="SRP — auth repository (datos)"/></p>

<p align="center"><sub><code>backend/auth-service/internal/repository/postgres.go</code></sub></p>

- **Dónde:** auth-service, **capa de acceso a datos**.
- **Cómo:** `PostgresUsuarioRepo` ejecuta el SQL con `pgx`, maneja la transacción atómica
  usuario+perfil y traduce violaciones de constraint/trigger (`23505`, `23514`) a errores de dominio.
- **Por qué (mantenibilidad):** todo el SQL y los detalles de PostgreSQL están aislados aquí; el
  resto del servicio no contiene cadenas SQL.

<p align="center"><img src="docs/img/solid/srp-04-auth-domain.png" width="820" alt="SRP — auth domain (entidades)"/></p>

<p align="center"><sub><code>backend/auth-service/internal/domain/usuario.go</code></sub></p>

- **Dónde:** auth-service, **capa de dominio**.
- **Cómo:** `Usuario` y `Perfil` son entidades puras con reglas propias (`EsLocal`, `Activo`) y
  **cero** dependencias de frameworks o de la BD.
- **Por qué (testabilidad):** el dominio se prueba sin levantar nada externo.

##### 1.2 catalog-service (Python) — negocio y datos separados

<p align="center"><img src="docs/img/solid/srp-05-catalog-service.png" width="820" alt="SRP — catalog service (negocio)"/></p>

<p align="center"><sub><code>backend/catalog-service/app/service.py</code></sub></p>

<p align="center"><img src="docs/img/solid/srp-06-catalog-repository.png" width="820" alt="SRP — catalog repository (datos)"/></p>

<p align="center"><sub><code>backend/catalog-service/app/repository.py</code></sub></p>

- **Dónde:** catalog-service, capas de **negocio** y **datos**.
- **Cómo:** `CatalogService.obtener_ficha` valida y **ensambla** la ficha (cabecera + reparto +
  temporadas) llamando al repositorio; `CatalogRepository` solo ejecuta SQL crudo contra la vista
  `vw_cartelera` y las tablas base.
- **Por qué (mantenibilidad):** el servicio describe *qué* información compone la ficha; el
  repositorio describe *cómo* se obtiene. Cambiar una consulta no toca la lógica de ensamblado.

##### 1.3 notification-service (TypeScript) — 5 responsabilidades separadas

<p align="center"><img src="docs/img/solid/srp-07-notif-mailer.png" width="820" alt="SRP — notification mailer (SMTP)"/></p>

<p align="center"><sub><code>backend/notification-service/src/notifications/mailer.service.ts</code></sub></p>

<p align="center"><img src="docs/img/solid/srp-08-notif-worker.png" width="820" alt="SRP — notification worker (cron)"/></p>

<p align="center"><sub><code>backend/notification-service/src/notifications/worker.service.ts</code></sub></p>

<p align="center"><img src="docs/img/solid/srp-09-notif-repository.png" width="820" alt="SRP — notification repository (datos)"/></p>

<p align="center"><sub><code>backend/notification-service/src/notifications/notifications.repository.ts</code></sub></p>

- **Dónde:** notification-service.
- **Cómo:** enviar correo (`MailerService`, SMTP vía nodemailer), agendar el procesamiento
  (`WorkerService`, cron) y persistir el buzón (`NotificationsRepository`, SQL) están en clases
  distintas; `NotificationsService` solo las **orquesta**.
- **Por qué (mantenibilidad):** cambiar de proveedor SMTP toca solo `MailerService`; cambiar la
  cadencia del worker toca solo `WorkerService`. Ninguno arrastra a los demás.

##### 1.4 billing-service (TypeScript)

<p align="center"><img src="docs/img/solid/srp-10-billing-controller.png" width="820" alt="SRP — billing controller (transporte)"/></p>

<p align="center"><sub><code>backend/billing-service/src/billing/billing.controller.ts</code></sub></p>

<p align="center"><img src="docs/img/solid/srp-11-billing-repository.png" width="820" alt="SRP — billing repository (datos)"/></p>

<p align="center"><sub><code>backend/billing-service/src/billing/billing.repository.ts</code></sub></p>

<p align="center"><img src="docs/img/solid/srp-12-billing-service.png" width="820" alt="SRP — billing service (negocio)"/></p>

<p align="center"><sub><code>backend/billing-service/src/billing/billing.service.ts</code></sub></p>

- **Dónde:** billing-service (capas de transporte, datos y negocio).
- **Cómo:** `BillingController` solo recibe los `@GrpcMethod` y delega; `BillingRepository` aísla
  todo el SQL (planes, `sp_ProcesarRenovacion`, suscripciones); `BillingService` solo orquesta el
  repositorio + el `FxClient` y mapea al contrato gRPC, sin ninguna consulta SQL.
- **Por qué (mantenibilidad / testabilidad):** el servicio se prueba con un repositorio falso, sin
  base de datos.

##### 1.5 fx-service (Python)

<p align="center"><img src="docs/img/solid/srp-13-fx-handler.png" width="820" alt="SRP — fx handler (transporte)"/></p>

<p align="center"><sub><code>backend/fx-service/app/handler.py</code></sub></p>

<p align="center"><img src="docs/img/solid/srp-14-fx-repository.png" width="820" alt="SRP — fx repository (datos)"/></p>

<p align="center"><sub><code>backend/fx-service/app/repository.py</code></sub></p>

<p align="center"><img src="docs/img/solid/srp-15-fx-service.png" width="820" alt="SRP — fx service (negocio)"/></p>

<p align="center"><sub><code>backend/fx-service/app/service.py</code></sub></p>

- **Dónde:** fx-service.
- **Cómo:** `FXHandler` solo traduce gRPC y mapea errores; `FXRepository` solo ejecuta el SQL
  (`tipos_cambio`, `fn_convertir`); `FXService` solo tiene la política de negocio (cache-aside y
  validación). El cliente Redis vive en `RedisCache` y la conexión en `Database`.
- **Por qué (mantenibilidad / testabilidad):** cada pieza se entiende y se prueba por separado.

> La misma separación (handler / service / repository / domain) se repite también en
> **rating** e **history**.


<p align="center"><img src="docs/img/solid/srp-01-admin-handler.png" width="820" height="1000" alt="SRP — Separación de Handler HTTP y Repository SQL"/></p>
<p align="center"><sub><code>backend/catalog-service/app/admin_handler_http.py y admin_repository.py</code></sub></p>
- **Dónde:** catalog-service (Panel de Administración).
- **Cómo:** Se separó estrictamente la capa de red de la capa de datos. La clase `AdminHTTPHandler` se encarga **únicamente** de procesar las peticiones web HTTP, parsear JSON y devolver códigos de estado (200, 404, 500). Por otro lado, `AdminRepository` se encarga **únicamente** de ejecutar sentencias SQL.
- **Por qué (cohesión):** Aislar el manejo del servidor. Si el día de mañana se cambia el framework web del panel de administración, el archivo del repositorio de datos queda intacto.



---

#### OCP — Open/Closed Principle

> *Abierto a extensión, cerrado a modificación.* Se logra programando contra **interfaces**: se
> agregan implementaciones nuevas sin tocar el código que las consume.

<p align="center"><img src="docs/img/solid/ocp-01-auth-interface.png" width="820" alt="OCP — interfaz UsuarioRepository"/></p>

<p align="center"><sub><code>backend/auth-service/internal/service/auth_service.go</code></sub></p>

- **Dónde:** auth-service (frontera negocio ↔ datos).
- **Cómo:** `AuthService` consume la **interfaz** `UsuarioRepository`. Para añadir una caché, una
  réplica de lectura u otra base de datos, se crea un nuevo tipo que implemente esa interfaz; no se
  modifica ni una línea de `AuthService`.
- **Por qué (extensibilidad / bajo riesgo):** agregar comportamiento no obliga a editar (ni
  re-probar) la lógica ya validada.

<p align="center"><img src="docs/img/solid/ocp-02-fx-cache.png" width="600" alt="OCP — abstracción de caché"/></p>

<p align="center"><sub><code>backend/fx-service/app/cache.py</code></sub></p>

- **Dónde:** fx-service.
- **Cómo:** `FXService` depende de un objeto caché con `get`/`set` (hoy `RedisCache`). Cambiar a
  Memcached o a una caché en memoria es crear otra clase con la misma forma e inyectarla en
  `main.py`; `FXService` no cambia.
- **Por qué (extensibilidad):** la política de cache-aside del servicio queda cerrada a modificación
  pero abierta a nuevas implementaciones de almacenamiento.

El mismo mecanismo de "repositorio inyectado" hace extensibles a **catalog**, **rating** y
**billing** (un nuevo origen de datos = una nueva clase repositorio), y el **api-gateway** se
extiende agregando un `client` + `handler` por servicio sin tocar los existentes.


<p align="center"><img src="docs/img/solid/ocp-01-audit-trigger.png" width="820" alt="OCP — Implementación de Triggers para Auditoría"/></p>
<p align="center"><sub><code>database/catalog/06_audit.sql</code></sub></p>
- **Dónde:** Nivel de Base de Datos (Auditoría Transaccional de la Fase 2).
- **Cómo:** Para implementar la auditoría obligatoria, no se modificó el código fuente de los microservicios (el repositorio quedó **cerrado** a modificación). En su lugar, el sistema se **abrió** a la extensión mediante la inyección de Triggers en PostgreSQL que interceptan automáticamente cualquier `INSERT` o `UPDATE`.
- **Por qué (extensibilidad):** Garantiza que la lógica de negocio no se acople al registro de auditorías, haciendo que esta capa de seguridad escale de forma automática sin reescribir código existente.


---

#### LSP — Liskov Substitution Principle

> *Toda implementación debe poder sustituir a su abstracción sin romper al consumidor.*

<p align="center"><img src="docs/img/solid/lsp-01-auth-impl.png" width="820" alt="LSP — PostgresUsuarioRepo implementa UsuarioRepository"/></p>

<p align="center"><sub><code>backend/auth-service/internal/repository/postgres.go</code></sub></p>

- **Dónde:** auth-service.
- **Cómo:** `PostgresUsuarioRepo` cumple **completamente** el contrato `UsuarioRepository` (mismas
  firmas, devuelve los errores de dominio esperados). `AuthService` trabaja con la interfaz, así que
  cualquier implementación válida lo reemplaza sin cambios.
- **Por qué (confiabilidad):** se pueden inyectar dobles en pruebas o cambiar de implementación con
  garantía de que el servicio sigue funcionando.

<p align="center"><img src="docs/img/solid/lsp-02-grpc-servicer.png" width="700" alt="LSP — handler implementa el servicer gRPC"/></p>

<p align="center"><sub><code>backend/fx-service/app/handler.py</code></sub></p>

- **Dónde:** servicios gRPC (Go: `UnimplementedAuthServiceServer`; Python: `*ServiceServicer`).
- **Cómo:** cada handler hereda del *servicer* generado y respeta sus firmas `(request, context)`,
  por lo que el servidor gRPC lo registra y lo invoca **como si fuera la clase base**.
- **Por qué (confiabilidad):** el framework gRPC trata a todos los handlers de forma uniforme; un
  handler mal formado no compilaría ni se registraría.



<p align="center"><img src="docs/img/solid/lsp-03-admin-http-server.png" width="820" alt="LSP — AdminHTTPHandler hereda de BaseHTTPRequestHandler"/></p>
<p align="center"><sub><code>backend/catalog-service/app/admin_handler_http.py</code></sub></p>
- **Dónde:** catalog-service (Manejador de Servidor HTTP).
- **Cómo:** La clase `AdminHTTPHandler` hereda de `BaseHTTPRequestHandler` (nativa de Python) e implementa correctamente los contratos de la clase padre (`do_GET`, `do_POST`) para manejar las rutas CRUD.
- **Por qué (confiabilidad):** Permite que la instancia de `HTTPServer` invoque los métodos de nuestro manejador como si fuera la clase padre genérica. Al respetar las firmas, la sustitución no rompe el hilo de ejecución interno del servidor de Python.


---

#### ISP — Interface Segregation Principle

> *Ninguna clase debe depender de métodos que no usa.* Las interfaces son pequeñas y por dominio.

<p align="center"><img src="docs/img/solid/isp-01-auth-interface.png" width="760" alt="ISP — interfaz pequeña"/></p>

<p align="center"><sub><code>backend/auth-service/internal/service/auth_service.go</code></sub></p>

- **Dónde:** auth-service.
- **Cómo:** `UsuarioRepository` expone **exactamente** los 4 métodos que `AuthService` necesita
  (`CrearUsuarioConPerfilInicial`, `ObtenerPorEmail`, `CrearPerfil`, `ListarPerfiles`). No es una
  interfaz "gorda" con operaciones que nadie usa.
- **Por qué (claridad / testabilidad):** un doble de pruebas implementa solo 4 métodos; las
  dependencias quedan explícitas y mínimas.

<p align="center"><img src="docs/img/solid/isp-02-fx-cache.png" width="700" alt="ISP — interfaz de caché mínima (get/set)"/></p>

<p align="center"><sub><code>backend/fx-service/app/cache.py</code></sub></p>

- **Dónde:** fx-service.
- **Cómo:** el servicio ve una caché con **dos** operaciones (`get`/`set`), no toda la API de
  `redis.Redis`. La superficie expuesta es la estrictamente necesaria.
- **Por qué (bajo acoplamiento):** el servicio no se acopla a detalles del cliente Redis.

<p align="center"><img src="docs/img/solid/isp-03-proto-contract.png" width="700" alt="ISP — contrato gRPC segregado por dominio"/></p>

<p align="center"><sub><code>backend/fx-service/proto/fx.proto</code></sub></p>

- **Dónde:** contratos gRPC (`auth.proto`, `billing.proto`, `catalog.proto`, `fx.proto`, `rating.proto`, `history.proto`, `notification.proto`).
- **Cómo:** cada servicio define **su propio** contrato pequeño con solo sus RPCs; no existe una
  interfaz monolítica que todos deban implementar.
- **Por qué (modularidad):** un cliente del gateway depende únicamente de las operaciones del
  dominio que consume.


<p align="center"><img src="docs/img/solid/isp-04-admin-repo-queries.png" width="820" alt="ISP — Consultas segregadas sin sobrecarga de datos"/></p>
<p align="center"><sub><code>backend/catalog-service/app/admin_repository.py</code></sub></p>
- **Dónde:** Consultas de metadatos en el Panel de Administración.
- **Cómo:** Al enviar datos auxiliares (como listas de géneros o categorías), no se retorna un objeto masivo con relaciones innecesarias. Las consultas están segregadas para retornar diccionarios ligeros con exactamente lo que requiere la vista (`SELECT id, nombre`).
- **Por qué (bajo acoplamiento):** Reduce el tamaño de la transferencia (Payload) sobre la red. El Frontend de administración solo recibe los campos que estrictamente va a utilizar para poblar sus Dropdowns.

---

#### DIP — Dependency Inversion Principle

> *Los módulos de alto nivel dependen de abstracciones, no de detalles; las dependencias se
> **inyectan**.*

<p align="center"><img src="docs/img/solid/dip-01-auth-wiring.png" width="820" alt="DIP — wiring auth-service"/></p>

<p align="center"><sub><code>backend/auth-service/cmd/server/main.go</code></sub></p>

- **Dónde:** auth-service, `main.go` (composición).
- **Cómo:** `main` crea las implementaciones concretas (`PostgresUsuarioRepo`, `JWTManager`) y las
  **inyecta** en `AuthService`, que solo conoce la **interfaz** `UsuarioRepository`. El detalle
  (PostgreSQL) se decide en el borde, no en el negocio.
- **Por qué (flexibilidad):** si se migra de PostgreSQL a otra base de datos, se crea un nuevo
  repositorio que implemente `UsuarioRepository` y se inyecta, sin tocar una sola línea de
  `AuthService`.

<p align="center"><img src="docs/img/solid/dip-02-fx-wiring.png" width="820" alt="DIP — wiring fx-service"/></p>

<p align="center"><sub><code>backend/fx-service/app/main.py</code></sub></p>

- **Dónde:** fx-service, `main.py` (composición).
- **Cómo:** `main.py` arma `Database(cfg)`, `RedisCache(cfg)`, `FXRepository(db)`,
  `FXService(repo, cache)` y `FXHandler(service)`. El servicio recibe sus dependencias por
  constructor en lugar de instanciar Redis o abrir la conexión por su cuenta.
- **Por qué (testabilidad):** el servicio se prueba con un repositorio y una caché falsos, sin
  Postgres ni Redis.

<p align="center"><img src="docs/img/solid/dip-03-billing-di.png" width="820" alt="DIP — billing DI"/></p>

<p align="center"><sub><code>backend/billing-service/src/database/database.service.ts</code></sub></p>

- **Dónde:** billing-service.
- **Cómo:** el acceso a BD se encapsula en un `DatabaseService` `@Injectable`, expuesto por un
  `DatabaseModule` `@Global`. `BillingService` recibe por constructor su `BillingRepository` y el
  `FxClient`, en vez de importar una conexión global.
- **Por qué (testabilidad / modularidad):** las dependencias son explícitas e intercambiables por
  dobles (`billing.service.spec.ts`).

> El mismo patrón de inyección está también en **catalog/rating** (`app/server.py`: `db → repo →
> service → handler`) y **notification** (`DatabaseService` con `DatabaseModule` `@Global`).\


<p align="center"><img src="docs/img/solid/dip-04-admin-wiring.png" width="820" alt="DIP — Inyección del Repositorio en el Handler HTTP"/></p>
<p align="center"><sub><code>backend/catalog-service/app/admin_handler_http.py</code></sub></p>
- **Dónde:** catalog-service, función `make_server` (Composición).
- **Cómo:** El manejador de las peticiones web (`AdminHTTPHandler`) no instancia su propia conexión a la BD. El repositorio ya instanciado se le **inyecta** dinámicamente al crear la clase mediante parámetros (`{"repo": repo}`).
- **Por qué (testabilidad):** Desacopla completamente el servidor HTTP de los datos. Permite que durante pruebas se pueda inyectar un repositorio simulado (Mock) en memoria sin que el servidor web lo note, facilitando el Testing Automatizado de la Fase 2.



## **6\. Conclusiones** {#6.-conclusiones}

La arquitectura diseñada para la plataforma Quetxal TV demuestra un entrelazamiento total entre el Espacio del Problema (Nivel CIM) y el Espacio de la Solucion (Niveles PIM y PSM). Mediante la adopcion del estilo arquitectonico de Microservicios y el patron Database per Microservice, hemos garantizado el aislamiento de dominios, estandarizando la persistencia relacional en PostgreSQL para maximizar la integridad transaccional sin comprometer la tolerancia a fallos global del sistema.

Al aplicar el analisis del Triangulo de la Triple Restriccion, el equipo arquitectonico tomo decisiones de alcance para proteger la variable de Tiempo y garantizar la entrega del Producto Minimo Viable dentro de los plazos estipulados por el negocio. Asimismo, la segregacion de la infraestructura fisica en tres Maquinas Virtuales independientes dentro de Google Cloud Platform (GCP) asegura que los recursos de memoria no colapsen, protegiendo las bases de datos en una Red Privada Virtual desconectada del trafico publico.

Este Documento de Decision Arquitectonica (DDA) se constituye como la Linea Base oficial del proyecto. A partir de este momento, cualquier desarrollo a nivel de codigo, modificacion de base de datos o integracion futura debera subordinarse a los lineamientos aqui establecidos, demostrando que en la Ingenieria de Software, la tecnologia es unicamente el medio para alcanzar los objetivos estrategicos del negocio.

## Mokups Diseño UI/UX y Guía Visual

### Inicio de sesión

<div align="center">
  <img src="./docs/img/modelo4vistas/mock3.png" alt="Modelo 4+1" width="900"/>
</div>

### Registro nuevo usuario

<div align="center">
  <img src="./docs/img/modelo4vistas/inicioU.png" alt="Modelo 4+1" width="900"/>
</div>


<div align="center">
  <img src="./docs/img/modelo4vistas/inicioU2.png" alt="Modelo 4+1" width="900"/>
</div>

### Panel administrador

<div align="center">
  <img src="./docs/img/modelo4vistas/mockAdmin2.png" alt="Modelo 4+1" width="900"/>
</div>


<div align="center">
  <img src="./docs/img/modelo4vistas/muckAdmin.png" alt="Modelo 4+1" width="900"/>
</div>


### Panel Usuario

<div align="center">
  <img src="./docs/img/modelo4vistas/mock1.png" alt="Modelo 4+1" width="900"/>
</div>


<div align="center">
  <img src="./docs/img/modelo4vistas/mock2.png" alt="Modelo 4+1" width="900"/>
</div>

<div align="center">
  <img src="./docs/img/modelo4vistas/mock5.png" alt="Modelo 4+1" width="900"/>
</div>


<div align="center">
  <img src="./docs/img/modelo4vistas/mock6.png" alt="Modelo 4+1" width="900"/>
</div>


## 7\. Archivos Crudos

[https://drive.google.com/file/d/1hq4hJVHeOEW313d0HHbw7xJMeJJwOVa9/view?usp=sharing](https://drive.google.com/file/d/1hq4hJVHeOEW313d0HHbw7xJMeJJwOVa9/view?usp=sharing)   )   