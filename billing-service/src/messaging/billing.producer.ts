import { getChannel, EXCHANGE_NAME, ROUTING_KEYS } from './rabbitmq.config';
import { Factura } from '../entities';
import { v4 as uuidv4 } from 'uuid';

export interface BillingEvent {
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

export class BillingProducer {
  private createEvent(
    action: string,
    factura: Factura,
    message: string,
    severity: 'INFO' | 'WARN' | 'ERROR' = 'INFO'
  ): BillingEvent {
    return {
      id: uuidv4(),
      microservice: 'billing-service',
      action,
      entityType: 'Factura',
      entityId: factura.numeroFactura,
      message,
      timestamp: new Date().toISOString(),
      severity,
      data: {
        facturaId: factura.id,
        numeroFactura: factura.numeroFactura,
        pedidoId: factura.pedidoId,
        clienteId: factura.clienteId,
        total: factura.total,
        estado: factura.estado
      }
    };
  }

  async publishFacturaCreada(factura: Factura): Promise<void> {
    const channel = getChannel();
    if (!channel) return;

    const event = this.createEvent(
      'FACTURA_CREADA',
      factura,
      `Nueva factura ${factura.numeroFactura} creada por $${factura.total}`
    );

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.FACTURA_CREADA,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.FACTURA_CREADA}`);
  }

  async publishFacturaEmitida(factura: Factura): Promise<void> {
    const channel = getChannel();
    if (!channel) return;

    const event = this.createEvent(
      'FACTURA_EMITIDA',
      factura,
      `Factura ${factura.numeroFactura} emitida`
    );

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.FACTURA_EMITIDA,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.FACTURA_EMITIDA}`);
  }

  async publishFacturaPagada(factura: Factura): Promise<void> {
    const channel = getChannel();
    if (!channel) return;

    const event = this.createEvent(
      'FACTURA_PAGADA',
      factura,
      `Factura ${factura.numeroFactura} pagada`
    );

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.FACTURA_PAGADA,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.FACTURA_PAGADA}`);
  }

  async publishFacturaAnulada(factura: Factura, motivo: string): Promise<void> {
    const channel = getChannel();
    if (!channel) return;

    const event = this.createEvent(
      'FACTURA_ANULADA',
      factura,
      `Factura ${factura.numeroFactura} anulada: ${motivo}`,
      'WARN'
    );

    (event.data as Record<string, unknown>).motivo = motivo;

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.FACTURA_ANULADA,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.FACTURA_ANULADA}`);
  }
}

export const billingProducer = new BillingProducer();
