import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Vehiculo } from './Vehiculo.entity';

export enum TipoEstado {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO'
}

export enum TipoLicencia {
  A = 'A',
  B = 'B',
  C = 'C',
  E = 'E'
}

@Entity('repartidores')
export class Repartidor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  identificacion!: string;

  @Column()
  nombre!: string;

  @Column()
  apellido!: string;

  @Column()
  telefono!: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  licencia!: string;

  @Column({
    type: 'enum',
    enum: TipoLicencia,
    name: 'tipo_licencia'
  })
  tipoLicencia!: TipoLicencia;

  @Column({
    type: 'enum',
    enum: TipoEstado,
    default: TipoEstado.ACTIVO
  })
  estado!: TipoEstado;

  @Column({ name: 'zona_id', nullable: true })
  zonaId?: string;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  @OneToOne(() => Vehiculo, { nullable: true, eager: true })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo?: Vehiculo;

  @Column({ name: 'vehiculo_id', nullable: true })
  vehiculoId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'lat_actual', nullable: true })
  latActual?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'lng_actual', nullable: true })
  lngActual?: number;

  @Column({ name: 'ultima_actualizacion_ubicacion', nullable: true })
  ultimaActualizacionUbicacion?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
