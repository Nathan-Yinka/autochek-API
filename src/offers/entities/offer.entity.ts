import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoanApplication } from '../../loans/entities/loan-application.entity';
import { User } from '../../users/entities/user.entity';

export enum OfferStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoanApplication, (app) => app.offers, { onDelete: 'CASCADE' })
  application: LoanApplication;

  @Column()
  loanApplicationId: string;

  @ManyToOne(() => User, (user) => user.offersAuthored, { eager: true, nullable: true })
  admin?: User;

  @Column({ nullable: true })
  adminId?: string;

  @Index()
  @Column({ length: 64, default: 'BACKOFFICE' })
  lenderCode: string;

  @Column('float')
  offeredLoanAmount: number;

  @Column('float')
  apr: number;

  @Column('int')
  termMonths: number;

  @Column('float')
  monthlyPayment: number;

  @Column('float')
  totalInterest: number;

  @Column('float', { nullable: true })
  ltvAtOffer?: number;

  @Column({ type: 'text', default: OfferStatus.ISSUED })
  status: OfferStatus;

  @Column({ type: 'datetime', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
