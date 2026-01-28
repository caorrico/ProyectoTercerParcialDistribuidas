import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Rol } from './Rol.entity';

export enum RolNombre {
  ROLE_CLIENTE = 'ROLE_CLIENTE',
  ROLE_REPARTIDOR = 'ROLE_REPARTIDOR',
  ROLE_SUPERVISOR = 'ROLE_SUPERVISOR',
  ROLE_GERENTE = 'ROLE_GERENTE',
  ROLE_ADMIN = 'ROLE_ADMIN'
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 50 })
  username!: string;

  @Column({ unique: true, length: 100 })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ name: 'zona_id', nullable: true })
  zonaId?: string;

  @Column({ name: 'tipo_flota', nullable: true })
  tipoFlota?: string;

  @Column({ default: true })
  activo!: boolean;

  @ManyToMany(() => Rol, { eager: true })
  @JoinTable({
    name: 'usuario_roles',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' }
  })
  roles!: Rol[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
