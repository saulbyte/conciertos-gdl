# Guia de operacion, base de datos y publicacion

## Objetivo

Este documento explica como actualizar la cartelera de Conciertos GDL, verificar
el resultado, publicar cambios, administrar el esquema de la base de datos y
reaccionar ante errores. Actualmente la sincronizacion es manual.

Las fuentes integradas son:

- Ticketmaster
- Visit Jalisco
- Superboletos

## Mapa del ambiente productivo

La aplicacion utiliza cuatro piezas principales:

- Git y el directorio local contienen el codigo fuente.
- Vercel construye y publica la aplicacion Next.js.
- Neon aloja la base de datos PostgreSQL.
- Ticketmaster, Visit Jalisco y Superboletos proporcionan eventos.

Actualizar eventos y publicar codigo son operaciones diferentes:

| Operacion | Modifica | Requiere despliegue |
| --- | --- | --- |
| `npm run sync:events` | Datos en Neon | No |
| Editar componentes o servicios | Codigo | Si |
| Agregar una migracion Prisma | Esquema de Neon | Si |
| Cambiar variables de Vercel | Configuracion | Se recomienda |

La URL publica principal es:

https://conciertos-gdl.vercel.app

Los scripts escriben directamente en la base de datos Neon configurada en
`DATABASE_URL`. Con la configuracion actual, ejecutar los comandos desde este
proyecto modifica la informacion que utiliza produccion.

## Antes de comenzar

Necesitas:

1. Acceso a la computadora que contiene el proyecto.
2. Node.js y las dependencias del proyecto instaladas.
3. Un archivo `.env.local` con `DATABASE_URL`, `TICKETMASTER_API_KEY` y
   `SYNC_SECRET` validos.
4. Conexion a internet.

Nunca compartas ni subas `.env.local` al repositorio. Para confirmar que existen
las variables sin mostrar sus valores, ejecuta:

```powershell
Select-String -Path .env.local -Pattern "^(DATABASE_URL|TICKETMASTER_API_KEY|SYNC_SECRET)="
```

La salida debe mostrar los tres nombres. No publiques capturas que contengan sus
valores.

## Procedimiento recomendado

Abre PowerShell y entra al proyecto:

```powershell
cd C:\Users\Alexis\Desktop\conciertos\conciertos-gdl
```

Ejecuta la sincronizacion completa:

```powershell
npm run sync:events
```

El proceso consulta las fuentes en este orden:

1. Ticketmaster
2. Visit Jalisco
3. Superboletos

Es normal que tarde varios minutos. Ticketmaster suele ser la fuente mas lenta.
No cierres la terminal hasta recuperar el prompt de PowerShell.

## Interpretacion de resultados

Cada fuente imprime una linea parecida a esta:

```text
SUPERBOLETOS sync complete. Fetched: 27. Created: 2. Updated: 25. Duplicates: 0.
```

- `Fetched`: eventos validos encontrados en la fuente.
- `Created`: eventos nuevos guardados en Neon.
- `Updated`: eventos ya conocidos cuya informacion se volvio a guardar.
- `Duplicates`: eventos nuevos omitidos porque coinciden con otra fuente.

Que `Updated` sea alto no significa que todos los eventos hayan cambiado. El
sincronizador actualiza los registros existentes para mantenerlos alineados con
su fuente.

Un resultado con cero eventos no debe asumirse como normal. Antes de continuar,
revisa si la fuente cambio, bloqueo la consulta o dejo de responder.

## Verificacion en produccion

Al terminar, abre:

https://conciertos-gdl.vercel.app

Busca uno o dos eventos recientes. Tambien puedes consultar la API publica:

```powershell
Invoke-RestMethod "https://conciertos-gdl.vercel.app/api/events?q=TINI"
```

La actualizacion de datos no requiere desplegar Vercel, ejecutar un build ni
reiniciar Neon. La pagina consulta la misma base que modifican los scripts.

## Sincronizar una sola fuente

Usa estos comandos para diagnosticar una fuente o actualizarla por separado:

```powershell
npm run sync:ticketmaster
npm run sync:visit-jalisco
npm run sync:superboletos
```

Si la sincronizacion completa falla, las fuentes posteriores no se ejecutan. Por
ejemplo, si Ticketmaster falla, ejecuta Visit Jalisco y Superboletos con sus
comandos individuales mientras investigas Ticketmaster.

Todos los comandos son repetibles. Volver a ejecutarlos no crea copias del mismo
evento porque cada registro se identifica por fuente e identificador externo.

## Ejecutar desde el endpoint de produccion

Existe un endpoint protegido para iniciar las tres fuentes desde Vercel. No
escribas el secreto directamente en el historial de PowerShell.

```powershell
$secureSecret = Read-Host "SYNC_SECRET" -AsSecureString
$secret = [System.Net.NetworkCredential]::new("", $secureSecret).Password

Invoke-RestMethod `
  -Method Post `
  -Uri "https://conciertos-gdl.vercel.app/api/sync" `
  -Headers @{ "x-sync-secret" = $secret }

Remove-Variable secret
Remove-Variable secureSecret
```

El metodo local con `npm run sync:events` es el recomendado. Una ejecucion remota
puede alcanzar el limite de duracion de Vercel cuando Ticketmaster tarda mucho.

## Frecuencia recomendada

- Operacion normal: una vez al dia.
- Temporadas con muchos anuncios: dos veces al dia.
- Evento faltante o cambio importante: ejecutar la fuente correspondiente.

Evita ejecutar varias sincronizaciones al mismo tiempo. Aunque los `upsert`
protegen contra duplicados de la misma fuente, las ejecuciones concurrentes
generan carga innecesaria y dificultan interpretar resultados.

## Que hace el sincronizador

Para cada evento valido:

1. Busca el evento por fuente e identificador externo.
2. Detecta posibles duplicados entre fuentes usando titulo, fecha y recinto.
3. Crea o reutiliza el recinto.
4. Crea o reutiliza artistas cuando la fuente los proporciona.
5. Crea el evento nuevo o actualiza el existente.

La cobertura actual se limita a conciertos de Guadalajara y su zona
metropolitana. Ticketmaster usa un radio geografico; Visit Jalisco y
Superboletos aplican filtros de ciudad y contenido musical.

## Limitaciones actuales

1. Un evento retirado completamente de una fuente no se elimina automaticamente.
2. Un evento futuro cancelado puede permanecer visible si la fuente deja de
   entregarlo sin marcarlo como cancelado.
3. La deteccion entre fuentes depende de que titulo, fecha y recinto sean
   suficientemente parecidos.
4. Algunos proveedores agrupan varias funciones bajo un solo identificador.
5. Cambios en el HTML o en el catalogo de una fuente pueden requerir actualizar
   su adaptador.

Por estas razones conviene revisar visualmente la cartelera despues de cada
sincronizacion y comprobar eventos especialmente importantes.

## Solucion de problemas

### Falta `TICKETMASTER_API_KEY`

Confirma que la variable exista en `.env.local` y que no tenga comillas o texto
adicional dentro del valor.

### Error de conexion con Neon

Revisa `DATABASE_URL`, la conexion a internet y el estado del proyecto en Neon.
No reemplaces la URL sin confirmar primero a que base apunta.

### Una fuente devuelve 401 o 403

- `401` en Ticketmaster suele indicar una API key invalida.
- `403` puede indicar un bloqueo temporal o un cambio del proveedor.
- No repitas el comando continuamente; espera unos minutos y prueba una vez mas.

### Visit Jalisco o Superboletos devuelve cero

Abre la pagina oficial para confirmar que su cartelera este disponible. Si hay
eventos visibles pero el script obtiene cero, probablemente cambio la estructura
de la fuente.

### Advertencia SSL de PostgreSQL

Puede aparecer una advertencia sobre futuros cambios de `sslmode`. Si el comando
termina con el resumen de sincronizacion, la carga se completo. La advertencia no
equivale a un fallo, pero debe revisarse al actualizar `pg` en el futuro.

### El comando se interrumpe

Ejecuta cada fuente por separado para identificar cual fallo. Los eventos ya
guardados antes del error permanecen en Neon; no es necesario restaurarlos.

## Acciones que no corresponden a una actualizacion normal

No ejecutes estos pasos para actualizar solamente la cartelera:

- No borres registros manualmente en Neon.
- No ejecutes migraciones de Prisma.
- No cambies variables de Vercel.
- No despliegues nuevamente la aplicacion.
- No edites identificadores externos.
- No ejecutes `git reset` ni comandos destructivos.

Esas acciones pertenecen al mantenimiento del software, no a la carga cotidiana
de eventos.

## Publicar cambios de codigo en produccion

Publica solamente cuando cambie el codigo, el esquema Prisma, las dependencias o
la configuracion de la aplicacion. Una sincronizacion de eventos no requiere este
procedimiento.

### Comprobaciones previas

Desde la raiz del proyecto ejecuta:

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

Los tres comandos deben terminar sin errores. Revisa tambien los archivos
modificados:

```powershell
git status --short
git diff --check
```

`git diff --check` no debe reportar errores de espacios. `git status` puede
mostrar cambios intencionales, pero debes reconocerlos antes de desplegar.

### Despliegue con Vercel

El proyecto actual ya esta vinculado con Vercel mediante `.vercel/project.json`.
Para publicar una nueva version ejecuta:

```powershell
npx vercel --prod --yes
```

Espera hasta ver que el despliegue esta `READY` y que el alias fue asignado a:

```text
https://conciertos-gdl.vercel.app
```

Durante el despliegue, Vercel ejecuta `npm run vercel-build`, que a su vez hace:

```text
prisma generate
prisma migrate deploy
next build
```

Por eso una migracion nueva se aplica antes de publicar la aplicacion. Si la
migracion o el build falla, Vercel no debe reemplazar la version productiva.

### Primera vinculacion en otra computadora

Si el proyecto no esta vinculado en una computadora nueva:

```powershell
npm install
npx vercel login
npx vercel link
```

Selecciona el equipo y proyecto existentes. No crees otro proyecto con el mismo
nombre por accidente. Despues ejecuta el despliegue productivo normal.

### Verificacion posterior

1. Abre la pagina principal.
2. Busca un evento conocido de cada fuente.
3. Abre el detalle de al menos un evento.
4. Confirma que el enlace oficial funcione.
5. Revisa que las imagenes carguen.
6. Consulta la API:

```powershell
Invoke-RestMethod "https://conciertos-gdl.vercel.app/api/events?q=Cristian"
```

Si Vercel marca el despliegue como correcto pero la pagina falla, revisa los logs
del deployment desde el panel de Vercel antes de intentar otro despliegue.

## Configuracion de variables en Vercel

Produccion necesita estas variables:

| Variable | Uso | Obligatoria |
| --- | --- | --- |
| `DATABASE_URL` | Conexion PostgreSQL de Neon | Si |
| `TICKETMASTER_API_KEY` | Consulta de Ticketmaster | Si |
| `SYNC_SECRET` | Proteccion de `/api/sync` | Si |
| `SUPERBOLETOS_CATALOG_URL` | Sobrescribir el catalogo publico | No |

La forma mas clara de configurarlas es desde el panel de Vercel:

1. Abre el proyecto `conciertos-gdl`.
2. Entra a `Settings` y despues `Environment Variables`.
3. Agrega cada variable para el ambiente `Production`.
4. Marca claves y secretos como sensibles.
5. Realiza un nuevo despliegue despues de cambiar variables.

No agregues comillas adicionales dentro del valor. Por ejemplo, Vercel debe
guardar la API key, no los caracteres `"` que la rodean en un archivo `.env`.

Puedes generar un secreto fuerte para `SYNC_SECRET` con PowerShell:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Guarda el resultado en un administrador de contrasenas. Cambiar `SYNC_SECRET`
invalida inmediatamente el valor anterior.

## Consultar Web Analytics

La aplicacion incluye el paquete oficial `@vercel/analytics` y registra
automaticamente visitas y paginas vistas una vez habilitado Web Analytics en el
panel de Vercel.

Para activarlo:

1. Abre el proyecto `conciertos-gdl` en Vercel.
2. Selecciona `Analytics` en la barra lateral.
3. Presiona `Enable` en la parte superior.
4. Publica o vuelve a desplegar la aplicacion.
5. Visita la pagina y espera a que Vercel procese los primeros datos.

En el plan Hobby se incluyen hasta 50,000 eventos por mes y un mes de historial.
Al alcanzar el limite, Vercel pausa la recopilacion en lugar de generar cargos.
Los eventos personalizados y filtros UTM de Vercel no estan incluidos en Hobby.

## Base de datos Neon

### Conexion

`DATABASE_URL` debe ser una cadena PostgreSQL proporcionada por Neon y usar SSL:

```text
postgresql://USUARIO:CONTRASENA@HOST/BASE?sslmode=require
```

No copies la cadena real en documentacion, tickets, capturas o commits. La misma
URL se configura en `.env.local` para operacion local y en Vercel para produccion.

Antes de ejecutar un comando de Prisma, recuerda que este proyecto apunta a la
base indicada por `DATABASE_URL`. Con la configuracion actual, eso significa que
los comandos pueden modificar produccion.

### Generar el cliente Prisma

Ejecuta esto despues de cambiar `schema.prisma` o instalar dependencias:

```powershell
npm run db:generate
```

Este comando genera codigo local. No modifica tablas ni datos en Neon.

### Crear una migracion durante desarrollo

Cuando cambie el esquema Prisma, crea una migracion con un nombre descriptivo:

```powershell
npm run db:migrate -- --name nombre_del_cambio
```

Antes de usar `migrate dev`, confirma que `DATABASE_URL` apunte al ambiente de
desarrollo correcto. `migrate dev` no es el comando recomendado para aplicar
cambios directamente en produccion.

Revisa siempre el SQL generado dentro de `prisma/migrations` antes de publicarlo.
Presta especial atencion a instrucciones `DROP`, cambios de tipo y columnas que
se vuelvan obligatorias.

### Aplicar migraciones existentes

Para aplicar en Neon solamente las migraciones ya versionadas:

```powershell
npm run db:deploy
```

En el flujo normal de publicacion no necesitas ejecutarlo manualmente porque
`vercel-build` ya ejecuta `prisma migrate deploy`. Puede utilizarse manualmente
cuando necesites validar la migracion antes del despliegue.

### Primera inicializacion de una base vacia

1. Crea el proyecto y la base PostgreSQL en Neon.
2. Copia la cadena de conexion con SSL a `.env.local`.
3. Ejecuta `npm install`.
4. Ejecuta `npm run db:generate`.
5. Ejecuta `npm run db:deploy`.
6. Configura la misma `DATABASE_URL` en Vercel.
7. Ejecuta `npm run sync:events` para la carga inicial.
8. Verifica eventos y recintos antes de anunciar la aplicacion.

### Respaldo antes de cambios riesgosos

Antes de una migracion destructiva, crea una rama de base de datos o un respaldo
desde Neon. Anota la fecha, la rama de origen y la migracion que vas a aplicar.

Una reversión de Vercel no revierte el esquema ni los datos de Neon. Si una
migracion ya se aplico, la recuperacion debe hacerse con una migracion correctiva
o restaurando una rama o respaldo validado.

Nunca ejecutes `prisma migrate reset` contra produccion: elimina los datos.

## Flujo completo para un lanzamiento

Usa esta secuencia cuando una version incluya codigo y cambios de base de datos:

1. Revisa el cambio y el SQL de las migraciones.
2. Crea un respaldo o rama de Neon si existe riesgo de perdida de datos.
3. Ejecuta lint, TypeScript y build local.
4. Confirma las variables de produccion necesarias.
5. Ejecuta `npx vercel --prod --yes`.
6. Confirma que las migraciones y el build terminaron correctamente.
7. Verifica la pagina, API, detalles, imagenes y enlaces.
8. Ejecuta la sincronizacion si la nueva version agrega una fuente.
9. Registra el despliegue y cualquier observacion.

## Recuperacion ante un despliegue defectuoso

Si el problema esta solamente en el codigo:

1. Identifica el ultimo deployment estable en Vercel.
2. Promuevelo nuevamente a produccion desde el panel.
3. Verifica la URL principal.
4. Corrige el codigo en el repositorio antes del siguiente despliegue.

Si tambien hubo una migracion, no promociones una version antigua sin comprobar
que sea compatible con el esquema actual. Las migraciones requieren una
evaluacion separada y normalmente se corrigen hacia adelante.

Si se expuso una clave, rotala en su proveedor, actualiza Vercel y `.env.local`,
y vuelve a desplegar. Eliminarla solamente del codigo o del historial visible no
es suficiente.

## Registro operativo sugerido

Anota cada ejecucion en un registro sencillo:

```text
Fecha y hora:
Responsable:
Ticketmaster: fetched / created / updated / duplicates
Visit Jalisco: fetched / created / updated / duplicates
Superboletos: fetched / created / updated / duplicates
Eventos comprobados en la pagina:
Errores u observaciones:
```

Esto ayuda a detectar caidas graduales de una fuente y a saber cuando se realizo
la ultima actualizacion exitosa.

## Mejora futura recomendada

El siguiente paso operativo es programar una ejecucion diaria con un servicio de
automatizacion y conservar una alerta cuando alguna fuente falle o devuelva cero.
Antes de automatizar tambien conviene implementar estados de cancelacion y una
politica controlada para eventos que desaparecen de su fuente.
