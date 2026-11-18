# TutoConecta

Plataforma web responsive para conectar estudiantes con tutores y reservar tutorías virtuales o presenciales. Prototipo académico de cliente; utiliza datos de demostración guardados en el navegador y no requiere backend.

## Datos académicos

- **Estudiante:** Louis Sleyth Acuña Mulford
- **Programa:** Ingeniería de Sistemas
- **Asignatura:** Desarrollo Web
- **Profesor:** Morillo Vergel Edgar
- **Universidad:** Universidad de la Costa
- **Ciudad:** Barranquilla
- **Año:** 2026

## Objetivo

Construir una experiencia web accesible y navegable que permita explorar tutores, solicitar tutorías, gestionar sesiones y consultar una propuesta relacional para una futura implementación.

## Funcionalidades

- Interfaz pública, autenticación simulada y selección de rol.
- Búsqueda de tutores por nombre/materia, nivel, modalidad y calificación.
- Perfiles, agenda de reserva, confirmación y lista de tutorías.
- Controles del tutor para solicitudes (aceptar/rechazar), materias y disponibilidad persistente por día y hora; las solicitudes aceptadas aparecen en agenda.
- Estados de reserva, notificaciones, reseñas y sala virtual simulada.
- Persistencia local mediante `localStorage` para perfil, materias, disponibilidad, reservas, solicitudes, agenda, reseñas y notificaciones; cerrar sesión elimina el usuario activo.
- Diseño adaptable y navegación compacta en móvil.

## Roles y rutas

- **Estudiante:** `panel-estudiante.html`, `buscar-tutores.html`, `perfil-tutor.html`, `modalidad.html`, `horario.html`, `reserva.html`, `mis-tutorias.html`, `detalle-tutoria.html`, `calificacion.html`.
- **Tutor:** `panel-tutor.html`, `perfil-profesional.html`, `materias.html`, `disponibilidad.html`, `solicitudes.html`, `agenda.html`, `historial.html`, `reputacion.html`.
- **Públicas:** `index.html`, `seleccion-rol.html`, `login.html`, `registro.html`, `recuperar-contrasena.html`.
- Otras vistas: `resultados.html`, `filtros.html`, `tutoria-presencial.html`, sala virtual del estudiante (`videollamada.html`) y del tutor (`videollamada-tutor.html`), notificaciones de estudiante y tutor (`notificaciones.html`, `notificaciones-tutor.html`), detalle de solicitud/sesión y configuración. La versión mantiene una ruta HTML independiente para cada interfaz solicitada.

## Tecnologías

HTML5, CSS3, JavaScript vanilla y `localStorage`. Sin frameworks, servicios externos, imágenes remotas ni dependencias de compilación.

## Estructura

```text
TutoConecta/
├── index.html y páginas HTML de cada vista
├── css/ (estilos.css, responsive.css)
├── js/ (datos.js, main.js, autenticacion.js, tutores.js, reservas.js)
├── assets/ (reservado para recursos locales)
├── database/ (tutoconecta.sql, diagrama-er.md)
├── docs/capturas/
└── README.md
```

## Ejecución local

1. Descarga o clona el proyecto.
2. Abre una terminal dentro de la carpeta `TutoConecta` y ejecuta `py -m http.server 8000` (Windows) o `python3 -m http.server 8000` (macOS/Linux).
3. Visita `http://localhost:8000` en tu navegador. Servirlo por HTTP mantiene disponible `localStorage` y refleja el comportamiento de un hosting estático.
4. Selecciona un rol y crea una cuenta de demostración. Los datos de las reservas y acciones quedan en el almacenamiento local de ese navegador.

No uses información real: la autenticación y los datos solo son una simulación académica.

## Flujos

### Estudiante

Inicio → selección de rol/registro → panel → buscar y filtrar tutores → perfil → modalidad → fecha y hora → confirmar → mis tutorías/detalle → sala virtual o ubicación → calificación.

### Tutor

Inicio → registro como tutor → panel → perfil profesional/materias/disponibilidad → solicitudes → aceptar o rechazar → agenda/detalle → videollamada → historial y reputación.

## Base de datos

`database/tutoconecta.sql` define usuarios y perfiles, materias y relación muchos a muchos, disponibilidades, reservas, sesiones, calificaciones y notificaciones, con restricciones, índices, validación de reseñas y datos demostrativos. Ejecuta el archivo completo desde `psql` con permisos para crear la base de datos; el script crea `tutoconecta` y cambia a esa base para crear las tablas. El diagrama compatible con GitHub está en `database/diagrama-er.md`.

## Publicación

El sitio es estático, no tiene dependencias de compilación y emplea rutas relativas. Publica el contenido de esta carpeta como raíz del sitio.

### GitHub Pages

1. Crea un repositorio vacío en GitHub y copia su URL HTTPS.
2. En una terminal, entra en la carpeta `TutoConecta` y ejecuta:

   ```sh
   git init
   git add .
   git commit -m "Publica TutoConecta"
   git branch -M main
   git remote add origin https://github.com/<USUARIO>/<REPOSITORIO>.git
   git push -u origin main
   ```

   Reemplaza el valor de `origin` por la URL del repositorio que creaste. Si ya existe un remoto, conserva su configuración y no repitas `git remote add`.
3. En el repositorio abre **Settings → Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**, selecciona `main` y la carpeta `/(root)`, y guarda.
5. Espera a que finalice el despliegue y abre el enlace que muestra GitHub Pages. Para un repositorio de proyecto suele seguir el formato `https://<USUARIO>.github.io/<REPOSITORIO>/`.

### Netlify

1. En Netlify selecciona **Add new site → Import an existing project** y conecta el repositorio.
2. Usa `.` como **Publish directory** y deja vacío **Build command**.
3. Selecciona **Deploy site**. Netlify mostrará la URL asignada al terminar.

### Vercel

1. En Vercel selecciona **Add New → Project** e importa el repositorio.
2. Elige **Other** como framework; deja vacío el comando de build y usa `.` como **Output Directory**.
3. Selecciona **Deploy** y usa la URL que Vercel muestre al completar la publicación.

- **URL de GitHub:** pendiente de crear el repositorio.
- **URL del hosting:** pendiente de publicación.

## Autoría

Louis Sleyth Acuña Mulford · Universidad de la Costa · Desarrollo Web · Profesor Morillo Vergel Edgar · 2026.
