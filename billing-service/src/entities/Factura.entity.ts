import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum EstadoFactura {
  BORRADOR = 'BORRADOR',
  EMITIDA = 'EMITIDA',
  PAGADA = 'PAGADA',
  ANULADA = 'ANULADA'
}

@Entity('facturas')
export class Factura {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, name: 'numero_factura' })
  numeroFactura!: string;

  @Column({ name: 'pedido_id' })
  pedidoId!: number;

  @Column({ name: 'cliente_id' })
  clienteId!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  impuestos!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @Column({
    type: 'enum',
    enum: EstadoFactura,
    default: EstadoFactura.BORRADOR
  })
  estado!: EstadoFactura;

  @Column({ name: 'fecha_emision', nullable: true })
  fechaEmision?: Date;

  @Column({ name: 'fecha_pago', nullable: true })
  fechaPago?: Date;

  @Column({ name: 'metodo_pago', nullable: true })
  metodoPago?: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'tipo_entrega', nullable: true })
  tipoEntrega?: string;

  @Column({ name: 'zona_id', nullable: true })
  zonaId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  generateNumeroFactura() {
    const timestamp = Date.now().toString().slice(-6);
    this.numeroFactura = `FAC-${timestamp}-${uuidv4().substring(0, 4).toUpperCase()}`;
  }
}
