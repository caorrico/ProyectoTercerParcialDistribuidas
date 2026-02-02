import { AppDataSource } from '../utils/database';
import { Vehiculo, Moto, Liviano, Camion, Repartidor, EstadoVehiculo, TipoVehiculo, TipoEstado } from '../entities';
import { fleetProducer } from '../messaging/fleet.producer';
import { In } from 'typeorm';

export interface CreateMotoInput {
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  anioFabricacion: string;
  cilindraje: number;
  tipoMoto: string;
  tieneCasco?: boolean;
}

export interface CreateLivianoInput {
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  anioFabricacion: string;
  cilindraje: number;
  tipoAuto: string;
  tipoCombustible: string;
  numeroPuertas: number;
  capacidadMaleteroLitros: number;
  capacidadOcupantes: number;
  transmision: string;
}

export interface CreateCamionInput {
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  anioFabricacion: string;
  cilindraje: number;
  capacidadToneladas: number;
  tipoCarga?: string;
  numeroEjes?: number;
}

export interface CreateRepartidorInput {
  identificacion: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
  licencia: string;
  tipoLicencia: string;
  zonaId?: string;
  usuarioId?: number;
}

export class FleetService {
  private vehiculoRepository = AppDataSource.getRepository(Vehiculo);
  private motoRepository = AppDataSource.getRepository(Moto);
  private livianoRepository = AppDataSource.getRepository(Liviano);
  private camionRepository = AppDataSource.getRepository(Camion);
  private repartidorRepository = AppDataSource.getRepository(Repartidor);

  // VEHÍCULOS
  async crearMoto(input: CreateMotoInput): Promise<Moto> {
    const motoData = {
      ...input,
      tipoVehiculo: TipoVehiculo.MOTO,
      estado: EstadoVehiculo.DISPONIBLE,
      activo: true,
      tieneCasco: input.tieneCasco ?? true
    };
    const nuevaMoto = this.motoRepository.create(motoData as any);
    const moto = await this.motoRepository.save(nuevaMoto) as unknown as Moto;
    await fleetProducer.publishVehiculoCreado(moto);
    return moto;
  }

  async crearLiviano(input: CreateLivianoInput): Promise<Liviano> {
    const livianoData = {
      ...input,
      tipoVehiculo: TipoVehiculo.LIVIANO,
      estado: EstadoVehiculo.DISPONIBLE,
      activo: true
    };

    const nuevoLiviano = this.livianoRepository.create(livianoData as any);
    const liviano = await this.livianoRepository.save(nuevoLiviano) as unknown as Liviano;
    
    await fleetProducer.publishVehiculoCreado(liviano);
    return liviano;
  }

  async crearCamion(input: CreateCamionInput): Promise<Camion> {
    const nuevoCamion = this.camionRepository.create({
      ...input,
      tipoVehiculo: TipoVehiculo.CAMION,
      estado: EstadoVehiculo.DISPONIBLE,
      activo: true,
      numeroEjes: input.numeroEjes ?? 2
    });

    const camion = await this.camionRepository.save(nuevoCamion);
    await fleetProducer.publishVehiculoCreado(camion);
    return camion;
  }

  async listarVehiculos(): Promise<Vehiculo[]> {
    return this.vehiculoRepository.find({ order: { createdAt: 'DESC' } });
  }

  async listarVehiculosPorTipo(tipo: TipoVehiculo): Promise<Vehiculo[]> {
    return this.vehiculoRepository.find({
      where: { tipoVehiculo: tipo },
      order: { createdAt: 'DESC' }
    });
  }

  async listarVehiculosDisponibles(): Promise<Vehiculo[]> {
    return this.vehiculoRepository.find({
      where: { estado: EstadoVehiculo.DISPONIBLE, activo: true },
      order: { createdAt: 'DESC' }
    });
  }

  async obtenerVehiculoPorPlaca(placa: string): Promise<Vehiculo | null> {
    return this.vehiculoRepository.findOne({ where: { placa } });
  }

  async obtenerVehiculo(id: number): Promise<Vehiculo | null> {
    return this.vehiculoRepository.findOne({ where: { id } });
  }

  async actualizarEstadoVehiculo(placa: string, estado: EstadoVehiculo): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoRepository.findOne({ where: { placa } });
    if (!vehiculo) {
      throw new Error('Vehículo no encontrado');
    }

    const estadoAnterior = vehiculo.estado;
    vehiculo.estado = estado;
    await this.vehiculoRepository.save(vehiculo);

    await fleetProducer.publishVehiculoActualizado(vehiculo, estadoAnterior);
    return vehiculo;
  }

  // REPARTIDORES
  async crearRepartidor(input: CreateRepartidorInput): Promise<Repartidor> {
    const exists = await this.repartidorRepository.findOne({
      where: { identificacion: input.identificacion }
    });

    if (exists) {
      throw new Error('Ya existe un repartidor con esa identificación');
    }

    const dataRepartidor = {
      ...input,
      estado: TipoEstado.ACTIVO
    };

    const nuevoRepartidor = this.repartidorRepository.create(dataRepartidor as any);
    const repartidor = await this.repartidorRepository.save(nuevoRepartidor) as unknown as Repartidor;
    
    await fleetProducer.publishRepartidorCreado(repartidor);
    return repartidor;
  }

  async listarRepartidores(): Promise<Repartidor[]> {
    return this.repartidorRepository.find({
      relations: ['vehiculo'],
      order: { createdAt: 'DESC' }
    });
  }

  async listarRepartidoresActivos(): Promise<Repartidor[]> {
    return this.repartidorRepository.find({
      where: { estado: TipoEstado.ACTIVO },
      relations: ['vehiculo'],
      order: { createdAt: 'DESC' }
    });
  }

  async listarRepartidoresPorZona(zonaId: string): Promise<Repartidor[]> {
    return this.repartidorRepository.find({
      where: { zonaId, estado: TipoEstado.ACTIVO },
      relations: ['vehiculo'],
      order: { createdAt: 'DESC' }
    });
  }

  async obtenerRepartidor(id: number): Promise<Repartidor | null> {
    return this.repartidorRepository.findOne({
      where: { id },
      relations: ['vehiculo']
    });
  }

  async asignarVehiculo(repartidorId: number, placa: string): Promise<Repartidor> {
    const repartidor = await this.repartidorRepository.findOne({
      where: { id: repartidorId },
      relations: ['vehiculo']
    });

    if (!repartidor) {
      throw new Error('Repartidor no encontrado');
    }

    const vehiculo = await this.vehiculoRepository.findOne({ where: { placa } });
    if (!vehiculo) {
      throw new Error('Vehículo no encontrado');
    }

    if (vehiculo.estado !== EstadoVehiculo.DISPONIBLE) {
      throw new Error('El vehículo no está disponible');
    }

    // Verificar que el vehículo no esté asignado a otro repartidor
    const vehiculoAsignado = await this.repartidorRepository.findOne({
      where: { vehiculoId: vehiculo.id }
    });

    if (vehiculoAsignado && vehiculoAsignado.id !== repartidorId) {
      throw new Error('El vehículo ya está asignado a otro repartidor');
    }

    repartidor.vehiculo = vehiculo;
    repartidor.vehiculoId = vehiculo.id;
    await this.repartidorRepository.save(repartidor);

    await fleetProducer.publishVehiculoAsignado(repartidor, vehiculo);
    return repartidor;
  }

  async actualizarUbicacionRepartidor(id: number, lat: number, lng: number): Promise<Repartidor> {
    const repartidor = await this.repartidorRepository.findOne({ where: { id } });
    if (!repartidor) {
      throw new Error('Repartidor no encontrado');
    }

    repartidor.latActual = lat;
    repartidor.lngActual = lng;
    repartidor.ultimaActualizacionUbicacion = new Date();
    await this.repartidorRepository.save(repartidor);

    await fleetProducer.publishRepartidorUbicacion(repartidor);
    return repartidor;
  }

  async cambiarEstadoRepartidor(id: number, estado: TipoEstado): Promise<Repartidor> {
    const repartidor = await this.repartidorRepository.findOne({
      where: { id },
      relations: ['vehiculo']
    });

    if (!repartidor) {
      throw new Error('Repartidor no encontrado');
    }

    repartidor.estado = estado;
    return this.repartidorRepository.save(repartidor);
  }

  async obtenerFlotaActiva(zonaId?: string): Promise<{
    total: number;
    disponibles: number;
    enRuta: number;
    mantenimiento: number;
  }> {
    const where = zonaId ? { zonaId, estado: TipoEstado.ACTIVO } : { estado: TipoEstado.ACTIVO };
    const repartidores = await this.repartidorRepository.find({
      where,
      relations: ['vehiculoId']
    });

    const vehiculosIds = repartidores.filter(r => r.vehiculoId).map(r => r.vehiculoId);

    let disponibles = 0;
    let enRuta = 0;
    let mantenimiento = 0;

    for (const id of vehiculosIds) {
      const vehiculo = await this.vehiculoRepository.findOne({ where: { id: id! } });
      if (vehiculo) {
        switch (vehiculo.estado) {
          case EstadoVehiculo.DISPONIBLE:
            disponibles++;
            break;
          case EstadoVehiculo.EN_RUTA:
            enRuta++;
            break;
          case EstadoVehiculo.MANTENIMIENTO:
            mantenimiento++;
            break;
        }
      }
    }

    return {
      total: vehiculosIds.length,
      disponibles,
      enRuta,
      mantenimiento
    };
  }
}

export const fleetService = new FleetService();
