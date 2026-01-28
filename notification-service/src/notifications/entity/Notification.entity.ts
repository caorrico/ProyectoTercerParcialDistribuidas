import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum Severity {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'event_id', unique: true })
  eventId!: string;

  @Column()
  microservice!: string;

  @Column()
  action!: string;

  @Column({ name: 'entity_type' })
  entityType!: string;

  @Column({ name: 'entity_id' })
  entityId!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'enum',
    enum: Severity,
    default: Severity.INFO
  })
  severity!: Severity;

  @Column({ name: 'event_timestamp' })
  eventTimestamp!: Date;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, unknown>;

  @Column({ default: false })
  processed!: boolean;

  @Column({ name: 'processed_at', nullable: true })
  processedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
