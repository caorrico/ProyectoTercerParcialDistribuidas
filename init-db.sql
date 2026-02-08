-- Crear extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear bases de datos para cada microservicio
CREATE DATABASE auth_db;
CREATE DATABASE pedidos_db;
CREATE DATABASE fleet_db;
CREATE DATABASE billing_db;
CREATE DATABASE notifications_db;

-- Otorgar permisos al usuario logiflow
GRANT ALL PRIVILEGES ON DATABASE auth_db TO logiflow;
GRANT ALL PRIVILEGES ON DATABASE pedidos_db TO logiflow;
GRANT ALL PRIVILEGES ON DATABASE fleet_db TO logiflow;
GRANT ALL PRIVILEGES ON DATABASE billing_db TO logiflow;
GRANT ALL PRIVILEGES ON DATABASE notifications_db TO logiflow;
