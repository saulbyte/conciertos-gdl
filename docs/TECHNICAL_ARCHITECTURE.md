# Technical Architecture

## Stack tecnológico

Frontend:

* Next.js 15
* TypeScript
* TailwindCSS

Backend:

* Next.js API Routes

Base de datos:

* PostgreSQL (Neon)

ORM:

* Prisma

Hosting:

* Vercel

---

## Estructura del proyecto

src/

app/
page.tsx
event/[id]/page.tsx

components/
EventCard.tsx
SearchBar.tsx
VenueBadge.tsx

lib/
ticketmaster.ts
prisma.ts

app/api/
events/
sync/

---

## Entidades

Venue

* id
* name
* city
* createdAt

Artist

* id
* name
* createdAt

Event

* id
* externalId
* title
* description
* eventDate
* imageUrl
* source
* sourceUrl
* venueId
* createdAt

---

## Integración Ticketmaster

Crear servicio:

ticketmaster.ts

Responsabilidades:

* Consultar eventos.
* Normalizar respuesta.
* Evitar duplicados.
* Persistir eventos.

---

## API interna

GET /api/events

Lista eventos.

GET /api/events/{id}

Detalle evento.

POST /api/sync/ticketmaster

Sincronización manual.

---

## Reglas importantes

* No usar Redux.
* No usar microservicios.
* No usar Docker en MVP.
* No implementar autenticación.
* No implementar IA.

Mantener arquitectura simple.

Optimizar para velocidad de desarrollo y validación de mercado.
