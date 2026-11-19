# TutoConecta

**Autor:** Louis Sleyth Acuña Mulford · Universidad de la Costa · Desarrollo Web · 2026.

La versión final independiente está en **`app/`**: React + TypeScript, API Node.js/Express y PostgreSQL. Incluye registro por correo y contraseña propios, perfiles, búsqueda, disponibilidad, reservas, solicitudes, agenda, valoraciones y notificaciones. No requiere cuenta de ChatGPT.

- [Código de la aplicación](app/)
- [Configuración de Render](render.yaml)
- [Propuesta comercial y de IA](fullstack/docs/PROPUESTA.md)

## Estado de verificación

Compilación de producción y TypeScript completados. La nueva prueba de integración pasó 55 comprobaciones HTTP: registro, sesión, recuperación, roles, privacidad, conflictos de horario, cancelación, rechazo, finalización, valoraciones y notificaciones.

## Ejecución local

Requisitos: Node.js 22.12 o posterior, npm y PostgreSQL 18. Crear primero una base vacía.

```powershell
cd app
npm ci
$env:DATABASE_URL='postgresql://USUARIO:CLAVE@localhost:5432/tutoconecta'
$env:PORT='5180'
npm run build
npm start
```

Abrir http://127.0.0.1:5180. Las tablas se crean al iniciar dentro de una transacción. `.env.example` es una referencia: las variables deben establecerse en el entorno. `npm test` requiere el servidor local en ejecución y una base aislada; rechaza destinos remotos y limpia solo sus datos de prueba.

## Despliegue independiente

Aplicar `render.yaml` conectado al repositorio. Define un servicio web Node y PostgreSQL, ambos gratuitos en Virginia. `DATABASE_URL` se enlaza mediante la red privada. `/api/health` comprueba la base real. Tras aplicar el Blueprint, las actualizaciones de `main` se despliegan automáticamente.

El plan gratuito puede tardar aproximadamente un minuto al despertar tras inactividad. **La base PostgreSQL gratuita caduca 30 días después de su creación**: exportar o migrar los datos antes del vencimiento para conservarlos.

## Seguridad y alcance

Contraseñas con scrypt y sal aleatoria, sesiones opacas en cookie HttpOnly/SameSite (Secure en producción), consultas parametrizadas, control de origen y límites de intentos. Cada registro entrega un código privado de recuperación de un solo uso; no se envían correos de recuperación.

Las reservas virtuales enlazan Jitsi, que puede solicitar inicio de sesión al anfitrión. El usuario puede descargar el calendario o compartir un resumen por WhatsApp. No hay correos/SMS automáticos ni pagos. La IA generativa es una propuesta, no una función activa. El video de sustentación debe grabarlo el autor y añadir su enlace de YouTube a la entrega.

## Código

- `app/client`: interfaz y formularios de acceso.
- `app/server/auth.ts`: registro, contraseñas, sesiones y recuperación.
- `app/server/domain.ts`: reglas y endpoints de tutorías.
- `app/server/database.ts`: esquema PostgreSQL y transacciones.
- `app/scripts/test-api.ts`: pruebas de integración.

## Prototipo anterior

Las páginas HTML, carpetas `css`, `js` y `database` de la raíz se conservan como antecedente del parcial. `fullstack/` contiene la implementación anterior para Sites/Cloudflare. **Render despliega exclusivamente `app/`.** Las instrucciones del prototipo están en [README-prototipo.md](README-prototipo.md).

GitHub Pages puede mostrar el prototipo, pero no ejecutar el backend.
