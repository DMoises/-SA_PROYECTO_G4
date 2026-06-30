# Guion de Defensa — Quetxal TV (Proyecto Fase 3)

**Software Avanzado · USAC · FIUSAC**
**Duración objetivo: ~19:30 / 20:00 máx · 6 expositores · 18 diapositivas**

---

## Cómo usar este guion

- El texto en cursiva es lo que **dices**; lo que está fuera de cursiva son **indicaciones de apoyo** (no se leen).
- Cada bloque cierra con una **frase de relevo** para encadenar con el siguiente expositor sin pausas muertas.
- Habla mirando al evaluador, no a la diapositiva. Apóyate en los números grandes y en los nombres de los componentes.
- La asignación de expositores es una propuesta; pueden reordenarla, pero **respeten la regla de que los seis hablan** y que cada quien domine los términos de su bloque.

### Reparto y tiempos

| # | Expositor | Bloque | Diapositivas | Tiempo |
|---|-----------|--------|--------------|--------|
| 1 | Juan José Almengor | Apertura + El problema (parte 1) | 1 – 3 | ~3:00 |
| 2 | Gerson González | El problema (parte 2) | 4 – 5 | ~3:00 |
| 3 | Fernando Morales | Solución: arquitectura políglota y datos | 6 – 8 | ~3:30 |
| 4 | Moisés Alvarado | Solución: comunicación, IaC y orquestación | 9 – 11 | ~3:30 |
| 5 | Daniel Chan | Solución: observabilidad y CI/CD | 12 – 13 | ~3:00 |
| 6 | Joshua Franco | La solución final + cierre | 14 – 18 | ~3:30 |
| — | Todos | Preguntas y respuestas | — | resto |

---

## EXPOSITOR 1 — Juan José Almengor · *Apertura y El Problema Inicial (parte 1)* · ~3:00

### Diapositiva 1 — Portada *(~25 s)*

> *Buenos días. Gracias por su tiempo. Somos el grupo a cargo de **Quetxal TV**, una plataforma de streaming bajo suscripción, y hoy venimos a defender la Fase 3 del proyecto: el ecosistema operativo unificado desplegado en Google Cloud Platform. En los próximos veinte minutos los seis integrantes recorreremos cómo pasamos de un problema de negocio a una solución en la nube políglota, elástica y observable.*

### Diapositiva 2 — Estructura de la defensa *(~30 s)*

> *La defensa está organizada en tres bloques. Primero, **el problema inicial**: el diagnóstico del negocio, los cuellos de botella de una plataforma monolítica y la justificación del cambio. Segundo, **el planteamiento de la solución**, donde fundamentamos cada decisión arquitectónica: la matriz políglota, las bases de datos externas, los esquemas de sesión, la infraestructura como código y los stacks de observabilidad. Y tercero, **la solución final**: cómo todo eso se integra en un sistema de alta disponibilidad.*

### Diapositiva 3 — ¿Qué es Quetxal TV? *(~75 s)*

> *Empecemos por el negocio. Quetxal TV es una plataforma de streaming por suscripción: el usuario consume contenido multimedia de forma segura, personalizada y siempre disponible. Para hacer ese valor manejable, descompusimos el núcleo del negocio en **siete dominios funcionales**.*
>
> *Tenemos **Identidad y perfiles** —registro, login y hasta cinco perfiles por cuenta—; **Suscripciones**, con planes Básico, Estándar y Premium y un cobro con garantía ACID; **Catálogo y consumo**, con búsqueda multicriterio, ficha técnica y reproducción; **Calificaciones y recomendación**, que alimenta la sección "Recomendados para ti"; el **Servicio Financiero FX**, que muestra el precio en la moneda local del usuario; y finalmente **Historial y notificaciones**, que permite reanudar la reproducción y enviar avisos por correo.*
>
> *Esta descomposición no es casual: es la base sobre la que más adelante segregamos los microservicios. Y para entender por qué tuvimos que rediseñar, mi compañero Gerson explicará qué pasa cuando todos estos dominios viven dentro de un mismo monolito.*

**Relevo:** *Adelante, Gerson.*

---

## EXPOSITOR 2 — Gerson González · *El Problema Inicial (parte 2)* · ~3:00

### Diapositiva 4 — Los límites de la plataforma monolítica *(~85 s)*

> *Gracias, Juan José. Una plataforma monolítica concentra estos siete dominios en un mismo despliegue y una sola base de datos. Eso produce cuatro cuellos de botella concretos.*
>
> *El primero es el **acoplamiento y el fallo total**: si cae un módulo secundario, como el de notificaciones, cae todo el sistema, y el usuario ni siquiera puede reproducir. El segundo es el **escalado en bloque**: en un día de estrenos necesitaríamos más capacidad solo de catálogo, pero el monolito nos obliga a replicar la aplicación completa, desperdiciando recursos. El tercero es el **aprovisionamiento manual**: infraestructura levantada a mano y configurada entrando por SSH a cada servidor, lo que no es ni replicable ni auditable. Y el cuarto es la **ausencia de visibilidad**: sin correlación de logs y métricas, los cuellos de botella se detectan cuando ya afectaron al cliente.*

### Diapositiva 5 — Por qué cambiamos: drivers que mandan *(~85 s)*

> *Ahora bien, nuestro rediseño no responde a una moda, sino a **drivers arquitectónicos medibles**. A la izquierda están los **Atributos de Calidad** que nos fijamos como meta: latencia del servicio financiero por debajo de **50 milisegundos** apoyándonos en Redis; una **disponibilidad global del 99.5%** tolerante a fallos; **rechazo del 100%** de las peticiones que lleguen sin un token JWT válido; y **cero Pods indisponibles** durante un despliegue.*
>
> *A la derecha están las **restricciones impuestas** que gobiernan toda la fase: un backend políglota obligatorio en Go, Python y TypeScript; el patrón Database per Microservice, sin esquemas compartidos; la prohibición de ORMs mágicos como Prisma o Supabase, usando SQL nativo; la delegación de la lógica pesada al motor de base de datos; la contenerización con Docker sobre GCP; y logs estructurados en JSON compatibles con ELK. En resumen: estos drivers son el contrato que nuestra solución debe cumplir. Fernando explicará cómo lo cumplimos.*

**Relevo:** *Te cedo la palabra, Fernando.*

---

## EXPOSITOR 3 — Fernando Morales · *Solución: arquitectura políglota y datos* · ~3:30

### Diapositiva 6 — Microservicios + Database per Microservice *(~70 s)*

> *Gracias, Gerson. La decisión base fue sustituir el monolito por una **malla de microservicios con persistencia aislada por dominio**. Cada servicio es dueño exclusivo de su base de datos: no hay llaves foráneas físicas entre dominios distintos.*
>
> *Esto nos da tres beneficios directos. **Aislamiento de fallos**: una caída se contiene en su dominio, así que el catálogo y la reproducción siguen vivos aunque falle otro servicio. **Escalado independiente**: replicamos solo el servicio bajo presión. Y **persistencia externa**: los motores PostgreSQL viven en máquinas virtuales de Compute Engine, nunca dentro de Pods efímeros. Esto cumple la restricción de aislamiento de datos y garantiza que la integridad de los datos críticos no dependa del ciclo de vida de los contenedores de cómputo.*

### Diapositiva 7 — Matriz políglota *(~75 s)*

> *La restricción exige tres lenguajes, y los asignamos según la naturaleza de cada dominio.*
>
> ***Go** lo usamos en el borde y donde hay alta concurrencia: el api-gateway, autenticación, historial y watch-party. Sus goroutines y binarios livianos nos dan baja latencia para servicios perimetrales, validación de sesión y WebSockets. **Python** lo asignamos a los dominios de datos y lógica relacional: catálogo, calificaciones y el servicio FX. Dentro del Catalog Service también corre el **motor de recomendaciones** —Content-Based Filtering sobre géneros—, que consulta historial y calificaciones para devolver el Top 12 personalizado de cada usuario, sin requerir Machine Learning ni microservicio adicional. Y **TypeScript** lo usamos donde importan la asincronía y los contratos tipados: facturación, notificaciones y el frontend, aprovechando el event-loop de Node y el tipado estático en dominios sensibles como los cobros.*

### Diapositiva 8 — Persistencia, lógica en el motor y sesión *(~80 s)*

> *Sobre los datos tomamos cuatro decisiones. Primero, **PostgreSQL externo por dominio**, en VMs de Compute Engine, garantizando integridad ACID e independencia de los Pods. Segundo, **SQL nativo sin ORM mágico**: delegamos la lógica pesada al motor con un Stored Procedure que blinda los cobros con atomicidad ACID, un trigger para la auditoría inmutable, una función SQL que recalcula el porcentaje de recomendación, y una vista materializada para acelerar la cartelera. Tercero, **Redis como caché del servicio FX**: la tasa de cambio se guarda en memoria con un TTL, respondiendo en microsegundos y manteniendo la latencia por debajo de 50 milisegundos en picos de compra. Y cuarto, **sesión stateless con JWT**: el API Gateway valida la firma del token en el borde y propaga los claims a la red interna, mientras los Secrets de Kubernetes resguardan las credenciales sin hardcoding.*

**Relevo:** *Con esto, Moisés explicará cómo se comunican y dónde corren estos servicios.*

---

## EXPOSITOR 4 — Moisés Alvarado · *Solución: comunicación, IaC y orquestación* · ~3:30

### Diapositiva 9 — Comunicación: síncrona vs. asíncrona *(~80 s)*

> *Gracias, Fernando. La arquitectura combina deliberadamente dos estilos de comunicación, y el criterio es la **criticidad temporal** de cada operación.*
>
> *Lo que el usuario debe ver **ya** viaja de forma **síncrona por gRPC**: una llamada request-response bloqueante sobre HTTP/2 con contratos Protocol Buffers. Así funcionan el Gateway hacia los servicios, la llamada de facturación a FX para calcular el precio, y la validación del token. Aquí ganamos consistencia inmediata y un contrato fuertemente tipado.*
>
> *En cambio, lo que puede diferirse viaja de forma **asíncrona con el patrón Transactional Outbox**. El servicio productor no llama directo al de correo: escribe el mensaje en la tabla buzon_salida dentro de la misma transacción de negocio. Un worker consume esa cola FIFO, envía por SMTP y aplica una política de reintentos. Esto desacopla el flujo principal y sostiene la tolerancia a fallos, y lo logramos **sin un broker dedicado**: la cola es una simple tabla en PostgreSQL, cero infraestructura extra.*

### Diapositiva 10 — Infraestructura como código: Terraform + Ansible *(~80 s)*

> *Coherentes con el diagnóstico, la infraestructura no se aprovisiona a mano ni por SSH: se codifica, se versiona y se destruye bajo demanda. Lo dividimos en dos herramientas con responsabilidades claras.*
>
> ***Terraform** define **qué** infraestructura existe, de forma declarativa y con archivo de estado: crea la VPC, las subredes y los firewalls, el clúster de GKE, las VMs de desarrollo, las instancias externas de base de datos y las cuentas de servicio. **Ansible** define **cómo** se configura cada máquina: es una automatización agentless por SSH, con Playbooks y Roles que instalan Docker y las dependencias base, preparan los entornos de ejecución en las VMs y despliegan de forma reproducible, sin que nadie entre manualmente a un servidor. Ambas viven versionadas en el repositorio.*

### Diapositiva 11 — Orquestación y borde: GKE, Ingress y API Gateway *(~75 s)*

> *Para orquestar y proteger el sistema usamos tres piezas. **GKE** orquesta la producción en la rama release: administra réplicas, health checks, rollouts y descubrimiento de servicios de forma declarativa. **Ingress** es la única puerta web: un solo recurso en GKE intercepta todo el tráfico externo y lo enruta hacia el API Gateway, de modo que los microservicios nunca quedan expuestos a internet. Y el **API Gateway**, escrito en Go, actúa como interceptor perimetral en la DMZ: valida el JWT, rechaza lo no autorizado y traduce las peticiones HTTP/REST del cliente a llamadas gRPC internas de baja latencia. El flujo de borde queda así: cliente, Ingress, API Gateway con validación de token, gRPC, microservicio y, finalmente, PostgreSQL externo.*

**Relevo:** *Daniel nos contará cómo observamos y entregamos todo esto.*

---

## EXPOSITOR 5 — Daniel Chan · *Solución: observabilidad y CI/CD* · ~3:00

### Diapositiva 12 — Observabilidad: ver antes de que duela *(~80 s)*

> *Gracias, Moisés. Recordemos que uno de los dolores del monolito era la falta de visibilidad. Lo resolvemos separando las dos señales en stacks especializados.*
>
> *Para los **logs** usamos el **ELK Stack**: todos los servicios emiten logs estructurados en JSON; Filebeat y Logstash los recolectan y transforman, Elasticsearch los almacena e indexa, y Kibana permite la consulta y la auditoría centralizada. Nuestra meta es que un evento crítico esté visible en menos de diez segundos. Para las **métricas** usamos **Prometheus y Grafana** bajo un modelo de scraping de series temporales dentro de GKE: node_exporter como DaemonSet da telemetría por nodo, cAdvisor y kubelet observan Pods y contenedores sin reescribir los microservicios, y Grafana presenta dashboards de CPU, memoria, red y disco. Importante: Prometheus vive dentro del clúster y no expone métricas a internet.*

### Diapositiva 13 — CI/CD con cortocircuito crítico *(~80 s)*

> *La entrega la gobierna **GitHub Actions** bajo la premisa de **cortocircuito crítico**: si falla una prueba, el build o un script, el flujo se detiene de inmediato y el código inestable nunca llega a empaquetado ni despliegue.*
>
> *El pipeline arranca con un push o pull request; ejecuta las pruebas unitarias y de integración por lenguaje, exigiendo un **75% de cobertura** —y es justo aquí donde aplica el cortocircuito—; construye y publica las imágenes Docker versionadas; despliega; y al final dispara **smoke tests** para certificar que las rutas base están vivas y **Locust** para la prueba de carga ligera. Además, bifurcamos por rama: develop va a staging en VMs con Docker Compose, y release va a producción en GKE con versionado semántico —nuestra versión V2.0.0—, manifiestos, bases de datos externas e Ingress. Locust genera un reporte HTML como evidencia de rendimiento bajo concurrencia.*

**Relevo:** *Para cerrar, Joshua mostrará cómo todo esto se integra en la solución final.*

---

## EXPOSITOR 6 — Joshua Franco · *La Solución Final + cierre* · ~3:30

### Diapositiva 14 — El ecosistema operativo unificado *(~75 s)*

> *Gracias, Daniel. Esta es la foto completa que une todo lo expuesto. En el **borde**, el frontend en Next.js entra por el Ingress de GKE hacia el API Gateway en Go con validación JWT. Detrás está la **malla políglota** de nueve microservicios de backend en Go, Python y TypeScript comunicándose por gRPC, más el camino **asíncrono** del Outbox hacia el SMTP. Abajo, la **persistencia aislada** en Compute Engine —PostgreSQL por dominio con SQL nativo y Redis para FX— y el **almacenamiento de objetos** en un bucket privado de GCS que sirve la multimedia por URLs firmadas. Todo descansa sobre **infraestructura como código** con Terraform y Ansible, está cubierto por **observabilidad** con ELK y Prometheus/Grafana, y se publica con **entrega continua** en GitHub Actions.*

### Diapositiva 15 — Infraestructura elástica y siempre disponible *(~80 s)*

> *Veamos cómo esto cumple la promesa de alta disponibilidad. Apuntamos a una **disponibilidad global del 99.5%**, con **dos réplicas por microservicio** en GKE, **cero Pods caídos** durante un despliegue y **rollback automático** ante una falla de arranque.*
>
> *¿Cómo lo logramos? Con una estrategia **RollingUpdate** configurada con maxUnavailable en cero y maxSurge en uno: los Pods se reemplazan progresivamente sin cortar las transmisiones activas. Con **tolerancia a fallos por diseño**, porque el aislamiento de dominios y el Outbox permiten que una caída se contenga mientras el usuario sigue viendo contenido. Y con **elasticidad reproducible**, ya que toda la topología es declarativa: se recrea o escala con Terraform y se reconfigura con Ansible, sin pasos manuales.*

### Diapositiva 16 — Inteligencia que retiene al usuario *(~80 s)*

> *Y sobre esa infraestructura corre el **backend inteligente** que responde a la necesidad de negocio: retener al usuario. Tenemos **recomendaciones** personalizadas con "Recomendados para ti", ejecutadas dentro del **Catalog Service** mediante un algoritmo de Content-Based Filtering sobre géneros: suma pesos del historial y calificaciones, penaliza el contenido ya visto y devuelve el Top 12, todo sin modelos de ML ni infraestructura adicional. Tenemos **Watch Party**, salas sincronizadas en tiempo real por WebSockets, exclusivas de Premium y validadas por interceptores gRPC. **Control parental** con PIN de cuatro dígitos y bloqueo por clasificación antes de reproducir contenido restringido. **Precio en moneda local** instantáneo gracias a la caché FX en Redis. Y tres **CronJobs de mantenimiento automatizado**: `depuracion-cuentas`, que borra lógicamente cuentas inactivas a las 3:00 AM; `refresh-cartelera`, que refresca la vista materializada de estrenos cada 5 minutos sin bloquear lecturas; y `estreno-notify`, que cada 10 minutos detecta títulos recién estrenados y encola correos por gRPC al notification-service con garantía de idempotencia. Y la **multimedia servida desde GCS** por URLs firmadas, sin atravesar el Gateway.*

### Diapositiva 17 — Conclusiones *(~40 s)*

> *En conclusión, cuatro ideas. Hay un **entrelazamiento total**: cada decisión técnica se traza hasta una necesidad de negocio. El **aislamiento da resiliencia** gracias a los microservicios y al Database per Microservice. La **nube es reproducible** con Terraform y Ansible. Y la **operación es proactiva** con ELK y Prometheus/Grafana. En síntesis, Quetxal TV resuelve de extremo a extremo la retención de usuarios sobre una infraestructura elástica, observable y tolerante a fallos.*

### Diapositiva 18 — Cierre *(~15 s)*

> *Con esto cerramos nuestra defensa. Muchas gracias por su atención; quedamos atentos a sus preguntas.*

---

## Bloque de preguntas — Todo el equipo

- Cada integrante responde sobre **su** bloque: problema de negocio (1–2), arquitectura y datos (3), comunicación e infraestructura (4), observabilidad y CI/CD (5), solución final y disponibilidad (6).
- Si una pregunta cruza varios temas, **un solo integrante** la inicia y otro complementa; eviten hablar encima.
- Respuestas breves y técnicas: nombren el componente, la restricción que cubre y la evidencia en el repositorio.

## Consejos de cronometraje

- **Ensayen con reloj.** Si van sobre tiempo, las diapositivas con mayor margen para recortar son la 3, la 16 y la 8 (pueden mencionar menos ejemplos).
- Dejen ~30–40 s de colchón antes del minuto 20 para no cortar el cierre.
- Nadie debe quedarse callado: si se traban, salten a la **frase de relevo** y continúen.
