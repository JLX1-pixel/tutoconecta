# TutoConecta - aplicación con frontend y backend

Plataforma de tutorías virtuales y presenciales. Autor: **Louis Sleyth Acuña Mulford**, Universidad de la Costa, Desarrollo Web, profesor Morillo Vergel Edgar, 2026.

## Funciones

- Inicio de sesión gestionado por Sites y perfiles de estudiante, tutor o ambos.
- Catálogo con filtros por materia/nombre, nivel, ciudad, modalidad y fecha.
- Disponibilidad de una hora, solicitudes, aceptación, rechazo, cancelación e historial.
- Base de datos D1 persistente, autorización del servidor y prevención de doble reserva.
- Valoraciones de sesiones finalizadas y notificaciones internas.
- Sala virtual Jitsi, ubicación privada tras confirmar, calendario ICS y resumen para compartir por WhatsApp.
- Interfaz adaptable y ayuda integrada.

La IA es una propuesta documentada, no una integración activa. No se realizan cobros ni envíos automáticos por email/SMS/WhatsApp. El anfitrión puede necesitar iniciar sesión en Jitsi.

## Enlaces

Repositorio público: https://github.com/JLX1-pixel/tutoconecta

La carpeta `fullstack/` de ese repositorio contiene esta versión. El prototipo HTML anterior se conserva como antecedente y utiliza almacenamiento local; no es el backend de esta aplicación.

## Ejecutar localmente

Node.js >=22.13. Desde esta carpeta:

```sh
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_material_reaper.sql
npm run dev
```

Abrir la URL local que muestra la terminal (normalmente http://127.0.0.1:5173/). La migración inicial se aplica una sola vez a una base vacía. Tras modificar el esquema, generar una nueva migración con `npm run db:generate` y aplicar únicamente las pendientes.

El servidor de desarrollo simula el acceso con el usuario `local_seedy`, únicamente en loopback. El sitio publicado utiliza autenticación real del alojamiento. Opcionalmente, cargar datos ficticios locales con `node scripts/seed-local-demo.mjs`. Este script nunca usa la base remota.

## Verificación

```sh
npx tsc --noEmit
npm run build
npm start -- --port 8787
# En otra terminal:
node scripts/test-api.mjs
```

El script de integración solo admite localhost y simula las cabeceras del gateway sobre el Worker local. Verifica 31 solicitudes: identidad, origen, permisos, fechas, ubicación privada, conflictos, cancelación y nueva reserva, rechazo, notificaciones y bloqueo de finalización/valoración prematuras. No equivale a una prueba de videollamada entre dos personas.

## Despliegue

El archivo `.openai/hosting.json` identifica el Site y declara `DB`. El Worker compilado está en `dist/server/index.js` y los recursos web en `dist/client`. Sites aplica las migraciones y configura D1; la base de producción está separada de la local y comienza sin datos ficticios.

No usar GitHub Pages para ejecutar este backend. No exponer el Worker directamente sin un gateway que autentique y sanee las cabeceras de identidad. No guardar secretos ni datos reales en el repositorio.

## Documentación

- [Manual del sistema](docs/ARQUITECTURA.md)
- [Propuesta comercial y de IA](docs/PROPUESTA.md)
- [Guion para el video de sustentación](docs/GUION_VIDEO.md)

El video debe ser grabado por el estudiante y su enlace real debe incorporarse al PDF. Este repositorio no afirma que el video ya se haya publicado.
