import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleImage } from '../vehicles/entities/vehicle-image.entity';
import { Valuation } from '../valuations/entities/valuation.entity';
import { LoanApplication } from '../loans/entities/loan-application.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Notification } from '../notifications/entities/notification.entity';

export default new DataSource({
  type: 'better-sqlite3',
  database: process.env.DATABASE_PATH || 'autochek.db',
  entities: [User, Vehicle, VehicleImage, Valuation, LoanApplication, Offer, Notification],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
