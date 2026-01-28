# LogiFlow - Plataforma de Gestión de Delivery Multinivel

## Fases 2 y 3: Backend GraphQL + RabbitMQ + Frontend

Sistema de microservicios para gestión de operaciones de delivery con GraphQL, RabbitMQ y WebSocket.

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (React + Apollo Client)                       │
│                       Puerto: 3000                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                                │
│              (Express + WebSocket + Proxy)                       │
│                       Puerto: 4000                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  /auth → Auth Service     /pedidos → Pedido Service     │    │
│  │  /fleet → Fleet Service   /billing → Billing Service    │    │
│  │  /notifications → Notification Service                   │    │
│  │  /ws → WebSocket Server                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────┬──────────┬──────────┬──────────┬────────────────────┘
            │          │          │          │
     ┌──────┴──┐  ┌────┴────┐ ┌───┴───┐  ┌───┴───┐
     ▼         ▼  ▼         ▼ ▼       ▼  ▼       ▼
┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────────┐
│  Auth   ││ Pedido  ││  Fleet  ││ Billing ││Notification │
│ Service ││ Service ││ Service ││ Service ││   Service   │
│ :4001   ││ :4002   ││ :4003   ││ :4004   ││   :4005     │
│ GraphQL ││ GraphQL ││ GraphQL ││ GraphQL ││   REST      │
└────┬────┘└────┬────┘└────┬────┘└────┬────┘└──────┬──────┘
     │          │          │          │            │
     │          └──────────┴──────────┴────────────┤
     │                      │                      │
     ▼                      ▼                      ▼
┌─────────┐          ┌─────────────┐        ┌──────────┐
│PostgreSQL│          │  RabbitMQ   │        │PostgreSQL│
│ (Auth)   │          │   :5672     │        │ (Notif)  │
└──────────┘          └─────────────┘        └──────────┘
```

---

## Microservicios

| Servicio                       | Puerto | Tecnología              | Descripción                                     |
| ------------------------------ | ------ | ------------------------ | ------------------------------------------------ |
| **API Gateway**          | 4000   | Express + WS             | Punto de entrada único, WebSocket broadcast     |
| **Auth Service**         | 4001   | Apollo Server            | Autenticación JWT, gestión de usuarios y roles |
| **Pedido Service**       | 4002   | Apollo Server + RabbitMQ | CRUD de pedidos, eventos asíncronos             |
| **Fleet Service**        | 4003   | Apollo Server + RabbitMQ | Gestión de vehículos y repartidores            |
| **Billing Service**      | 4004   | Apollo Server + RabbitMQ | Facturación con cálculo de impuestos           |
| **Notification Service** | 4005   | Express + RabbitMQ       | Consumidor de eventos, notificaciones            |
| **Frontend**             | 3000   | React + Vite             | Panel de control con Apollo Client               |

---

## Requisitos Previos

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **RabbitMQ** >= 3.x
- **npm** o **yarn**

---

## Instalación y Configuración

### 1. Clonar/Descargar el Proyecto

```bash
cd ProyectoTercerParcial
```

### 2. Instalar PostgreSQL

**Windows (usando chocolatey):**

```bash
choco install postgresql
```

**Crear las bases de datos:**

```sql
CREATE DATABASE logiflow_auth;
CREATE DATABASE logiflow_pedidos;
CREATE DATABASE logiflow_fleet;
CREATE DATABASE logiflow_billing;
CREATE DATABASE logiflow_notifications;
```

### 3. Instalar RabbitMQ

**Windows (usando chocolatey):**

```bash
choco install rabbitmq
```

**Iniciar RabbitMQ:**

```bash
rabbitmq-server
```

Acceder al panel de administración: http://localhost:15672 (guest/guest)

### 4. Configurar Variables de Entorno

Copiar los archivos `.env.example` a `.env` en cada servicio:

```bash
# En cada carpeta de servicio
copy .env.example .env
```

**Configuración típica (.env):**

```env
PORT=400X
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=logiflow_xxx
RABBITMQ_URL=amqp://guest:guest@localhost:5672
JWT_SECRET=logiflow-secret-key-2024
NODE_ENV=development
```

### 5. Instalar Dependencias

```bash
# Auth Service
cd auth-service
npm install

# Pedido Service
cd ../pedido-service
npm install

# Fleet Service
cd ../fleet-service
npm install

# Billing Service
cd ../billing-service
npm install

# Notification Service
cd ../notification-service
npm install

# API Gateway
cd ../api-gateway
npm install

# Frontend
cd ../frontend
npm install
```

**O ejecutar todo con un script:**

```bash
# Desde la raíz del proyecto
for dir in auth-service pedido-service fleet-service billing-service notification-service api-gateway frontend; do
  cd $dir && npm install && cd ..
done
```

### 6. Iniciar los Servicios

**Opción A: Iniciar cada servicio individualmente (en terminales separadas):**

```bash
# Terminal 1 - Auth Service
cd auth-service && npm run dev

# Terminal 2 - Pedido Service
cd pedido-service && npm run dev

# Terminal 3 - Fleet Service
cd fleet-service && npm run dev

# Terminal 4 - Billing Service
cd billing-service && npm run dev

# Terminal 5 - Notification Service
cd notification-service && npm run dev

# Terminal 6 - API Gateway
cd api-gateway && npm run dev

# Terminal 7 - Frontend
cd frontend && npm run dev
```

**Opción B: Usar Docker Compose (ver sección Docker)**

---

## Uso del Sistema

### Acceso a los Servicios

| Servicio          | URL                    |
| ----------------- | ---------------------- |
| Frontend          | http://localhost:3000  |
| API Gateway       | http://localhost:4000  |
| WebSocket         | ws://localhost:4000/ws |
| Auth GraphQL      | http://localhost:4001  |
| Pedidos GraphQL   | http://localhost:4002  |
| Fleet GraphQL     | http://localhost:4003  |
| Billing GraphQL   | http://localhost:4004  |
| Notifications API | http://localhost:4005  |
| RabbitMQ Admin    | http://localhost:15672 |

### Flujo de Autenticación

1. **Registro de usuario:**

```graphql
mutation {
  register(input: {
    username: "cliente1"
    email: "cliente1@email.com"
    password: "123456"
    rol: ROLE_CLIENTE
  }) {
    token
    usuario {
      id
      username
      roles
    }
  }
}
```

2. **Login:**

```graphql
mutation {
  login(input: {
    username: "cliente1"
    password: "123456"
  }) {
    token
    usuario {
      id
      username
      roles
    }
  }
}
```

3. Usar el token en el header: `Authorization: Bearer <token>`

### Ejemplos de Consultas GraphQL

**Crear Pedido (Pedido Service - :4002):**

```graphql
mutation {
  crearPedido(input: {
    clienteId: 1
    direccionOrigen: "Av. Amazonas N23-45, Quito"
    direccionDestino: "Calle García Moreno S1-23, Cuenca"
    descripcion: "Paquete electrónico frágil"
    tipoEntrega: NACIONAL
  }) {
    id
    codigo
    estado
    createdAt
  }
}
```

**Crear Vehículo (Fleet Service - :4003):**

```graphql
mutation {
  crearMoto(input: {
    placa: "ABC-123"
    marca: "Yamaha"
    modelo: "YZF-R3"
    color: "Azul"
    anioFabricacion: "2023"
    cilindraje: 321
    tipoMoto: DEPORTIVA
    tieneCasco: true
  }) {
    id
    placa
    estado
  }
}
```

**Generar Factura (Billing Service - :4004):**

```graphql
mutation {
  generarFactura(input: {
    pedidoId: 1
    clienteId: 1
    subtotal: 50.00
  }) {
    id
    numeroFactura
    subtotal
    impuestos
    total
    estado
  }
}
```

**Consulta Dashboard (Pedido Service - :4002):**

```graphql
query {
  estadisticasPedidos {
    total
    recibidos
    asignados
    enRuta
    entregados
    cancelados
  }
}
```

**Consulta Flota Activa (Fleet Service - :4003):**

```graphql
query {
  flotaActiva(zonaId: "QUITO") {
    total
    disponibles
    enRuta
    mantenimiento
  }
}
```

### WebSocket - Tiempo Real

**Conexión:**

```javascript
const ws = new WebSocket('ws://localhost:4000/ws?token=<JWT_TOKEN>');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Evento recibido:', data);
};

// Suscribirse a eventos de pedidos
ws.send(JSON.stringify({ type: 'SUBSCRIBE', topic: 'pedido/*' }));
```

**Tópicos disponibles:**

- `pedido/*` - Todos los eventos de pedidos
- `vehiculo/*` - Todos los eventos de vehículos
- `factura/*` - Todos los eventos de facturas
- `repartidor/*` - Eventos de repartidores

---

## Docker

### Usando Docker Compose (Recomendado)

El proyecto incluye un archivo `docker-compose.yml` completo que levanta toda la infraestructura:

**Servicios incluidos:**
- PostgreSQL 15 con múltiples bases de datos
- RabbitMQ 3 con panel de administración
- Todos los microservicios
- Frontend con Nginx

```bash
# Construir e iniciar todos los servicios
docker-compose up --build

# Iniciar en segundo plano
docker-compose up -d

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f pedido-service

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (reset completo)
docker-compose down -v

# Reconstruir un servicio específico
docker-compose up -d --build auth-service
```

### Puertos Docker

| Servicio     | Puerto Host | Puerto Container |
|-------------|-------------|-----------------|
| Frontend    | 3000        | 80              |
| API Gateway | 4000        | 4000            |
| Auth        | 4001        | 4001            |
| Pedidos     | 4002        | 4002            |
| Fleet       | 4003        | 4003            |
| Billing     | 4004        | 4004            |
| Notification| 4005        | 4005            |
| PostgreSQL  | 5432        | 5432            |
| RabbitMQ    | 5672        | 5672            |
| RabbitMQ UI | 15672       | 15672           |

### Comandos Útiles Docker

```bash
# Conectar a PostgreSQL dentro del contenedor
docker-compose exec postgres psql -U postgres

# Ver colas de RabbitMQ
docker-compose exec rabbitmq rabbitmqctl list_queues

# Ejecutar shell en un contenedor
docker-compose exec auth-service sh

# Ver estado de los contenedores
docker-compose ps

# Limpiar imágenes no usadas
docker system prune -a
```

---

## Estructura del Proyecto

```
ProyectoTercerParcial/
├── auth-service/           # Servicio de autenticación
│   ├── src/
│   │   ├── entities/       # Entidades TypeORM
│   │   ├── resolvers/      # Resolvers GraphQL
│   │   ├── services/       # Lógica de negocio
│   │   ├── typeDefs/       # Schema GraphQL
│   │   └── utils/          # Utilidades (DB)
│   └── package.json
│
├── pedido-service/         # Servicio de pedidos
│   ├── src/
│   │   ├── entities/
│   │   ├── messaging/      # RabbitMQ producer
│   │   ├── resolvers/
│   │   ├── services/
│   │   └── typeDefs/
│   └── package.json
│
├── fleet-service/          # Servicio de flota
│   ├── src/
│   │   ├── entities/       # Vehículo, Moto, Liviano, Camión, Repartidor
│   │   ├── messaging/
│   │   ├── resolvers/
│   │   ├── services/
│   │   └── typeDefs/
│   └── package.json
│
├── billing-service/        # Servicio de facturación
│   ├── src/
│   │   ├── entities/
│   │   ├── messaging/
│   │   ├── resolvers/
│   │   ├── services/
│   │   └── typeDefs/
│   └── package.json
│
├── notification-service/   # Consumidor de eventos
│   ├── src/
│   │   ├── notifications/
│   │   └── rabbitmq/       # Consumer RabbitMQ
│   └── package.json
│
├── api-gateway/            # Gateway + WebSocket
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   └── websocket/
│   └── package.json
│
├── frontend/               # Panel de control React
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Roles de Usuario

| Rol             | Permisos                                                 |
| --------------- | -------------------------------------------------------- |
| ROLE_CLIENTE    | Ver sus pedidos, crear pedidos, ver facturas             |
| ROLE_REPARTIDOR | Ver asignaciones, actualizar estado, reportar ubicación |
| ROLE_SUPERVISOR | Gestionar zona, reasignar pedidos, ver métricas         |
| ROLE_GERENTE    | Acceso completo, KPIs, reportes                          |
| ROLE_ADMIN      | Administración total del sistema                        |

---

## Eventos RabbitMQ

### Exchange: `logiflow.events` (tipo: topic)

| Routing Key                          | Productor       | Descripción                 |
| ------------------------------------ | --------------- | ---------------------------- |
| `pedido.creado`                    | pedido-service  | Nuevo pedido creado          |
| `pedido.estado.actualizado`        | pedido-service  | Cambio de estado             |
| `pedido.asignado`                  | pedido-service  | Pedido asignado a repartidor |
| `vehiculo.creado`                  | fleet-service   | Nuevo vehículo registrado   |
| `vehiculo.estado.actualizado`      | fleet-service   | Cambio estado vehículo      |
| `repartidor.creado`                | fleet-service   | Nuevo repartidor             |
| `repartidor.ubicacion.actualizada` | fleet-service   | GPS actualizado              |
| `factura.creada`                   | billing-service | Nueva factura                |
| `factura.pagada`                   | billing-service | Factura pagada               |

---

## Tecnologías Utilizadas

### Backend

- **Node.js** + **TypeScript**
- **Apollo Server 4** (GraphQL)
- **TypeORM** (ORM)
- **PostgreSQL** (Base de datos)
- **RabbitMQ** (Mensajería asíncrona)
- **Express** (API Gateway)
- **WebSocket** (ws)
- **JWT** (Autenticación)

### Frontend

- **React 18** + **TypeScript**
- **Vite** (Build tool)
- **Apollo Client** (GraphQL client)
- **React Router 6** (Routing)
- **Leaflet** (Mapas)
- **Chart.js** (Gráficos)

---

## Solución de Problemas

### Error: "Cannot connect to PostgreSQL"

```bash
# Verificar que PostgreSQL esté corriendo
pg_isready -h localhost -p 5432

# Verificar credenciales en .env
```

### Error: "Cannot connect to RabbitMQ"

```bash
# Verificar que RabbitMQ esté corriendo
rabbitmqctl status

# Habilitar plugin de management
rabbitmq-plugins enable rabbitmq_management
```

### Error: "EADDRINUSE"

```bash
# El puerto ya está en uso, verificar qué proceso lo usa
netstat -ano | findstr :4001

# Matar el proceso o cambiar el puerto en .env
```

---

## Autores

Kleber Chavez, Pamela Chipe, Jhordy Marcillo y Camilo Orrico

**Universidad de las Fuerzas Armadas ESPE**
Departamento de Ciencias de la Computación
Carrera de Ingeniería en Software
Aplicaciones Distribuidas - Proyecto Parcial II/III
