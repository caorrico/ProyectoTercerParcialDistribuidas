import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RolNombre } from './rol-nombre.enum';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: RolNombre,
    enumName: 'rol_nombre_enum',
    unique: true
  })
  nombre!: RolNombre;
}
