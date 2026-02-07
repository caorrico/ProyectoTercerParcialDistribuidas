import { getChannel, EXCHANGE_NAME, ROUTING_KEYS } from './rabbitmq.config';
import { Pedido } from '../entities';
import { v4 as uuidv4 } from 'uuid';

export interface PedidoEvent {
  id: string;
  microservice: string;
  action: string;
  entityType: string;
  entityId: string;
  message: string;
  timestamp: string;
  severity: 'INFO' | 'WARN' | 'ERROR';
  data: Record<string, unknown>;
}

export class PedidoProducer {
  private createEvent(
    action: string,
    pedido: Pedido,
    message: string,
    severity: 'INFO' | 'WARN' | 'ERROR' = 'INFO'
  ): PedidoEvent {
    return {
      id: uuidv4(),
      microservice: 'pedido-service',
      action,
      entityType: 'Pedido',
      entityId: pedido.codigo,
      message,
      timestamp: new Date().toISOString(),
      severity,
      data: {
        pedidoId: pedido.id,
        codigo: pedido.codigo,
        clienteId: pedido.clienteId,
        repartidorId: pedido.repartidorId,
        estado: pedido.estado,
        tipoEntrega: pedido.tipoEntrega,
        direccionOrigen: pedido.direccionOrigen,
        direccionDestino: pedido.direccionDestino,
        zonaId: pedido.zonaId
      }
    };
  }

async publishPedidoEnRuta(pedido: Pedido): Promise<void> {
  const channel = getChannel();
  if (!channel) {
    console.error('Canal RabbitMQ no disponible');
    return;
  }

  const event = this.createEvent(
    'PEDIDO_EN_RUTA',
    pedido,
    `Pedido ${pedido.codigo} en ruta`
  );

  (event.data as Record<string, unknown>).vehiculoId = pedido.id;

  channel.publish(
    EXCHANGE_NAME,
    ROUTING_KEYS.PEDIDO_EN_RUTA,
    Buffer.from(JSON.stringify(event)),
    { persistent: true, messageId: event.id }
  );

  console.log(`📤 Evento publicado: ${ROUTING_KEYS.PEDIDO_EN_RUTA}`, event.id);
}



  async publishPedidoCreado(pedido: Pedido): Promise<void> {
    const channel = getChannel();
    if (!channel) {
      console.error('Canal RabbitMQ no disponible');
      return;
    }

    const event = this.createEvent(
      'PEDIDO_CREADO',
      pedido,
      `Nuevo pedido ${pedido.codigo} creado para entrega ${pedido.tipoEntrega}`
    );

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.PEDIDO_CREADO,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.PEDIDO_CREADO}`, event.id);
  }

  async publishPedidoActualizado(pedido: Pedido, estadoAnterior: string): Promise<void> {
    const channel = getChannel();
    if (!channel) {
      console.error('Canal RabbitMQ no disponible');
      return;
    }

    const event = this.createEvent(
      'PEDIDO_ACTUALIZADO',
      pedido,
      `Pedido ${pedido.codigo} cambió de ${estadoAnterior} a ${pedido.estado}`
    );

    (event.data as Record<string, unknown>).estadoAnterior = estadoAnterior;

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.PEDIDO_ACTUALIZADO,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.PEDIDO_ACTUALIZADO}`, event.id);
  }

  async publishPedidoAsignado(pedido: Pedido, repartidorId: number): Promise<void> {
    const channel = getChannel();
    if (!channel) {
      console.error('Canal RabbitMQ no disponible');
      return;
    }

    const event = this.createEvent(
      'PEDIDO_ASIGNADO',
      pedido,
      `Pedido ${pedido.codigo} asignado al repartidor ${repartidorId}`
    );

    (event.data as Record<string, unknown>).repartidorId = repartidorId;

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.PEDIDO_ASIGNADO,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.PEDIDO_ASIGNADO}`, event.id);
  }

  async publishPedidoCancelado(pedido: Pedido, motivo: string): Promise<void> {
    const channel = getChannel();
    if (!channel) {
      console.error('Canal RabbitMQ no disponible');
      return;
    }

    const event = this.createEvent(
      'PEDIDO_CANCELADO',
      pedido,
      `Pedido ${pedido.codigo} cancelado: ${motivo}`,
      'WARN'
    );

    (event.data as Record<string, unknown>).motivo = motivo;

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.PEDIDO_CANCELADO,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.PEDIDO_CANCELADO}`, event.id);
  }

  async publishPedidoEntregado(pedido: Pedido): Promise<void> {
    const channel = getChannel();
    if (!channel) {
      console.error('Canal RabbitMQ no disponible');
      return;
    }

    const event = this.createEvent(
      'PEDIDO_ENTREGADO',
      pedido,
      `Pedido ${pedido.codigo} entregado exitosamente`
    );

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.PEDIDO_ENTREGADO,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.PEDIDO_ENTREGADO}`, event.id);
  }
}

export const pedidoProducer = new PedidoProducer();
