import { getChannel, EXCHANGE_NAME, ROUTING_KEYS } from './rabbitmq.config';
import { Vehiculo, Repartidor } from '../entities';
import { v4 as uuidv4 } from 'uuid';

export interface FleetEvent {
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

export class FleetProducer {
  private createEvent(
    action: string,
    entityType: string,
    entityId: string,
    message: string,
    data: Record<string, unknown>,
    severity: 'INFO' | 'WARN' | 'ERROR' = 'INFO'
  ): FleetEvent {
    return {
      id: uuidv4(),
      microservice: 'fleet-service',
      action,
      entityType,
      entityId,
      message,
      timestamp: new Date().toISOString(),
      severity,
      data
    };
  }

  async publishVehiculoCreado(vehiculo: Vehiculo): Promise<void> {
    const channel = getChannel();
    if (!channel) return;

    const event = this.createEvent(
      'VEHICULO_CREADO',
      'Vehiculo',
      vehiculo.placa,
      `Nuevo vehículo registrado: ${vehiculo.placa}`,
      {
        id: vehiculo.id,
        placa: vehiculo.placa,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        tipoVehiculo: vehiculo.tipoVehiculo,
        estado: vehiculo.estado
      }
    );

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.VEHICULO_CREADO,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.VEHICULO_CREADO}`);
  }

  async publishVehiculoActualizado(vehiculo: Vehiculo, estadoAnterior: string): Promise<void> {
    const channel = getChannel();
    if (!channel) return;

    const event = this.createEvent(
      'VEHICULO_ACTUALIZADO',
      'Vehiculo',
      vehiculo.placa,
      `Vehículo ${vehiculo.placa} cambió de ${estadoAnterior} a ${vehiculo.estado}`,
      {
        id: vehiculo.id,
        placa: vehiculo.placa,
        estadoAnterior,
        estadoActual: vehiculo.estado
      }
    );

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.VEHICULO_ACTUALIZADO,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.VEHICULO_ACTUALIZADO}`);
  }

  async publishRepartidorCreado(repartidor: Repartidor): Promise<void> {
    const channel = getChannel();
    if (!channel) return;

    const event = this.createEvent(
      'REPARTIDOR_CREADO',
      'Repartidor',
      repartidor.identificacion,
      `Nuevo repartidor registrado: ${repartidor.nombre} ${repartidor.apellido}`,
      {
        id: repartidor.id,
        identificacion: repartidor.identificacion,
        nombre: repartidor.nombre,
        apellido: repartidor.apellido,
        tipoLicencia: repartidor.tipoLicencia,
        zonaId: repartidor.zonaId
      }
    );

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.REPARTIDOR_CREADO,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.REPARTIDOR_CREADO}`);
  }

  async publishRepartidorUbicacion(repartidor: Repartidor): Promise<void> {
    const channel = getChannel();
    if (!channel) return;

    const event = this.createEvent(
      'REPARTIDOR_UBICACION',
      'Repartidor',
      repartidor.identificacion,
      `Ubicación actualizada para ${repartidor.nombre}`,
      {
        id: repartidor.id,
        identificacion: repartidor.identificacion,
        latActual: repartidor.latActual,
        lngActual: repartidor.lngActual,
        timestamp: new Date().toISOString()
      }
    );

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.REPARTIDOR_UBICACION,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.REPARTIDOR_UBICACION}`);
  }

  async publishVehiculoAsignado(repartidor: Repartidor, vehiculo: Vehiculo): Promise<void> {
    const channel = getChannel();
    if (!channel) return;

    const event = this.createEvent(
      'VEHICULO_ASIGNADO',
      'Repartidor',
      repartidor.identificacion,
      `Vehículo ${vehiculo.placa} asignado a ${repartidor.nombre}`,
      {
        repartidorId: repartidor.id,
        vehiculoId: vehiculo.id,
        placa: vehiculo.placa,
        tipoVehiculo: vehiculo.tipoVehiculo
      }
    );

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEYS.VEHICULO_ASIGNADO,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${ROUTING_KEYS.VEHICULO_ASIGNADO}`);
  }

  async publishTrackingPedido(data: {
    pedidoId: string;
    repartidorId: string;
    lat: number;
    lng: number;
    timestamp: string;
    vehiculo?: { id: string; placa: string; tipo: string };
  }): Promise<void> {
    const channel = getChannel();
    if (!channel) return;

    const event = this.createEvent(
      'TRACKING_PEDIDO',
      'Tracking',
      data.pedidoId.toString(),
      `Tracking actualizado para pedido #${data.pedidoId}`,
      {
        pedidoId: data.pedidoId,
        repartidorId: data.repartidorId,
        lat: data.lat,
        lng: data.lng,
        timestamp: data.timestamp,
        vehiculo: data.vehiculo
      }
    );

    // Usar routing key específico para tracking
    const routingKey = 'tracking.pedido.actualizado';

    channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, messageId: event.id }
    );

    console.log(`📤 Evento publicado: ${routingKey}`);
  }
}

export const fleetProducer = new FleetProducer();
