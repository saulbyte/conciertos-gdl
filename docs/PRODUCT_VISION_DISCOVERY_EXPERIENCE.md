# Vision de producto: Revera como motor de descubrimiento

Revera no existe para mostrar eventos. Existe para aumentar la probabilidad de que alguien cierre el celular, salga de casa y viva algo que recordara.

## Norte

El usuario no deberia abrir Revera solo para preguntar "que eventos hay".

El usuario deberia abrir Revera para pensar:

"Vamos a ver que encontro Revera hoy."

## Cambio de enfoque

Antes:

Evento -> usuario

Ahora:

Curiosidad -> usuario -> evento

El evento sigue siendo la unidad de informacion, pero la experiencia debe estar organizada alrededor del descubrimiento: razones, contexto, senales, cambios, novedades y recomendaciones.

## Lo que no queremos ser

- Un calendario de eventos.
- Una agenda.
- Un buscador de conciertos.
- Una lista ordenada por fecha.
- Una boletera.

## Lo que queremos ser

Una capa de descubrimiento cultural que usa datos reales para decirle al usuario que merece cinco minutos de su atencion hoy.

## Principio de decision

Cada nueva funcionalidad debe responder:

"Esto aumenta la probabilidad de que alguien salga de casa gracias a Revera?"

Si la respuesta es si, pertenece al producto. Si no, probablemente es ruido.

## Direccion de la Home

La Home debe dejar de depender principalmente de secciones informativas como:

- Hoy toca
- Este mes
- Gratis
- Recintos

Y empezar a organizarse por intencion de descubrimiento:

- Recien encontrado por Revera
- Conoce a quien viene
- Leyendas que regresan
- Lo inesperado
- Esto solo ocurre una vez
- Planes accesibles
- Si te gusta esto, probablemente te guste aquello
- Lo mejor para este fin
- Lo que cambio esta semana

Los nombres exactos pueden cambiar. La idea no: Revera debe provocar curiosidad antes de mostrar datos.

## Primera hipotesis de implementacion

Crear una capa `EventInsight` o equivalente que genere pequenas historias a partir de datos reales:

- `headline`: frase breve que despierta curiosidad.
- `reason`: por que este evento merece atencion.
- `category`: tipo de descubrimiento.
- `confidence`: que tan fuerte es la senal.
- `source`: regla, observacion, historial, metrica o fuente.

La primera version debe evitar depender de redaccion manual. Debe usar reglas simples con:

- eventos
- artistas
- recintos
- fechas
- likes
- observaciones
- novedades detectadas
- historial disponible

## Frase guia

Revera no muestra eventos. Revera descubre experiencias que vale la pena vivir.
