import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Offer } from '../../offers/entities/offer.entity';
import { User } from '../../users/entities/user.entity';
import { Currency } from '../../common/enums/currency.enum';

export enum LoanApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PENDING_OFFER = 'PENDING_OFFER',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum EligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  NEED_MORE_DOWN = 'NEED_MORE_DOWN',
  INELIGIBLE = 'INELIGIBLE',
  STALE_VALUATION = 'STALE_VALUATION',
}

@Entity('loan_applications')
export class LoanApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  user?: User;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.applications, { eager: true, onDelete: 'CASCADE' })
  vehicle: Vehicle;

  @Column()
  vehicleId: string;

  @Column({ length: 120 })
  applicantName: string;

  @Index()
  @Column({ length: 120 })
  applicantEmail: string;

  @Column({ length: 32, nullable: true })
  applicantPhone?: string;

  @Column({ length: 20 })
  bvn: string;

  @Column({ length: 20, nullable: true })
  nin?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: string;

  @Column({ type: 'text', nullable: true })
  residentialAddress?: string;

  @Column('float')
  listingPrice: number;

  @Column('float', { nullable: true })
  snapshotRetailValue?: number;

  @Column('float', { nullable: true })
  snapshotLoanValue?: number;

  @Column({ type: 'datetime', nullable: true })
  valuationFetchedAt?: Date;

  @Column('float')
  requestedDownPaymentPct: number;

  @Column('int')
  requestedTermMonths: number;

  @Column('float')
  desiredMonthlyPayment: number;

  @Column('float')
  desiredInterestRate: number;

  @Column({ type: 'text', default: Currency.NGN })
  currency: Currency;

  @Column('float')
  ltvCap: number;

  @Column('float', { nullable: true })
  plannedDownAmount?: number;

  @Column('float', { nullable: true })
  initialNeeded?: number;

  @Column('float', { nullable: true })
  maxFinance?: number;

  @Column('float', { nullable: true })
  validatedLoanAmount?: number;

  @Column('float', { nullable: true })
  requiredExtraDown?: number;

  @Column('float', { nullable: true })
  impliedMonthlyPayment?: number;

  @Column('float', { nullable: true })
  impliedTotalInterest?: number;

  @Column({ type: 'text', nullable: true })
  eligibilityStatus?: EligibilityStatus;

  @Column({ type: 'text', nullable: true })
  eligibilityReasons?: string;

  @Column({ type: 'text', default: LoanApplicationStatus.SUBMITTED })
  status: LoanApplicationStatus;

  @Column({ type: 'boolean', default: false })
  isGuest: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Offer, (o) => o.application)
  offers: Offer[];
}
