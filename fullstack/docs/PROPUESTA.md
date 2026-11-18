# Propuesta comercial y funcionalidad de IA

TutoConecta conecta estudiantes y tutores para coordinar sesiones virtuales y presenciales. La primera versión cubre perfiles, búsqueda, disponibilidad, reservas, agenda y valoración. Autor: Louis Sleyth Acuña Mulford.

## Propuesta de IA generativa: preparación y seguimiento

Antes de una sesión, el estudiante escribiría la materia, su objetivo y los temas que le cuestan. Un servicio de IA generaría preguntas para el tutor y un breve plan de práctica. Después, con apuntes voluntarios del usuario, propondría ejercicios y un resumen de temas. El tutor revisaría las sugerencias. La IA no calificaría al estudiante ni sustituiría una explicación profesional.

Implementación futura: endpoint autenticado en el backend; clave del proveedor almacenada como secreto; límites de uso por cuenta; consentimiento para enviar apuntes al proveedor; evitar incluir correo, ubicación u otros datos de cuenta en el prompt. La interfaz debe identificar claramente el contenido generado y permitir corregirlo. No se envían datos a un modelo en la versión actual.

## Estimación de un desarrollo comercial posterior

Supuesto de planificación: un desarrollador, tarifa ilustrativa de COP 50.000 por hora. No constituye una cotización de terceros ni un precio consultado en el mercado.

| Trabajo | Horas | Costo estimado COP |
| --- | ---: | ---: |
| Refinamiento y experiencia de usuario | 12 | 600.000 |
| Frontend y adaptación móvil | 28 | 1.400.000 |
| Backend, permisos y base de datos | 32 | 1.600.000 |
| Integraciones externas | 16 | 800.000 |
| Pruebas, despliegue y documentación | 20 | 1.000.000 |
| Subtotal | 108 | 5.400.000 |
| Reserva de contingencia 15% | 16,2 | 810.000 |
| Total estimado | 124,2 | 6.210.000 |

Duración propuesta: cuatro semanas con aproximadamente 31 horas semanales. No describe horas ya trabajadas. Costos de dominio, alojamiento, correo, videoconferencia, API de IA, impuestos y mantenimiento se cotizan por separado según proveedor y uso.

Semana 1: requisitos, UX, esquema y autenticación. Semana 2: perfiles, búsqueda, horarios y reservas. Semana 3: notificaciones externas e IA con revisión humana. Semana 4: pruebas con usuarios, seguridad, despliegue y formación.

Posibles ingresos futuros: suscripción para tutores o comisión por reservas pagadas, previo diseño de pagos, cancelaciones y atención al usuario. No se realizan cobros en la versión académica.
