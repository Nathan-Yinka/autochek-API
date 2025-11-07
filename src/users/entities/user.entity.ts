import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { LoanApplication } from '../../loans/entities/loan-application.entity';
import { Offer } from '../../offers/entities/offer.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  firstName: string;

  @Column({ length: 120 })
  lastName: string;

  @Index({ unique: true })
  @Column({ length: 120 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ length: 32, nullable: true })
  phone?: string;

  @Column({ type: 'text', default: UserRole.USER })
  role: UserRole;

  @OneToMany(() => LoanApplication, (app) => app.user)
  loanApplications: LoanApplication[];

  @OneToMany(() => Offer, (o) => o.admin)
  offersAuthored: Offer[];

  @Exclude()
  @CreateDateColumn()
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt: Date;
}
