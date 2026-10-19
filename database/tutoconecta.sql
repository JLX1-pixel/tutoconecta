-- TutoConecta: esquema relacional para PostgreSQL (prototipo académico)
-- CREATE DATABASE requiere una sesión con permisos administrativos.
CREATE DATABASE tutoconecta;
\connect tutoconecta
CREATE TABLE usuarios (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nombre VARCHAR(120) NOT NULL,
 correo VARCHAR(160) NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 rol VARCHAR(12) NOT NULL CHECK (rol IN ('estudiante','tutor')),
 activo BOOLEAN NOT NULL DEFAULT TRUE,
 creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE perfiles_estudiante (
 usuario_id BIGINT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
 programa VARCHAR(120), nivel VARCHAR(80), biografia TEXT
);
CREATE TABLE perfiles_tutor (
 usuario_id BIGINT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
 biografia TEXT NOT NULL DEFAULT '', experiencia_anios SMALLINT NOT NULL DEFAULT 0 CHECK (experiencia_anios >= 0),
 precio_hora NUMERIC(10,2) NOT NULL CHECK (precio_hora >= 0), calificacion_promedio NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (calificacion_promedio BETWEEN 0 AND 5),
 ubicacion VARCHAR(180), verificado BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE materias (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nombre VARCHAR(100) NOT NULL UNIQUE, descripcion TEXT
);
CREATE TABLE tutor_materia (
 tutor_id BIGINT NOT NULL REFERENCES perfiles_tutor(usuario_id) ON DELETE CASCADE,
 materia_id BIGINT NOT NULL REFERENCES materias(id) ON DELETE RESTRICT,
 nivel VARCHAR(80) NOT NULL DEFAULT 'Todos', PRIMARY KEY(tutor_id,materia_id)
);
CREATE TABLE disponibilidades (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 tutor_id BIGINT NOT NULL REFERENCES perfiles_tutor(usuario_id) ON DELETE CASCADE,
 dia_semana SMALLINT NOT NULL CHECK(dia_semana BETWEEN 0 AND 6),
 hora_inicio TIME NOT NULL, hora_fin TIME NOT NULL,
 modalidad VARCHAR(12) NOT NULL CHECK(modalidad IN ('virtual','presencial','ambas')),
 CHECK(hora_fin > hora_inicio), UNIQUE(tutor_id,dia_semana,hora_inicio,hora_fin)
);
CREATE TABLE reservas (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 estudiante_id BIGINT NOT NULL REFERENCES perfiles_estudiante(usuario_id) ON DELETE RESTRICT,
 tutor_id BIGINT NOT NULL REFERENCES perfiles_tutor(usuario_id) ON DELETE RESTRICT,
 materia_id BIGINT NOT NULL REFERENCES materias(id) ON DELETE RESTRICT,
 inicio TIMESTAMPTZ NOT NULL, duracion_minutos SMALLINT NOT NULL DEFAULT 60 CHECK(duracion_minutos BETWEEN 30 AND 240),
 modalidad VARCHAR(12) NOT NULL CHECK(modalidad IN ('virtual','presencial')),
 estado VARCHAR(12) NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente','confirmada','rechazada','cancelada','completada')),
 precio NUMERIC(10,2) NOT NULL CHECK(precio >= 0), creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(estudiante_id <> tutor_id)
);
CREATE TABLE sesiones (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 reserva_id BIGINT NOT NULL UNIQUE REFERENCES reservas(id) ON DELETE CASCADE,
 enlace_virtual TEXT, ubicacion VARCHAR(240), notas TEXT,
 CHECK(enlace_virtual IS NULL OR length(enlace_virtual)>5),
 CHECK(ubicacion IS NULL OR length(ubicacion)>2)
);
CREATE TABLE calificaciones (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 reserva_id BIGINT NOT NULL UNIQUE REFERENCES reservas(id) ON DELETE CASCADE,
 estudiante_id BIGINT NOT NULL REFERENCES perfiles_estudiante(usuario_id) ON DELETE RESTRICT,
 puntuacion SMALLINT NOT NULL CHECK(puntuacion BETWEEN 1 AND 5), comentario TEXT,
 creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE notificaciones (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 titulo VARCHAR(160) NOT NULL, mensaje TEXT NOT NULL,
 leida BOOLEAN NOT NULL DEFAULT FALSE, creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Impide crear el subtipo de perfil con un rol distinto al usuario.
CREATE FUNCTION validar_rol_perfil() RETURNS TRIGGER AS $$
DECLARE rol_usuario VARCHAR(12);
BEGIN
 SELECT rol INTO rol_usuario FROM usuarios WHERE id = NEW.usuario_id;
 IF (TG_TABLE_NAME = 'perfiles_estudiante' AND rol_usuario <> 'estudiante') OR
    (TG_TABLE_NAME = 'perfiles_tutor' AND rol_usuario <> 'tutor') THEN
   RAISE EXCEPTION 'El tipo de perfil debe coincidir con el rol del usuario';
 END IF;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_rol_perfil_estudiante BEFORE INSERT OR UPDATE ON perfiles_estudiante
FOR EACH ROW EXECUTE FUNCTION validar_rol_perfil();
CREATE TRIGGER trg_rol_perfil_tutor BEFORE INSERT OR UPDATE ON perfiles_tutor
FOR EACH ROW EXECUTE FUNCTION validar_rol_perfil();
-- No permite cambiar el rol cuando ya existe el perfil del otro tipo.
CREATE FUNCTION proteger_rol_usuario() RETURNS TRIGGER AS $$
BEGIN
 IF NEW.rol <> OLD.rol AND
    ((NEW.rol = 'tutor' AND EXISTS (SELECT 1 FROM perfiles_estudiante WHERE usuario_id = OLD.id)) OR
     (NEW.rol = 'estudiante' AND EXISTS (SELECT 1 FROM perfiles_tutor WHERE usuario_id = OLD.id))) THEN
   RAISE EXCEPTION 'Elimine primero el perfil incompatible antes de cambiar el rol';
 END IF;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_proteger_rol_usuario BEFORE UPDATE OF rol ON usuarios
FOR EACH ROW EXECUTE FUNCTION proteger_rol_usuario();
-- Cada sesión debe tener el dato de acceso que exige la modalidad reservada.
CREATE FUNCTION validar_datos_sesion() RETURNS TRIGGER AS $$
DECLARE modalidad_reserva VARCHAR(12);
BEGIN
 SELECT modalidad INTO modalidad_reserva FROM reservas WHERE id = NEW.reserva_id;
 IF modalidad_reserva = 'virtual' AND NEW.enlace_virtual IS NULL THEN
   RAISE EXCEPTION 'Una sesión virtual requiere enlace_virtual';
 ELSIF modalidad_reserva = 'presencial' AND NEW.ubicacion IS NULL THEN
   RAISE EXCEPTION 'Una sesión presencial requiere ubicacion';
 END IF;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_datos_sesion BEFORE INSERT OR UPDATE ON sesiones
FOR EACH ROW EXECUTE FUNCTION validar_datos_sesion();
CREATE INDEX idx_reservas_estudiante_inicio ON reservas(estudiante_id,inicio DESC);
CREATE INDEX idx_reservas_tutor_inicio ON reservas(tutor_id,inicio DESC);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_disponibilidad_tutor_dia ON disponibilidades(tutor_id,dia_semana);
CREATE INDEX idx_notificaciones_usuario_fecha ON notificaciones(usuario_id,creada_en DESC);
CREATE INDEX idx_tutores_calificacion ON perfiles_tutor(calificacion_promedio DESC);
-- Datos de demostración. Contraseñas ficticias: usar hashes reales en producción.
INSERT INTO materias(nombre,descripcion) VALUES
 ('Matemáticas','Cálculo, álgebra y estadística'),('Inglés','Conversación y gramática'),('Programación','Desarrollo web y algoritmos'),('Física','Mecánica y electromagnetismo');
INSERT INTO usuarios(nombre,correo,password_hash,rol) VALUES
 ('Carlos Martínez','carlos.demo@example.test','DEMO_HASH_NO_USAR','tutor'),
 ('Laura Pérez','laura.demo@example.test','DEMO_HASH_NO_USAR','tutor'),
 ('Andrés Gómez','andres.demo@example.test','DEMO_HASH_NO_USAR','tutor'),
 ('Sofía Rodríguez','sofia.demo@example.test','DEMO_HASH_NO_USAR','tutor'),
 ('Estudiante Demo','estudiante.demo@example.test','DEMO_HASH_NO_USAR','estudiante');
INSERT INTO perfiles_tutor(usuario_id,biografia,experiencia_anios,precio_hora,calificacion_promedio,ubicacion)
 SELECT id,'Tutoría personalizada y práctica.',5,45000,4.8,'Barranquilla' FROM usuarios WHERE rol='tutor';
INSERT INTO perfiles_estudiante(usuario_id,programa,nivel) SELECT id,'Ingeniería de Sistemas','Universidad' FROM usuarios WHERE correo='estudiante.demo@example.test';
INSERT INTO tutor_materia(tutor_id,materia_id)
 SELECT u.id,m.id FROM usuarios u JOIN materias m ON m.nombre=CASE u.nombre WHEN 'Carlos Martínez' THEN 'Matemáticas' WHEN 'Laura Pérez' THEN 'Inglés' WHEN 'Andrés Gómez' THEN 'Programación' ELSE 'Física' END WHERE u.rol='tutor';
-- Integridad adicional: la reseña solo se registra si la tutoría terminó y
-- la persona que califica es el estudiante asociado a esa reserva.
CREATE FUNCTION validar_calificacion_reserva() RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM reservas r
    WHERE r.id = NEW.reserva_id
      AND r.estudiante_id = NEW.estudiante_id
      AND r.estado = 'completada'
  ) THEN
    RAISE EXCEPTION 'Solo el estudiante de una reserva completada puede calificarla';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_calificacion_reserva
BEFORE INSERT OR UPDATE ON calificaciones
FOR EACH ROW EXECUTE FUNCTION validar_calificacion_reserva();
