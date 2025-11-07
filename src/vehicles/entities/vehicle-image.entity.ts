import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity('vehicle_images')
export class VehicleImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.vehicleImages, { onDelete: 'CASCADE' })
  vehicle: Vehicle;

  @Index()
  @Column()
  vehicleId: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text', nullable: true })
  filename?: string; // Store filename for easy deletion

  @Column({ type: 'int', default: 0 })
  displayOrder: number; // For sorting images

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean; // Mark the main/cover image

  @Column({ type: 'text', nullable: true })
  caption?: string;

  @CreateDateColumn()
  createdAt: Date;
}

