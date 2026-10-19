# Diagrama entidad-relación de TutoConecta

```mermaid
erDiagram
  USUARIOS {
    bigint id PK
    varchar nombre
    varchar correo UK
    text password_hash
    varchar rol
    boolean activo
    timestamptz creado_en
  }
  PERFILES_ESTUDIANTE {
    bigint usuario_id PK,FK
    varchar programa
    varchar nivel
    text biografia
  }
  PERFILES_TUTOR {
    bigint usuario_id PK,FK
    text biografia
    smallint experiencia_anios
    numeric precio_hora
    numeric calificacion_promedio
    varchar ubicacion
    boolean verificado
  }
  MATERIAS {
    bigint id PK
    varchar nombre UK
    text descripcion
  }
  TUTOR_MATERIA {
    bigint tutor_id PK,FK
    bigint materia_id PK,FK
    varchar nivel
  }
  DISPONIBILIDADES {
    bigint id PK
    bigint tutor_id FK
    smallint dia_semana
    time hora_inicio
    time hora_fin
    varchar modalidad
  }
  RESERVAS {
    bigint id PK
    bigint estudiante_id FK
    bigint tutor_id FK
    bigint materia_id FK
    timestamptz inicio
    smallint duracion_minutos
    varchar modalidad
    varchar estado
    numeric precio
    timestamptz creada_en
  }
  SESIONES {
    bigint id PK
    bigint reserva_id FK,UK
    text enlace_virtual
    varchar ubicacion
    text notas
  }
  CALIFICACIONES {
    bigint id PK
    bigint reserva_id FK,UK
    bigint estudiante_id FK
    smallint puntuacion
    text comentario
    timestamptz creada_en
  }
  NOTIFICACIONES {
    bigint id PK
    bigint usuario_id FK
    varchar titulo
    text mensaje
    boolean leida
    timestamptz creada_en
  }
  USUARIOS ||--o| PERFILES_ESTUDIANTE : tiene
  USUARIOS ||--o| PERFILES_TUTOR : tiene
  PERFILES_TUTOR ||--o{ TUTOR_MATERIA : ofrece
  MATERIAS ||--o{ TUTOR_MATERIA : incluye
  PERFILES_TUTOR ||--o{ DISPONIBILIDADES : configura
  PERFILES_ESTUDIANTE ||--o{ RESERVAS : solicita
  PERFILES_TUTOR ||--o{ RESERVAS : atiende
  MATERIAS ||--o{ RESERVAS : corresponde
  RESERVAS ||--o| SESIONES : genera
  RESERVAS ||--o| CALIFICACIONES : recibe
  PERFILES_ESTUDIANTE ||--o{ CALIFICACIONES : escribe
  USUARIOS ||--o{ NOTIFICACIONES : recibe
```

Los perfiles extienden `usuarios` y el SQL valida que el subtipo coincida con el rol. Las tutorías conectan estudiante, tutor y materia. La restricción única de `calificaciones.reserva_id` limita a una reseña por reserva; un trigger exige que califique el estudiante asociado después de completar la tutoría. Las sesiones validan enlace o ubicación según la modalidad.
