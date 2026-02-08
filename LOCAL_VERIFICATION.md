# LogiFlow - Guía Completa de Verificación Local

**Sistema de microservicios para gestión de operaciones de delivery multinivel**

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Arquitectura de Servicios](#arquitectura-de-servicios)
4. [Arranque de Servicios](#arranque-de-servicios)
5. [Verificación de Servicios](#verificación-de-servicios)
6. [Pruebas con Postman](#pruebas-con-postman)
7. [Pruebas con GraphQL](#pruebas-con-graphql)
8. [Mensajería y WebSocket](#mensajería-y-websocket)
9. [Solución de Problemas](#solución-de-problemas)

---

## 📦 Requisitos Previos

### Software Necesario

| Software | Versión Mínima | URL |
|----------|---------------|-----|
| **Node.js** | 18.x | https://nodejs.org/ |
| **PostgreSQL** | 14.x | https://www.postgresql.org/download/ |
| **RabbitMQ** | 3.x | https://www.rabbitmq.com/download.html |
| **Postman** | Última | https://www.postman.com/downloads/ |

### Herramientas Opcionales

- **pgAdmin 4** - Administración visual de PostgreSQL
- **RabbitMQ Management UI** - Interfaz web en http://localhost:15672

---

## ⚙️ Configuración Inicial

### 1. Base de Datos PostgreSQL

#### Crear Usuario y Bases de Datos

```sql
-- Conectarse como superusuario (postgres)
CREATE USER logiflow WITH PASSWORD 'logiflow123';
ALTER USER logiflow CREATEDB;

-- Crear bases de datos
CREATE DATABASE auth_db OWNER logiflow;
CREATE DATABASE pedidos_db OWNER logiflow;
CREATE DATABASE fleet_db OWNER logiflow;
CREATE DATABASE billing_db OWNER logiflow;
CREATE DATABASE notifications_db OWNER logiflow;

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON DATABASE auth_db TO logiflow;
GRANT ALL PRIVILEGES ON DATABASE pedidos_db TO logiflow;
GRANT ALL PRIVILEGES ON DATABASE fleet_db TO logiflow;
GRANT ALL PRIVILEGES ON DATABASE billing_db TO logiflow;
GRANT ALL PRIVILEGES ON DATABASE notifications_db TO logiflow;
```

#### Verificar Conexión

```bash
psql -U logiflow -d auth_db -h localhost
# Password: logiflow123
```

### 2. RabbitMQ

#### Instalación (Windows con Chocolatey)

```powershell
choco install rabbitmq
```

#### Crear Usuario y Permisos

```bash
# Iniciar RabbitMQ
rabbitmq-server

# En otra terminal, crear usuario
rabbitmqctl add_user logiflow logiflow123
rabbitmqctl set_user_tags logiflow administrator
rabbitmqctl set_permissions -p / logiflow ".*" ".*" ".*"
```

#### Verificar RabbitMQ

- **Management UI:** http://localhost:15672
- **Usuario:** logiflow
- **Password:** logiflow123

### 3. Variables de Entorno

Cada servicio tiene un archivo `.env` configurado. Verificar que existan:

```
✅ auth-service/.env
✅ pedido-service/.env
✅ fleet-service/.env
✅ billing-service/.env
✅ notification-service/.env
✅ api-gateway/.env
```

**Configuración clave del API Gateway:**
```env
RABBITMQ_URL=amqp://logiflow:logiflow123@localhost:5672
```

### 4. Instalar Dependencias

```bash
# Instalar en cada servicio
cd auth-service && npm install
cd ../pedido-service && npm install
cd ../fleet-service && npm install
cd ../billing-service && npm install
cd ../notification-service && npm install
cd ../api-gateway && npm install
```

**Script rápido (PowerShell):**

```powershell
$services = @('auth-service', 'pedido-service', 'fleet-service', 'billing-service', 'notification-service', 'api-gateway')
foreach ($service in $services) {
    Write-Host "Instalando dependencias en $service..." -ForegroundColor Green
    Set-Location $service
    npm install
    Set-Location ..
}
```

---

## 🏗️ Arquitectura de Servicios

```
┌─────────────────────────────────────────────────────────┐
│                    API GATEWAY :4000                     │
│         (Express + WebSocket + JWT + Proxy)              │
└────────┬────────┬────────┬────────┬─────────────────────┘
         │        │        │        │
    ┌────┴───┐ ┌─┴────┐ ┌─┴────┐ ┌─┴──────┐
    │ Auth   │ │Pedido│ │Fleet │ │Billing │ ┌──────────────┐
    │ :4001  │ │:4002 │ │:4003 │ │:4004   │ │Notification  │
    │GraphQL │ │GraphQL│GraphQL│ │GraphQL │ │   :4005      │
    └────┬───┘ └──┬───┘ └──┬───┘ └───┬────┘ └──────┬───────┘
         │        │        │          │             │
         ▼        ▼        ▼          ▼             ▼
    ┌────────────────────────────────────────────────────┐
    │              PostgreSQL :5432                       │
    │   auth_db | pedidos_db | fleet_db | billing_db     │
    │                  notifications_db                   │
    └────────────────────────────────────────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  RabbitMQ :5672 │
                │  Exchange:      │
                │  logiflow.events│
                └─────────────────┘
```

### Puertos y Tecnologías

| Puerto | Servicio | GraphQL | REST | RabbitMQ |
|--------|----------|---------|------|----------|
| 4000 | API Gateway | ❌ | ✅ | ✅ |
| 4001 | Auth Service | ✅ | ✅ | ❌ |
| 4002 | Pedido Service | ✅ | ✅ | ✅ |
| 4003 | Fleet Service | ✅ | ✅ | ✅ |
| 4004 | Billing Service | ✅ | ✅ | ✅ |
| 4005 | Notification Service | ❌ | ✅ | ✅ |

---

## 🚀 Arranque de Servicios

### Opción 1: Terminales Individuales

Abrir **6 terminales separadas** y ejecutar:

```bash
# Terminal 1 - Auth Service
cd auth-service
npm run dev

# Terminal 2 - Pedido Service
cd pedido-service
npm run dev

# Terminal 3 - Fleet Service
cd fleet-service
npm run dev

# Terminal 4 - Billing Service
cd billing-service
npm run dev

# Terminal 5 - Notification Service
cd notification-service
npm run dev

# Terminal 6 - API Gateway (ÚLTIMO)
cd api-gateway
npm run dev
```

### Opción 2: Script PowerShell

Crear `start-all-services.ps1`:

```powershell
$services = @(
    @{Name="Auth"; Port=4001; Path="auth-service"},
    @{Name="Pedido"; Port=4002; Path="pedido-service"},
    @{Name="Fleet"; Port=4003; Path="fleet-service"},
    @{Name="Billing"; Port=4004; Path="billing-service"},
    @{Name="Notification"; Port=4005; Path="notification-service"},
    @{Name="Gateway"; Port=4000; Path="api-gateway"}
)

foreach ($service in $services) {
    Write-Host "Iniciando $($service.Name) Service..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $($service.Path); npm run dev"
    Start-Sleep -Seconds 2
}

Write-Host "`n✅ Todos los servicios iniciados" -ForegroundColor Green
```

Ejecutar: `.\start-all-services.ps1`

---

## ✅ Verificación de Servicios

### Health Checks

Verificar que todos los servicios respondan:

```bash
# PowerShell - Verificar todos
$ports = 4000..4005
foreach ($port in $ports) {
    try {
        $response = Invoke-WebRequest "http://localhost:$port/health" -UseBasicParsing
        Write-Host "✅ Puerto $port : OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ Puerto $port : ERROR" -ForegroundColor Red
    }
}
```

**Endpoints de Health:**

- http://localhost:4000/health - API Gateway
- http://localhost:4001/health - Auth Service
- http://localhost:4002/health - Pedido Service
- http://localhost:4003/health - Fleet Service
- http://localhost:4004/health - Billing Service
- http://localhost:4005/health - Notification Service

### Verificar Puertos en Uso

```powershell
netstat -ano | findstr ":400"
```

Deberías ver 6 puertos LISTENING (4000-4005).

---

## 🧪 Pruebas con Postman

### 1. Importar Collection

1. Abrir Postman
2. Click en **Import**
3. Seleccionar archivo: `LogiFlow-Postman-Collection.json`
4. ✅ Collection importado con **50+ requests** organizados

### 2. Flujo Básico de Pruebas

#### Paso 1: Registrar Usuario

**POST** `http://localhost:4000/auth/register`

```json
{
  "username": "cliente1",
  "email": "cliente1@mail.com",
  "password": "123456",
  "rol": "ROLE_CLIENTE",
  "zonaId": "ZONA-1",
  "tipoFlota": "URBANO"
}
```

**Respuesta esperada: 201 Created**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "1",
    "username": "cliente1",
    "roles": ["ROLE_CLIENTE"]
  }
}
```

#### Paso 2: Login

**POST** `http://localhost:4000/auth/login`

```json
{
  "username": "cliente1",
  "password": "123456"
}
```

**💾 Guardar el token JWT** para usarlo en las siguientes peticiones.

#### Paso 3: Crear Pedido

**POST** `http://localhost:4000/pedidos`

**Headers:**
```
Authorization: Bearer <tu-token-jwt>
Content-Type: application/json
```

**Body:**
```json
{
  "clienteId": "1",
  "direccionOrigen": "Av. Siempre Viva 123, Quito",
  "direccionDestino": "Calle 10 y Av. 6, Quito",
  "descripcion": "Paquete pequeño - Documentos",
  "tipoEntrega": "URBANO",
  "zonaId": "ZONA-1",
  "peso": 2.5,
  "latOrigen": -0.2163,
  "lngOrigen": -78.5088,
  "latDestino": -0.2269,
  "lngDestino": -78.5249
}
```

**Respuesta esperada: 201 Created**

#### Paso 4: Listar Pedidos

**GET** `http://localhost:4000/pedidos`

**Headers:**
```
Authorization: Bearer <tu-token-jwt>
```

#### Paso 5: Cambiar Estado del Pedido

**PATCH** `http://localhost:4000/pedidos/1/estado`

**Headers:**
```
Authorization: Bearer <tu-token-jwt>
Content-Type: application/json
```

**Body:**
```json
{
  "estado": "EN_RUTA"
}
```

**✅ Esto generará un evento en RabbitMQ → Notification Service**

### 3. Endpoints Principales

#### Auth Service

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Registrar usuario | ❌ |
| POST | `/auth/login` | Iniciar sesión | ❌ |
| GET | `/auth/me` | Usuario actual | ✅ |
| GET | `/auth/usuarios` | Listar usuarios | ✅ |

#### Pedido Service

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/pedidos` | Crear pedido | ✅ |
| GET | `/pedidos` | Listar pedidos | ✅ |
| GET | `/pedidos/:id` | Obtener pedido | ✅ |
| PATCH | `/pedidos/:id/estado` | Cambiar estado | ✅ |
| POST | `/pedidos/:id/confirmar-entrega` | Confirmar entrega | ✅ |
| POST | `/pedidos/:id/cancelar` | Cancelar pedido | ✅ |

#### Fleet Service

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/fleet/vehiculos/moto` | Crear moto | ✅ |
| POST | `/fleet/vehiculos/liviano` | Crear auto | ✅ |
| POST | `/fleet/vehiculos/camion` | Crear camión | ✅ |
| GET | `/fleet/vehiculos` | Listar vehículos | ✅ |
| POST | `/fleet/repartidores` | Crear repartidor | ✅ |
| GET | `/fleet/repartidores` | Listar repartidores | ✅ |

#### Billing Service

| Método | Ruta | Descripción | Auth | Rol |
|--------|------|-------------|------|-----|
| POST | `/billing/facturas` | Generar factura | ✅ | GERENTE/ADMIN |
| GET | `/billing/facturas` | Listar facturas | ✅ | - |
| POST | `/billing/facturas/:id/emitir` | Emitir factura | ✅ | GERENTE/ADMIN |
| POST | `/billing/facturas/:id/pagar` | Registrar pago | ✅ | - |
| GET | `/billing/kpi/diario` | KPI diario | ✅ | - |

#### Notification Service

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/notifications/notifications` | Listar notificaciones | ❌ |
| GET | `/notifications/notifications/pending` | Notificaciones pendientes | ❌ |
| GET | `/notifications/notifications/stats` | Estadísticas | ❌ |

---

## 🔄 Pruebas con GraphQL

### Acceso a GraphQL Playground

- **Auth:** http://localhost:4000/auth/graphql
- **Pedido:** http://localhost:4000/pedidos/graphql
- **Fleet:** http://localhost:4000/fleet/graphql
- **Billing:** http://localhost:4000/billing/graphql

### Ejemplos de Queries

#### 1. Auth - Login (Mutation)

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    usuario {
      id
      username
      email
      roles
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "username": "cliente1",
    "password": "123456"
  }
}
```

#### 2. Pedido - Crear Pedido (Mutation)

```graphql
mutation CrearPedido($input: CreatePedidoInput!) {
  crearPedido(input: $input) {
    id
    codigo
    estado
    tipoEntrega
    direccionOrigen
    direccionDestino
  }
}
```

**Variables:**
```json
{
  "input": {
    "clienteId": "1",
    "direccionOrigen": "Av. Siempre Viva 123",
    "direccionDestino": "Calle 10 y Av. 6",
    "descripcion": "Paquete pequeño",
    "tipoEntrega": "URBANO",
    "zonaId": "ZONA-1",
    "peso": 2.5
  }
}
```

#### 3. Pedido - Consultar Pedidos (Query)

```graphql
query ListarPedidos($filtro: PedidoFiltro) {
  pedidos(filtro: $filtro) {
    id
    codigo
    estado
    tipoEntrega
    zonaId
    clienteId
    createdAt
  }
}
```

**Variables:**
```json
{
  "filtro": {
    "zonaId": "ZONA-1",
    "estado": "EN_RUTA"
  }
}
```

#### 4. Fleet - Resumen de Flota (Query)

```graphql
query FlotaActiva($zonaId: String) {
  flotaActiva(zonaId: $zonaId) {
    total
    disponibles
    enRuta
    mantenimiento
  }
}
```

**Variables:**
```json
{
  "zonaId": "ZONA-1"
}
```

#### 5. Billing - KPI Diario (Query)

```graphql
query KPIDiario($fecha: String!, $zonaId: String) {
  kpiDiario(fecha: $fecha, zonaId: $zonaId) {
    totalFacturado
    cantidadFacturas
    facturasPagadas
    facturasAnuladas
    promedioFactura
  }
}
```

**Variables:**
```json
{
  "fecha": "2026-02-07",
  "zonaId": "ZONA-1"
}
```

---

## 📡 Mensajería y WebSocket

### RabbitMQ - Verificar Eventos

1. Acceder a http://localhost:15672
2. Login: `logiflow` / `logiflow123`
3. Ir a **Exchanges** → buscar `logiflow.events`
4. Ver **Bindings** y **Routing Keys**

### WebSocket - Prueba de Conexión

#### 1. Conectar al WebSocket

```javascript
// En el navegador (consola)
const ws = new WebSocket('ws://localhost:4000/ws?token=<tu-jwt-token>');

ws.onopen = () => {
  console.log('✅ Conectado al WebSocket');
  
  // Suscribirse a eventos de pedidos
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE',
    topic: 'pedido/*'
  }));
};

ws.onmessage = (event) => {
  console.log('📨 Mensaje recibido:', JSON.parse(event.data));
};
```

#### 2. Generar Eventos

Cambiar estado de un pedido:

```bash
# En Postman
PATCH http://localhost:4000/pedidos/1/estado
Body: { "estado": "EN_RUTA" }
```

#### 3. Verificar Notificaciones

```bash
GET http://localhost:4000/notifications/notifications?limit=10
```

### Flujo Completo de Eventos

```
1. Cliente → REST: PATCH /pedidos/{id}/estado → EN_RUTA
2. Pedido Service → publica evento en RabbitMQ
3. RabbitMQ → enruta a colas:
   - notification.queue (Notification Service)
   - websocket.broadcast (API Gateway)
4. Notification Service → guarda notificación en DB
5. API Gateway → broadcast a clientes WebSocket suscritos
6. Cliente WebSocket → recibe actualización en tiempo real
```

---

## 🛠️ Solución de Problemas

### Problema 1: Puerto ya en uso

**Error:** `EADDRINUSE: address already in use :::4001`

**Solución:**

```powershell
# Ver proceso usando el puerto
Get-NetTCPConnection -LocalPort 4001 | Select-Object OwningProcess

# Detener proceso
Stop-Process -Id <PID> -Force

# O detener todos los servicios
Get-NetTCPConnection -LocalPort 4000,4001,4002,4003,4004,4005 -ErrorAction SilentlyContinue | 
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Problema 2: Error de autenticación (401)

**Causa:** Token JWT inválido o expirado

**Solución:**
1. Hacer login nuevamente: `POST /auth/login`
2. Copiar el nuevo token
3. Actualizar header: `Authorization: Bearer <nuevo-token>`

### Problema 3: RabbitMQ connection refused

**Error:** `ACCESS_REFUSED - Login was refused`

**Solución:**

```bash
# Verificar usuario y permisos
rabbitmqctl list_users
rabbitmqctl list_permissions -p /

# Si no existe, crear usuario
rabbitmqctl add_user logiflow logiflow123
rabbitmqctl set_permissions -p / logiflow ".*" ".*" ".*"
```

### Problema 4: Database connection error

**Error:** `connect ECONNREFUSED ::1:5432`

**Solución:**

```bash
# Verificar que PostgreSQL esté corriendo
Get-Service -Name postgresql*

# Verificar conexión
psql -U logiflow -d auth_db -h localhost

# Si falla, revisar pg_hba.conf y postgresql.conf
```

### Problema 5: 404 Not Found en /auth/register

**Causa:** Rutas mal configuradas en los microservicios

**Verificación:**
```bash
# Auth service debe usar rutas raíz
# auth-service/src/index.ts
app.use('/', authController);  # ✅ Correcto
# NO: app.use('/api/auth', authController);  # ❌ Incorrecto
```

### Logs Útiles

**Ver logs de un servicio específico:**
```bash
# En la terminal donde corre el servicio
# Los logs aparecen automáticamente
```

**Verificar tablas en PostgreSQL:**
```sql
-- Conectar a cada base
\c auth_db
\dt  -- Ver tablas

\c pedidos_db
\dt

\c fleet_db
\dt
```

---

## 📚 Recursos Adicionales

### Documentación APIs

- **Postman Collection:** `LogiFlow-Postman-Collection.json`
- **GraphQL Playgrounds automáticos en cada servicio**

### Roles Disponibles

| Rol | Permisos |
|-----|----------|
| `ROLE_CLIENTE` | Crear pedidos, ver sus pedidos |
| `ROLE_REPARTIDOR` | Ver pedidos asignados, actualizar estado |
| `ROLE_SUPERVISOR` | Ver pedidos de su zona, reasignar |
| `ROLE_GERENTE` | Crear facturas, ver KPIs, reportes |
| `ROLE_ADMIN` | Acceso total al sistema |

### Estados de Pedido

- `RECIBIDO` - Pedido creado
- `ASIGNADO` - Repartidor asignado
- `EN_RUTA` - En camino al destino
- `ENTREGADO` - Entregado exitosamente
- `CANCELADO` - Pedido cancelado

### Tipos de Entrega

- `URBANO` - Entrega dentro de la ciudad (moto)
- `INTERMUNICIPAL` - Entre ciudades de la provincia (auto)
- `NACIONAL` - A nivel nacional (camión)

---

## ✅ Checklist de Verificación

- [ ] PostgreSQL instalado y corriendo
- [ ] 5 bases de datos creadas
- [ ] Usuario `logiflow` con permisos
- [ ] RabbitMQ instalado y corriendo
- [ ] Usuario RabbitMQ configurado
- [ ] Dependencias instaladas en todos los servicios
- [ ] Archivos `.env` verificados
- [ ] 6 servicios corriendo (puertos 4000-4005)
- [ ] Health checks respondiendo OK
- [ ] Usuario registrado exitosamente
- [ ] Login funcional con JWT
- [ ] Pedido creado correctamente
- [ ] Estado de pedido actualizado
- [ ] Notificación recibida en Notification Service
- [ ] Postman Collection importado

---

**🎉 ¡Sistema LogiFlow listo para pruebas locales!**

Para soporte adicional, revisar logs de cada servicio o consultar la documentación técnica del proyecto.
