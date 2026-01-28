import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RolNombre } from './Usuario.entity';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: RolNombre,
    unique: true
  })
  nombre!: RolNombre;
}
