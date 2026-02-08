# LogiFlow - Verificacion local (sin Docker)

## Estado actual

Los servicios ya estan corriendo en local en estos puertos:
- api-gateway: 4000
- auth-service: 4001
- pedido-service: 4002
- fleet-service: 4003
- billing-service: 4004
- notification-service: 4005

## Pasos para ejecutar en local (resumen)

1) Requisitos
- Node.js 18+
- PostgreSQL 14+
- RabbitMQ 3+

2) Base de datos (PostgreSQL)
- Usuario: logiflow
- Password: logiflow123
- Bases:
  - auth_db
  - pedidos_db
  - fleet_db
  - billing_db
  - notifications_db

Ejemplo SQL:
```sql
CREATE USER logiflow WITH PASSWORD 'logiflow123';
CREATE DATABASE auth_db OWNER logiflow;
CREATE DATABASE pedidos_db OWNER logiflow;
CREATE DATABASE fleet_db OWNER logiflow;
CREATE DATABASE billing_db OWNER logiflow;
CREATE DATABASE notifications_db OWNER logiflow;
```

3) RabbitMQ
- Host: localhost
- Usuario: logiflow
- Password: logiflow123
- AMQP: amqp://logiflow:logiflow123@localhost:5672

4) Variables de entorno
- Revisar los .env de cada servicio (ya existen).
- api-gateway usa RABBITMQ_URL=amqp://logiflow:logiflow123@localhost:5672

5) Instalar dependencias
```bash
npm install
```
Ejecutar en cada carpeta: auth-service, pedido-service, fleet-service, billing-service,
notification-service, api-gateway.

6) Arranque en terminales separadas
```bash
# auth-service
npm run dev

# pedido-service
npm run dev

# fleet-service
npm run dev

# billing-service
npm run dev

# notification-service
npm run dev

# api-gateway
npm run dev
```

## Verificacion rapida (health checks)

- api-gateway: http://localhost:4000/health
- auth-service: http://localhost:4001/health
- pedido-service: http://localhost:4002/health
- fleet-service: http://localhost:4003/health
- billing-service: http://localhost:4004/health
- notification-service: http://localhost:4005/health

## Postman - REST (via API Gateway)

Base URL: http://localhost:4000

1) Registrar usuario (cliente o supervisor)
POST /auth/register
Body (JSON):
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

2) Login
POST /auth/login
Body (JSON):
```json
{
  "username": "cliente1",
  "password": "123456"
}
```
Respuesta: token JWT. Usar en Authorization: Bearer <token>

3) Crear pedido
POST /pedidos
Headers:
- Authorization: Bearer <token>
Body (JSON):
```json
{
  "clienteId": "1",
  "direccionOrigen": "Av. Siempre Viva 123",
  "direccionDestino": "Calle 10 y Av. 6",
  "descripcion": "Paquete pequeno",
  "tipoEntrega": "URBANO",
  "zonaId": "ZONA-1",
  "peso": 2.5
}
```

4) Listar pedidos
GET /pedidos
Headers:
- Authorization: Bearer <token>

5) Cambiar estado del pedido
PATCH /pedidos/{id}/estado
Headers:
- Authorization: Bearer <token>
Body (JSON):
```json
{ "estado": "EN_RUTA" }
```

6) Fleet: crear moto
POST /fleet/vehiculos/moto
Headers:
- Authorization: Bearer <token>
Body (JSON):
```json
{
  "placa": "ABC-123",
  "marca": "Honda",
  "modelo": "CBR",
  "color": "Rojo",
  "anioFabricacion": "2022",
  "cilindraje": 600,
  "tipoMoto": "DEPORTIVA",
  "tieneCasco": true
}
```

7) Billing: generar factura (requiere ROLE_GERENTE o ROLE_ADMIN)
POST /billing/facturas
Headers:
- Authorization: Bearer <token-gerente>
Body (JSON):
```json
{
  "pedidoId": "1",
  "clienteId": "1",
  "subtotal": 10.0,
  "descuento": 0,
  "tipoEntrega": "URBANO",
  "zonaId": "ZONA-1",
  "observaciones": "Factura prueba"
}
```

8) Notification: listar notificaciones
GET /notifications/notifications?limit=10

Nota: este endpoint no esta protegido por JWT.

## GraphQL (por servicio)

Usar POST en /<servicio>/graphql via API Gateway:
- Auth: http://localhost:4000/auth/graphql
- Pedido: http://localhost:4000/pedidos/graphql
- Fleet: http://localhost:4000/fleet/graphql
- Billing: http://localhost:4000/billing/graphql

Headers recomendados:
- Content-Type: application/json
- Authorization: Bearer <token>

### Auth - login (mutation)
```json
{
  "query": "mutation($input: LoginInput!) { login(input: $input) { token usuario { id username roles } } }",
  "variables": {
    "input": { "username": "cliente1", "password": "123456" }
  }
}
```

### Pedido - crear pedido (mutation)
```json
{
  "query": "mutation($input: CreatePedidoInput!) { crearPedido(input: $input) { id codigo estado tipoEntrega } }",
  "variables": {
    "input": {
      "clienteId": "1",
      "direccionOrigen": "Av. Siempre Viva 123",
      "direccionDestino": "Calle 10 y Av. 6",
      "descripcion": "Paquete pequeno",
      "tipoEntrega": "URBANO",
      "zonaId": "ZONA-1",
      "peso": 2.5
    }
  }
}
```

### Pedido - consultar pedidos (query)
```json
{
  "query": "query($filtro: PedidoFiltro) { pedidos(filtro: $filtro) { id codigo estado tipoEntrega zonaId } }",
  "variables": { "filtro": { "zonaId": "ZONA-1" } }
}
```

### Fleet - resumen de flota (query)
```json
{
  "query": "query($zonaId: String) { flotaActiva(zonaId: $zonaId) { total disponibles enRuta mantenimiento } }",
  "variables": { "zonaId": "ZONA-1" }
}
```

### Billing - KPI diario (query)
```json
{
  "query": "query($fecha: String!, $zonaId: String) { kpiDiario(fecha: $fecha, zonaId: $zonaId) { totalFacturado cantidadFacturas facturasPagadas promedioFactura } }",
  "variables": { "fecha": "2026-02-07", "zonaId": "ZONA-1" }
}
```

## Validacion basica de cadena evento -> notificacion -> WebSocket

1) Crear pedido (REST o GraphQL).
2) Cambiar estado a EN_RUTA (REST o GraphQL).
3) Verificar notificaciones:
   - GET http://localhost:4000/notifications/notifications?limit=10
4) (Opcional) WebSocket:
   - ws://localhost:4000/ws?token=<jwt>
   - Enviar {"type":"SUBSCRIBE","topic":"pedido/*"}

Si el mensaje no llega, revisar RabbitMQ y el log del api-gateway.
