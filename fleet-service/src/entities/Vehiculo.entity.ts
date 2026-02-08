import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, TableInheritance, ChildEntity } from 'typeorm';

export enum TipoVehiculo {
  MOTO = 'MOTO',
  LIVIANO = 'LIVIANO',
  CAMION = 'CAMION'
}

export enum EstadoVehiculo {
  DISPONIBLE = 'DISPONIBLE',
  EN_RUTA = 'EN_RUTA',
  MANTENIMIENTO = 'MANTENIMIENTO'
}

export enum MotoType {
  NAKED = 'NAKED',
  DEPORTIVA = 'DEPORTIVA',
  ENDURO = 'ENDURO',
  CHOPPER = 'CHOPPER',
  TOURING = 'TOURING',
  CROSS = 'CROSS',
  CAFE_RACER = 'CAFE_RACER'
}

export enum AutoType {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  HATCHBACK = 'HATCHBACK',
  CAMIONETA = 'CAMIONETA',
  COUPE = 'COUPE',
  MINIVAN = 'MINIVAN',
  CONVERTIBLE = 'CONVERTIBLE'
}

@Entity('vehiculos')
@TableInheritance({ column: { type: 'varchar', name: 'tipo_vehiculo' } })
export abstract class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  placa!: string;

  @Column()
  marca!: string;

  @Column()
  modelo!: string;

  @Column()
  color!: string;

  @Column({ name: 'anio_fabricacion' })
  anioFabricacion!: string;
  
  @Column()
  cilindraje!: number;

  @Column({ default: true })
  activo!: boolean;

  @Column({
    type: 'enum',
    enum: EstadoVehiculo,
    default: EstadoVehiculo.DISPONIBLE
  })
  estado!: EstadoVehiculo;

  readonly tipoVehiculo!: TipoVehiculo;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


@ChildEntity(TipoVehiculo.MOTO)
export class Moto extends Vehiculo {
  @Column({
    type: 'enum',
    enum: MotoType,
    name: 'tipo_moto'
  })
  tipoMoto!: MotoType;

  @Column({ name: 'tiene_casco', default: true })
  tieneCasco!: boolean;
}

@ChildEntity(TipoVehiculo.LIVIANO)
export class Liviano extends Vehiculo {
  @Column({
    type: 'enum',
    enum: AutoType,
    name: 'tipo_auto'
  })
  tipoAuto!: AutoType;

  @Column({ name: 'tipo_combustible' })
  tipoCombustible!: string;

  @Column({ name: 'numero_puertas' })
  numeroPuertas!: number;

  @Column({ name: 'capacidad_maletero_litros', type: 'decimal', precision: 10, scale: 2 })
  capacidadMaleteroLitros!: number;

  @Column({ name: 'capacidad_ocupantes' })
  capacidadOcupantes!: number;

  @Column()
  transmision!: string;
}

@ChildEntity(TipoVehiculo.CAMION)
export class Camion extends Vehiculo {
  @Column({ name: 'capacidad_toneladas', type: 'decimal', precision: 10, scale: 2 })
  capacidadToneladas!: number;

  @Column({ name: 'tipo_carga', nullable: true })
  tipoCarga?: string;

  @Column({ name: 'numero_ejes', default: 2 })
  numeroEjes!: number;
}
