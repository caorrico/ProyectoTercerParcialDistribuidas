import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum EstadoPedido {
  RECIBIDO = 'RECIBIDO',
  ASIGNADO = 'ASIGNADO',
  EN_RUTA = 'EN_RUTA',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO'
}

export enum TipoEntrega {
  URBANO = 'URBANO',
  INTERMUNICIPAL = 'INTERMUNICIPAL',
  NACIONAL = 'NACIONAL'
}

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  codigo!: string;

  @Column({ name: 'cliente_id' })
  clienteId!: number;

  @Column({ name: 'repartidor_id', nullable: true })
  repartidorId?: number;

  @Column({ name: 'direccion_origen' })
  direccionOrigen!: string;

  @Column({ name: 'direccion_destino' })
  direccionDestino!: string;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({
    type: 'enum',
    enum: EstadoPedido,
    default: EstadoPedido.RECIBIDO
  })
  estado!: EstadoPedido;

  @Column({
    type: 'enum',
    enum: TipoEntrega,
    name: 'tipo_entrega'
  })
  tipoEntrega!: TipoEntrega;

  @Column({ name: 'zona_id', nullable: true })
  zonaId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  peso?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'lat_origen', nullable: true })
  latOrigen?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'lng_origen', nullable: true })
  lngOrigen?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'lat_destino', nullable: true })
  latDestino?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, name: 'lng_destino', nullable: true })
  lngDestino?: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'fecha_estimada_entrega', nullable: true })
  fechaEstimadaEntrega?: Date;

  @Column({ name: 'fecha_entrega', nullable: true })
  fechaEntrega?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  generateCodigo() {
    this.codigo = `PED-${uuidv4().substring(0, 8).toUpperCase()}`;
  }
}
