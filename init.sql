-- Crear tipos ENUM para roles, categorías y estados
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE incident_category AS ENUM ('equipment', 'infrastructure', 'services', 'other');
CREATE TYPE incident_status AS ENUM ('pending', 'in_progress', 'resolved');

-- Crear la tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear la tabla de incidencias
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category incident_category NOT NULL,
    location VARCHAR(255) NOT NULL,
    status incident_status NOT NULL DEFAULT 'pending',
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Crear la tabla de imágenes de incidencias
CREATE TABLE incident_images (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incident
        FOREIGN KEY(incident_id)
        REFERENCES incidents(id)
        ON DELETE CASCADE
);

-- Crear una función de trigger para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar el trigger a la tabla de incidencias
CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON incidents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();