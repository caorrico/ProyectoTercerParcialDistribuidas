# 📡 Eventos y Notificaciones - LogiFlow

**Sistema completo de notificaciones automáticas para todas las operaciones CRUD**

---

## 📋 Resumen General

Todos los microservicios ahora publican eventos a RabbitMQ cuando se realizan operaciones CRUD. El Notification Service escucha estos eventos y los almacena como notificaciones en la base de datos.

**Exchange:** `logiflow.events` (tipo: topic)  
**Queue de Notificaciones:** `notifications.queue`

---

## 🔐 Auth Service (Puerto 4001)

### Eventos Implementados

| Operación | Routing Key | Cuándo se dispara |
|-----------|-------------|-------------------|
| **Registrar Usuario** | `usuario.creado` | POST /auth/register |
| **Actualizar Usuario** | `usuario.actualizado` | Mutation updateUsuario (GraphQL) |
| **Desactivar Usuario** | `usuario.desactivado` | Método deactivateUsuario |

### Estructura del Evento

```json
{
  "eventId": "usuario-1234-1234567890",
  "eventType": "usuario.creado",
  "timestamp": "2026-02-08T04:30:00.000Z",
  "microservice": "auth-service",
  "data": {
    "usuarioId": "abc-123-def",
    "username": "cliente1",
    "email": "cliente1@mail.com",
    "roles": ["ROLE_CLIENTE"],
    "zonaId": "ZONA-1"
  }
}
```

### Cómo Probar

```bash
# 1. Registrar usuario
POST http://localhost:4000/auth/register
Body: {
  "username": "testuser3",
  "email": "test3@mail.com",
  "password": "123456",
  "rol": "ROLE_CLIENTE",
  "zonaId": "ZONA-1"
}

# 2. Ver notificación
GET http://localhost:4000/notifications/notifications?limit=5
```

---

## 📦 Pedido Service (Puerto 4002)

### Eventos Implementados

| Operación | Routing Key | Cuándo se dispara |
|-----------|-------------|-------------------|
| **Crear Pedido** | `pedido.creado` | POST /pedidos |
| **Actualizar Estado** | `pedido.estado.actualizado` | PATCH /pedidos/:id/estado |
| **Asignar Repartidor** | `pedido.asignado` | POST /pedidos/:id/asignar |
| **Pedido en Ruta** | `pedido.en.ruta` | PATCH /pedidos/:id/estado (a EN_RUTA) |
| **Entregar Pedido** | `pedido.entregado` | POST /pedidos/:id/confirmar-entrega |
| **Cancelar Pedido** | `pedido.cancelado` | POST /pedidos/:id/cancelar |

### Estructura del Evento

```json
{
  "eventId": "pedido-123-1234567890",
  "eventType": "pedido.creado",
  "timestamp": "2026-02-08T04:30:00.000Z",
  "microservice": "pedido-service",
  "data": {
    "pedidoId": "1",
    "codigo": "PED-2026-001",
    "estado": "RECIBIDO",
    "clienteId": "1",
    "direccionOrigen": "Av. Siempre Viva 123",
    "direccionDestino": "Calle 10 y Av. 6",
    "tipoEntrega": "URBANO",
    "zonaId": "ZONA-1"
  }
}
```

### Cómo Probar

```bash
# 1. Crear pedido (requiere token)
POST http://localhost:4000/pedidos
Headers: Authorization: Bearer <token>
Body: {
  "clienteId": "1",
  "direccionOrigen": "Av. Principal 456",
  "direccionDestino": "Calle Secundaria 789",
  "descripcion": "Paquete de prueba",
  "tipoEntrega": "URBANO",
  "zonaId": "ZONA-1",
  "peso": 3.5
}

# 2. Cambiar estado
PATCH http://localhost:4000/pedidos/1/estado
Headers: Authorization: Bearer <token>
Body: { "estado": "EN_RUTA" }

# 3. Ver notificaciones
GET http://localhost:4000/notifications/notifications?limit=5
```

---

## 🚗 Fleet Service (Puerto 4003)

### Eventos Implementados

| Operación | Routing Key | Cuándo se dispara |
|-----------|-------------|-------------------|
| **Crear Vehículo** | `vehiculo.creado` | POST /fleet/vehiculos/moto, /liviano, /camion |
| **Actualizar Estado Vehículo** | `vehiculo.estado.actualizado` | PATCH /fleet/vehiculos/:placa/estado |
| **Asignar Vehículo** | `vehiculo.asignado` | POST /fleet/repartidores/:id/asignar-vehiculo |
| **Crear Repartidor** | `repartidor.creado` | POST /fleet/repartidores |
| **Actualizar Estado Repartidor** | `repartidor.actualizado` | PATCH /fleet/repartidores/:id/estado |
| **Actualizar Ubicación** | `repartidor.ubicacion.actualizada` | POST /tracking/repartidor/:id/ubicacion |

### Estructura del Evento - Vehículo

```json
{
  "id": "abc-123",
  "microservice": "fleet-service",
  "action": "VEHICULO_CREADO",
  "entityType": "Vehiculo",
  "entityId": "ABC-123",
  "message": "Nuevo vehículo registrado: ABC-123",
  "timestamp": "2026-02-08T04:30:00.000Z",
  "severity": "INFO",
  "data": {
    "id": "1",
    "placa": "ABC-123",
    "marca": "Honda",
    "modelo": "CBR",
    "tipoVehiculo": "MOTO",
    "estado": "DISPONIBLE"
  }
}
```

### Estructura del Evento - Repartidor

```json
{
  "id": "def-456",
  "microservice": "fleet-service",
  "action": "REPARTIDOR_ACTUALIZADO",
  "entityType": "Repartidor",
  "entityId": "1234567890",
  "message": "Estado de repartidor Juan Pérez cambió de INACTIVO a ACTIVO",
  "timestamp": "2026-02-08T04:30:00.000Z",
  "severity": "INFO",
  "data": {
    "id": "1",
    "identificacion": "1234567890",
    "nombre": "Juan Pérez",
    "estadoAnterior": "INACTIVO",
    "estadoNuevo": "ACTIVO",
    "zonaId": "ZONA-1"
  }
}
```

### Cómo Probar

```bash
# 1. Crear vehículo (requiere token de ADMIN/GERENTE/SUPERVISOR)
POST http://localhost:4000/fleet/vehiculos/moto
Headers: Authorization: Bearer <token-admin>
Body: {
  "placa": "XYZ-789",
  "marca": "Yamaha",
  "modelo": "MT-09",
  "color": "Azul",
  "anioFabricacion": "2023",
  "cilindraje": 900,
  "tipoMoto": "DEPORTIVA",
  "tieneCasco": true
}

# 2. Crear repartidor
POST http://localhost:4000/fleet/repartidores
Headers: Authorization: Bearer <token-admin>
Body: {
  "identificacion": "0987654321",
  "nombre": "María",
  "apellido": "González",
  "telefono": "0999888777",
  "email": "maria@mail.com",
  "licencia": "A123456",
  "tipoLicencia": "A",
  "zonaId": "ZONA-1"
}

# 3. Cambiar estado de repartidor (GraphQL)
POST http://localhost:4000/fleet/graphql
Headers: Authorization: Bearer <token-admin>
Body: {
  "query": "mutation { cambiarEstadoRepartidor(id: \"1\", estado: ACTIVO) { id estado } }"
}

# 4. Ver notificaciones
GET http://localhost:4000/notifications/notifications?limit=5
```

---

## 💰 Billing Service (Puerto 4004)

### Eventos Implementados

| Operación | Routing Key | Cuándo se dispara |
|-----------|-------------|-------------------|
| **Crear Factura** | `factura.creada` | POST /billing/facturas |
| **Emitir Factura** | `factura.emitida` | POST /billing/facturas/:id/emitir |
| **Pagar Factura** | `factura.pagada` | POST /billing/facturas/:id/pagar |
| **Anular Factura** | `factura.anulada` | POST /billing/facturas/:id/anular |

### Estructura del Evento

```json
{
  "id": "ghi-789",
  "microservice": "billing-service",
  "action": "FACTURA_CREADA",
  "entityType": "Factura",
  "entityId": "FAC-2026-001",
  "message": "Nueva factura generada: FAC-2026-001",
  "timestamp": "2026-02-08T04:30:00.000Z",
  "severity": "INFO",
  "data": {
    "id": "1",
    "numeroFactura": "FAC-2026-001",
    "pedidoId": "1",
    "clienteId": "1",
    "subtotal": 15.50,
    "total": 15.50,
    "estado": "BORRADOR",
    "tipoEntrega": "URBANO",
    "zonaId": "ZONA-1"
  }
}
```

### Cómo Probar

```bash
# 1. Crear factura (requiere token de GERENTE/ADMIN)
POST http://localhost:4000/billing/facturas
Headers: Authorization: Bearer <token-gerente>
Body: {
  "pedidoId": "1",
  "clienteId": "1",
  "subtotal": 20.00,
  "descuento": 0,
  "tipoEntrega": "URBANO",
  "zonaId": "ZONA-1",
  "observaciones": "Factura de prueba"
}

# 2. Emitir factura
POST http://localhost:4000/billing/facturas/1/emitir
Headers: Authorization: Bearer <token-gerente>

# 3. Pagar factura
POST http://localhost:4000/billing/facturas/1/pagar
Headers: Authorization: Bearer <token>
Body: {
  "metodoPago": "TARJETA_CREDITO",
  "referenciaTransaccion": "TXN-123456"
}

# 4. Ver notificaciones
GET http://localhost:4000/notifications/notifications?limit=5
```

---

## 📬 Notification Service (Puerto 4005)

### Patrones de Escucha

El Notification Service escucha TODOS los eventos con estos patrones:

```javascript
const ROUTING_PATTERNS = [
  'pedido.*',      // Todos los eventos de pedidos
  'vehiculo.*',    // Todos los eventos de vehículos
  'repartidor.*',  // Todos los eventos de repartidores
  'factura.*',     // Todos los eventos de facturas
  'usuario.*'      // Todos los eventos de usuarios
];
```

### Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/notifications` | GET | Todas las notificaciones (limit=100) |
| `/notifications/microservice/:name` | GET | Por microservicio |
| `/notifications/severity/:level` | GET | Por severidad (INFO, WARN, ERROR) |
| `/notifications/pending` | GET | Notificaciones no leídas |
| `/notifications/stats` | GET | Estadísticas generales |

### Ejemplo de Respuesta

```json
[
  {
    "id": "1",
    "eventId": "usuario-abc-1234567890",
    "microservice": "auth-service",
    "action": "usuario.creado",
    "entityType": "Usuario",
    "entityId": "abc-123",
    "message": "Nuevo usuario registrado: cliente1",
    "severity": "INFO",
    "timestamp": "2026-02-08T04:30:00.000Z",
    "read": false,
    "createdAt": "2026-02-08T04:30:00.123Z"
  }
]
```

---

## 🔄 Flujo Completo de Eventos

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUJO DE EVENTOS                            │
└─────────────────────────────────────────────────────────────────┘

1. Usuario realiza operación CRUD
   │
   ├─► POST /auth/register
   ├─► POST /pedidos
   ├─► POST /fleet/vehiculos/moto
   ├─► POST /billing/facturas
   └─► PATCH /pedidos/:id/estado
   
2. Microservicio ejecuta lógica de negocio
   │
   └─► Guarda en base de datos PostgreSQL
   
3. Microservicio publica evento a RabbitMQ
   │
   └─► Exchange: logiflow.events (topic)
       Routing Key: pedido.creado, usuario.creado, etc.
   
4. RabbitMQ enruta el evento
   │
   ├─► notifications.queue → Notification Service
   ├─► websocket.broadcast → API Gateway (WebSocket)
   └─► Otras colas de procesamiento
   
5. Notification Service consume el evento
   │
   └─► Guarda notificación en notifications_db
   
6. Usuario consulta notificaciones
   │
   └─► GET /notifications/notifications
```

---

## ✅ Verificación de Eventos

### Script de Prueba Completo

```bash
# 1. USUARIO: Registrar
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testcompleto",
    "email": "testcompleto@mail.com",
    "password": "123456",
    "rol": "ROLE_CLIENTE",
    "zonaId": "ZONA-1"
  }'

# 2. Obtener token
TOKEN=$(curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testcompleto","password":"123456"}' \
  | jq -r '.token')

# 3. PEDIDO: Crear
curl -X POST http://localhost:4000/pedidos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": "1",
    "direccionOrigen": "Origen Test",
    "direccionDestino": "Destino Test",
    "descripcion": "Test completo",
    "tipoEntrega": "URBANO",
    "zonaId": "ZONA-1",
    "peso": 5.0
  }'

# 4. PEDIDO: Cambiar estado
curl -X PATCH http://localhost:4000/pedidos/1/estado \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"EN_RUTA"}'

# 5. Ver TODAS las notificaciones generadas
curl http://localhost:4000/notifications/notifications?limit=20
```

### Verificación en RabbitMQ Management

1. Acceder a http://localhost:15672
2. Login: `logiflow` / `logiflow123`
3. Ir a **Queues** → `notifications.queue`
4. Ver mensajes entrantes en tiempo real

---

## 📊 Estadísticas de Eventos

### Por Microservicio

| Microservicio | Eventos Implementados |
|---------------|----------------------|
| auth-service | 3 |
| pedido-service | 6 |
| fleet-service | 6 |
| billing-service | 4 |
| **TOTAL** | **19 eventos** |

### Por Tipo de Operación

| Operación | Cantidad de Eventos |
|-----------|---------------------|
| CREATE | 7 |
| UPDATE | 8 |
| STATE_CHANGE | 4 |
| **TOTAL** | **19 eventos** |

---

## 🎯 Casos de Uso Principales

### 1. Auditoría Completa
Todas las operaciones CRUD están registradas con timestamp, usuario, y datos relevantes.

### 2. Notificaciones en Tiempo Real
Los clientes WebSocket reciben eventos inmediatamente cuando ocurren cambios.

### 3. Integración con Sistemas Externos
Otros servicios pueden suscribirse a eventos específicos de RabbitMQ.

### 4. Debugging y Troubleshooting
Revisar el historial de eventos ayuda a identificar problemas.

### 5. Analytics y Reportes
Analizar patrones de uso basados en eventos registrados.

---

## 🔧 Troubleshooting

### No se generan notificaciones

1. **Verificar RabbitMQ:**
   ```bash
   rabbitmqctl list_queues
   rabbitmqctl list_bindings
   ```

2. **Verificar logs del servicio:**
   - Buscar línea: "📤 Evento publicado: ..."
   - Si no aparece, el evento no se está publicando

3. **Verificar Notification Service:**
   - Logs deben mostrar: "Mensaje recibido:"
   - Si no aparece, el consumidor no está escuchando

4. **Verificar credenciales RabbitMQ:**
   - Todos los `.env` deben tener: `RABBITMQ_URL=amqp://logiflow:logiflow123@localhost:5672`

### Eventos duplicados

- Revisar configuración de `prefetch` en Notification Service
- Verificar que no haya múltiples instancias del servicio corriendo

---

## 📝 Notas Importantes

1. **Todos los servicios están configurados**: Los 6 microservicios publican eventos automáticamente.

2. **Sin configuración adicional**: Los eventos se generan automáticamente en cada operación CRUD.

3. **RabbitMQ es opcional**: Si RabbitMQ no está disponible, los servicios continúan funcionando sin lanzar errores.

4. **Persistencia**: Todos los eventos se guardan en `notifications_db` para consulta histórica.

5. **Severidad**: Los eventos se clasifican automáticamente (INFO, WARN, ERROR).

---

**✅ Sistema completo de notificaciones implementado y funcionando**

Todos los microservicios ahora generan notificaciones automáticas para operaciones CRUD. 🎉
