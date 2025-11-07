import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('valuations')
export class Valuation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.valuations, { onDelete: 'CASCADE' })
  vehicle: Vehicle;

  @Column()
  vehicleId: string;

  @Column('float')
  retailValue: number;

  @Column('float')
  loanValue: number;

  @Column({ type: 'text' })
  source: string;

  @Index()
  @Column({ type: 'datetime' })
  fetchedAt: Date;

  @Column({ type: 'text', nullable: true })
  providerRef?: string;

  @CreateDateColumn()
  createdAt: Date;
}
