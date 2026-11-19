# Guion de sustentación - duración sugerida: 8 a 10 minutos

Autor y presentador: Louis Sleyth Acuña Mulford. Grabar la aplicación y narrar con tus palabras. Usar cuentas de prueba y comprobar audio antes de publicar.

1. **0:00-0:45. Presentación.** Nombre, universidad, asignatura y problema: encontrar tutor y coordinar horarios. Explicar roles de estudiante y tutor.
2. **0:45-1:30. Acceso y perfil.** Mostrar el sitio desplegado, iniciar sesión y configurar el rol, materia y ciudad. Mostrar el registro propio y explicar el código de recuperación sin mostrar su valor en el video. El perfil y las sesiones se guardan en PostgreSQL.
3. **1:30-3:00. Recorrido del estudiante.** Buscar materia, aplicar filtros, abrir perfil, seleccionar una hora y solicitar tutoría con un objetivo. Mostrar la reserva pendiente y la notificación.
4. **3:00-4:30. Recorrido del tutor.** En una segunda cuenta de prueba, publicar disponibilidad, consultar solicitudes y aceptar. Regresar al estudiante y actualizar para mostrar la confirmación.
5. **4:30-5:30. Sesión.** Mostrar detalle, calendario y acceso a Jitsi. Si se demuestra una videollamada, preparar previamente el acceso del anfitrión y un segundo participante. Mostrar ubicación de una sesión presencial ya confirmada sin datos personales reales.
6. **5:30-6:15. Cierre y valoración.** Usar una sesión de prueba cuya hora ya terminó. El tutor la finaliza y el estudiante envía una valoración. Explicar por qué no se permiten reseñas antes de finalizar.
7. **6:15-8:00. Código.** Mostrar `app/client/App.tsx` (formulario y fetch), `app/server/domain.ts` (autorización y estados), `app/server/database.ts` (tablas e índices únicos) y `app/server/auth.ts` (contraseñas y sesiones). Explicar cómo se evita una doble reserva y por qué los datos no quedan solo en el navegador.
8. **8:00-9:00. Calidad y alcance.** Mostrar las pruebas, la versión móvil y los enlaces de GitHub y despliegue. Distinguir la propuesta de IA de las funciones implementadas y aclarar que WhatsApp es un envío iniciado por el usuario.
9. **9:00-9:30. Cierre.** Resumir el resultado y mejoras futuras. Publicar en YouTube como público o no listado, comprobar el enlace desde una sesión sin acceso a tu cuenta y añadirlo al PDF.

No afirmar que existe un video publicado hasta disponer de su URL real. El guion no reemplaza la sustentación grabada.

## Preparación antes de grabar

- Abre https://tutoconecta-louis-qfs1.onrender.com y espera a que despierte.
- Crea dos cuentas que controles: tutor y estudiante. Guarda los códigos fuera de la grabación.
- Publica horarios futuros y deja una tutoría aceptada cuyo fin ya haya transcurrido para demostrar la valoración. No cambies el reloj ni la base de producción para fingir una sesión.
- Usa dos perfiles de navegador para mantener ambas sesiones. Prepara Jitsi si deseas mostrar una llamada real.
- Oculta contraseñas, códigos de recuperación, correos privados y variables de entorno.
- Publica como público o no listado. Abre el enlace sin iniciar sesión para comprobar que el profesor puede verlo.
- Añade el enlace real en el PDF antes de subirlo al aula.
