import { AppDataSource } from '../utils/database';
import { Repartidor, TipoEstado } from '../entities';
import { fleetProducer } from '../messaging/fleet.producer';

export interface TrackingUpdate {
  repartidorId: string;
  lat: number;
  lng: number;
  pedidoId?: string;
  velocidad?: number;
  rumbo?: number;
  precision?: number;
  timestamp?: Date;
}

export interface TrackingHistory {
  id: string;
  repartidorId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  pedidoId?: string;
}

// Almacenamiento en memoria para historial de tracking (en producción usar Redis)
const trackingHistory: Map<string, TrackingHistory[]> = new Map();
const MAX_HISTORY_PER_REPARTIDOR = 100;

export class TrackingService {
  private repartidorRepository = AppDataSource.getRepository(Repartidor);

  /**
   * Actualizar ubicación de un repartidor y publicar evento
   */
  async actualizarUbicacion(update: TrackingUpdate, userId: string, userRoles: string[]): Promise<{
    repartidor: Repartidor;
    timestamp: Date;
  }> {
    const { repartidorId, lat, lng, pedidoId } = update;

    // Verificar que el repartidor existe
    const repartidor = await this.repartidorRepository.findOne({
      where: { id: repartidorId },
      relations: ['vehiculo']
    });

    if (!repartidor) {
      throw new Error('Repartidor no encontrado');
    }

    // Validar permisos - solo el propio repartidor o admin/supervisor pueden actualizar
    const isOwnRepartidor = repartidor.usuarioId === userId;
    const isAdmin = userRoles.some(r => ['ROLE_ADMIN', 'ROLE_SUPERVISOR', 'ROLE_GERENTE'].includes(r));

    if (!isOwnRepartidor && !isAdmin) {
      throw new Error('No tiene permisos para actualizar esta ubicación');
    }

    // Actualizar ubicación
    const timestamp = new Date();
    repartidor.latActual = lat;
    repartidor.lngActual = lng;
    repartidor.ultimaActualizacionUbicacion = timestamp;

    await this.repartidorRepository.save(repartidor);

    // Guardar en historial
    this.addToHistory(repartidorId, { lat, lng, timestamp, pedidoId });

    // Publicar evento de ubicación actualizada
    await fleetProducer.publishRepartidorUbicacion(repartidor);

    // Si hay un pedido asociado, publicar también evento de tracking de pedido
    if (pedidoId) {
      await fleetProducer.publishTrackingPedido({
        pedidoId,
        repartidorId,
        lat,
        lng,
        timestamp: timestamp.toISOString(),
        vehiculo: repartidor.vehiculo ? {
          id: repartidor.vehiculo.id,
          placa: repartidor.vehiculo.placa,
          tipo: repartidor.vehiculo.tipoVehiculo
        } : undefined
      });
    }

    return { repartidor, timestamp };
  }

  /**
   * Obtener última ubicación conocida de un repartidor
   */
  async obtenerUltimaUbicacion(repartidorId: string): Promise<{
    lat: number;
    lng: number;
    timestamp: Date;
  } | null> {
    const repartidor = await this.repartidorRepository.findOne({
      where: { id: repartidorId }
    });

    if (!repartidor || !repartidor.latActual || !repartidor.lngActual) {
      return null;
    }

    return {
      lat: Number(repartidor.latActual),
      lng: Number(repartidor.lngActual),
      timestamp: repartidor.ultimaActualizacionUbicacion || new Date()
    };
  }

  /**
   * Obtener historial de ubicaciones de un repartidor
   */
  async obtenerHistorialUbicacion(repartidorId: string, limit: number = 50): Promise<TrackingHistory[]> {
    const history = trackingHistory.get(repartidorId) || [];
    return history.slice(-limit);
  }

  /**
   * Obtener ubicaciones de todos los repartidores activos
   */
  async obtenerUbicacionesActivas(zonaId?: string): Promise<{
    repartidorId: string;
    nombre: string;
    lat: number;
    lng: number;
    timestamp: Date;
    vehiculo?: { placa: string; tipo: string };
  }[]> {
    const where: any = { estado: TipoEstado.ACTIVO };
    if (zonaId) {
      where.zonaId = zonaId;
    }

    const repartidores = await this.repartidorRepository.find({
      where,
      relations: ['vehiculo']
    });

    return repartidores
      .filter(r => r.latActual && r.lngActual)
      .map(r => ({
        repartidorId: r.id,
        nombre: `${r.nombre} ${r.apellido}`,
        lat: Number(r.latActual),
        lng: Number(r.lngActual),
        timestamp: r.ultimaActualizacionUbicacion || new Date(),
        vehiculo: r.vehiculo ? {
          placa: r.vehiculo.placa,
          tipo: r.vehiculo.tipoVehiculo
        } : undefined
      }));
  }

  /**
   * Calcular distancia entre dos puntos (fórmula de Haversine)
   */
  calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Obtener repartidores cercanos a una ubicación
   */
  async obtenerRepartidoresCercanos(
    lat: number,
    lng: number,
    radioKm: number = 5,
    zonaId?: string
  ): Promise<{
    repartidor: { id: string; nombre: string };
    distanciaKm: number;
    ubicacion: { lat: number; lng: number };
  }[]> {
    const ubicaciones = await this.obtenerUbicacionesActivas(zonaId);

    return ubicaciones
      .map(u => ({
        repartidor: { id: u.repartidorId, nombre: u.nombre },
        distanciaKm: this.calcularDistancia(lat, lng, u.lat, u.lng),
        ubicacion: { lat: u.lat, lng: u.lng }
      }))
      .filter(r => r.distanciaKm <= radioKm)
      .sort((a, b) => a.distanciaKm - b.distanciaKm);
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private addToHistory(repartidorId: string, data: Omit<TrackingHistory, 'id' | 'repartidorId'>) {
    if (!trackingHistory.has(repartidorId)) {
      trackingHistory.set(repartidorId, []);
    }

    const history = trackingHistory.get(repartidorId)!;
    history.push({
      id: Date.now().toString(),
      repartidorId,
      ...data
    });

    // Mantener solo los últimos N registros
    if (history.length > MAX_HISTORY_PER_REPARTIDOR) {
      history.shift();
    }
  }
}

export const trackingService = new TrackingService();
