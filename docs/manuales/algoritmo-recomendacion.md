
## Documentación del Algoritmo de Recomendación

## 1. Introducción

Uno de los principales retos de una plataforma de streaming es ayudar a los usuarios a encontrar contenido de su interés entre un catálogo cada vez más grande. Si todos los usuarios visualizaran exactamente el mismo catálogo, sería más difícil descubrir nuevas películas o series relacionadas con sus preferencias.

Para resolver este problema, Quetxal TV incorpora un **motor de recomendaciones personalizado**, encargado de analizar el comportamiento de cada perfil y sugerir contenido similar a lo que ya ha consumido.

---

# 2. Algoritmo seleccionado

Para este proyecto se implementó un algoritmo de **Filtrado Basado en Contenido (Content-Based Filtering)**.

Este algoritmo recomienda contenido utilizando las características de las películas o series que el usuario ya consumió, principalmente sus **géneros**.

Algunos ejemplos de géneros son:

- Acción
- Ciencia Ficción
- Comedia
- Drama
- Romance
- Terror
- Thriller

Si un usuario consume principalmente películas de Acción y Ciencia Ficción, el sistema tenderá a recomendar más contenido perteneciente a esos géneros.

---

# 3. Justificación de la selección

Se eligió Content-Based Filtering por las siguientes razones:

- Funciona correctamente desde las primeras interacciones del usuario.
- No requiere comparar usuarios entre sí.
- No necesita grandes cantidades de datos para comenzar a generar recomendaciones.
- Es sencillo de implementar y mantener.
- No requiere infraestructura de Machine Learning ni entrenamiento de modelos.
- Tiene un tiempo de respuesta rápido y adecuado para arquitecturas basadas en microservicios.

Estas características lo convierten en una solución adecuada para la arquitectura de Quetxal TV.

---

# 4. Modelo lógico del algoritmo

El algoritmo utiliza tres fuentes principales de información:

- Historial de reproducción del perfil.
- Calificaciones positivas realizadas por el usuario.
- Catálogo completo de películas y series.

Con esta información se calcula qué géneros son los favoritos del usuario y posteriormente se asigna un puntaje a cada contenido del catálogo.

El funcionamiento general puede resumirse de la siguiente manera:

```text
Historial +
Calificaciones
        │
        ▼
Calcular preferencias por género
        │
        ▼
Asignar puntaje a cada contenido
        │
        ▼
Penalizar contenido ya visto
        │
        ▼
Ordenar resultados
        │
        ▼
Top 12 recomendaciones
```

---

# 5. Funcionamiento del algoritmo

## Paso 1. Obtener las interacciones del usuario

El sistema consulta dos bases de datos:

- Historial de reproducción.
- Calificaciones del usuario.

Estas dos listas representan todo el contenido con el que el perfil ha interactuado.

---

## Paso 2. Calcular preferencias por género

Cada contenido aporta puntos a sus géneros.

Se utilizan los siguientes pesos:

| Acción del usuario | Peso |
|-------------------|-----:|
| Solo reprodujo el contenido | 1 |
| Lo calificó positivamente | 3 |

Una calificación positiva representa una preferencia mucho más fuerte que simplemente haber reproducido el contenido.

Ejemplo:

Si el usuario vio:

- Avengers
- John Wick

Y además calificó Avengers con 5 estrellas, entonces el género **Acción** tendrá un mayor puntaje.

---

## Paso 3. Calcular el puntaje de cada contenido

Posteriormente se analiza todo el catálogo.

Para cada película o serie se suman los puntos correspondientes a sus géneros.

Mientras más géneros coincidan con los gustos del usuario, mayor será su puntuación.

Ejemplo:

| Película | Géneros | Puntaje |
|----------|----------|---------:|
| John Wick | Acción, Thriller | 3 |
| Inception | Ciencia Ficción, Thriller | 3 |
| Titanic | Drama, Romance | 1 |

---

## Paso 4. Penalizar contenido ya visto

El objetivo del sistema es descubrir contenido nuevo.

Por esta razón, si una película ya fue vista anteriormente, su puntaje disminuye utilizando un factor de penalización.

De esta forma el algoritmo continúa mostrando contenido nuevo sin eliminar completamente las películas ya vistas.

La lógica aplicada es:

```text
Si el contenido ya fue visto:

    puntaje = puntaje × 0.2

Si el contenido es nuevo:

    puntaje = puntaje
```

---

## Paso 5. Ordenar las recomendaciones

Finalmente todos los contenidos son ordenados de mayor a menor puntaje.

El sistema devuelve únicamente las primeras **12 recomendaciones**, que son las que aparecen en la sección **"Recomendados para ti"** de Quetxal TV.

---

# 6. Caso especial: Usuario sin historial

Cuando un perfil aún no posee historial de reproducción ni calificaciones, el algoritmo no puede calcular preferencias.

En este escenario simplemente se muestran los primeros títulos disponibles del catálogo.

Esto evita que la sección de recomendaciones aparezca vacía.

---

# 7. Implementación dentro de la arquitectura

El algoritmo fue implementado dentro del **Catalog Service**, evitando crear un microservicio adicional.

Esta decisión reduce la complejidad de la arquitectura y disminuye la latencia de las consultas.

El servicio obtiene información desde tres bases de datos diferentes:

- History DB
- Rating DB
- Catalog DB

---

# 8. Flujo de implementación

El flujo implementado dentro del Catalog Service es el siguiente:

```text
Usuario solicita recomendaciones
            │
            ▼
Catalog Service recibe la solicitud
            │
            ▼
Consultar historial en History DB
            │
            ▼
Consultar calificaciones en Rating DB
            │
            ▼
Consultar catálogo completo en Catalog DB
            │
            ▼
Calcular preferencias por género
            │
            ▼
Calcular puntaje de cada contenido
            │
            ▼
Penalizar contenido ya visto
            │
            ▼
Ordenar resultados
            │
            ▼
Retornar las primeras 12 recomendaciones
```

---

# 9. Ejemplo de funcionamiento

Supongamos el siguiente escenario.

## Historial del usuario

- Avengers
- The Notebook

## Calificaciones positivas

- Avengers (5 estrellas)

El algoritmo determina que los géneros favoritos del usuario son:

- Acción
- Ciencia Ficción

Luego analiza el catálogo completo y obtiene:

| Película | Resultado |
|----------|-----------|
| John Wick | Muy recomendada |
| Inception | Muy recomendada |
| Titanic | Recomendación media |
| Avengers | Baja prioridad por haber sido vista |

Como resultado, **John Wick** e **Inception** aparecerán primero en la sección **"Recomendados para ti"**.

---

# 10. Ventajas del algoritmo implementado

Entre las principales ventajas se encuentran:

- Personaliza el contenido para cada perfil.
- Prioriza películas y series similares a los gustos del usuario.
- Favorece el descubrimiento de contenido nuevo.
- Tiene un tiempo de respuesta rápido.
- Es sencillo de mantener dentro de una arquitectura de microservicios.
- No requiere modelos de Inteligencia Artificial ni procesos de entrenamiento.

---

# 11. Pruebas realizadas

Para validar el funcionamiento del algoritmo se implementaron pruebas unitarias que verifican los escenarios más importantes.

| Prueba | Objetivo |
|---------|----------|
| Perfil vacío | Verificar que se detecten datos inválidos. |
| Usuario sin historial | Confirmar que se devuelve el catálogo por defecto. |
| Preferencia por géneros | Verificar que los géneros favoritos obtienen mayor prioridad. |
| Penalización de contenido visto | Confirmar que el contenido nuevo aparece antes que el ya reproducido. |

Estas pruebas garantizan que el algoritmo produzca recomendaciones consistentes y funcione correctamente en los diferentes escenarios de uso.


