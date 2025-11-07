import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoanApplication } from '../../loans/entities/loan-application.entity';
import { Valuation } from '../../valuations/entities/valuation.entity';
import { User } from '../../users/entities/user.entity';
import { VehicleImage } from './vehicle-image.entity';
import { Currency } from '../../common/enums/currency.enum';

export enum VehicleStatus {
  LISTED = 'LISTED',
  INSPECTED = 'INSPECTED',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
}

export enum VehicleType {
  LOCAL_USED = 'local_used',
  FOREIGN_USED = 'foreign_used',
  BRAND_NEW = 'brand_new',
}

export enum DriveType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 32 })
  vin: string;

  @Column({ length: 64 })
  make: string;

  @Column({ length: 64 })
  model: string;

  @Column({ length: 64, nullable: true })
  trim?: string;

  @Column('int')
  year: number;

  @Column('int', { nullable: true })
  mileage?: number;

  @Column({ type: 'text', nullable: true })
  vehicleType?: VehicleType;

  @Column({ type: 'text', nullable: true })
  condition?: string;

  @OneToMany(() => VehicleImage, (image) => image.vehicle, { eager: true, cascade: true })
  vehicleImages: VehicleImage[];

  // Technical Specifications
  @Column({ length: 128, nullable: true })
  engine?: string;

  @Column({ type: 'text', nullable: true })
  transmission?: string;

  @Column({ type: 'text', nullable: true })
  driveType?: DriveType;

  @Column({ length: 64, nullable: true })
  fuelType?: string;

  // Appearance
  @Column({ length: 64, nullable: true })
  exteriorColor?: string;

  @Column({ length: 64, nullable: true })
  interiorColor?: string;

  // Location
  @Column({ type: 'text', nullable: true })
  address?: string;

  @ManyToOne(() => User, { eager: true })
  owner: User;

  @Column()
  ownerId: string;

  @Column('float', { nullable: true })
  listingPrice?: number;

  @Column({ type: 'text', default: Currency.NGN })
  currency: Currency;

  @Column('float', { default: 0.40 })
  requiredDownPaymentPct: number;

  @Column({ length: 64, nullable: true })
  region?: string;

  @Column('float', { nullable: true })
  retailValue?: number;

  @Column('float', { nullable: true })
  loanValue?: number;

  @Column({ type: 'text', nullable: true })
  valuationSource?: string;

  @Column({ type: 'datetime', nullable: true })
  valuationFetchedAt?: Date;

  @Column({ type: 'text', default: VehicleStatus.LISTED })
  status: VehicleStatus;

  // Loan Configuration
  @Column({ type: 'boolean', default: true })
  isLoanAvailable: boolean;

  @Column('float', { nullable: true })
  minLoanValue?: number;

  @Column('int', { nullable: true })
  maxLoanPeriodMonths?: number;

  @OneToMany(() => LoanApplication, (a) => a.vehicle)
  applications: LoanApplication[];

  @OneToMany(() => Valuation, (v) => v.vehicle)
  valuations: Valuation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
