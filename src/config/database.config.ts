import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleImage } from '../vehicles/entities/vehicle-image.entity';
import { Valuation } from '../valuations/entities/valuation.entity';
import { LoanApplication } from '../loans/entities/loan-application.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Notification } from '../notifications/entities/notification.entity';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'better-sqlite3',
  database: configService.get('DATABASE_PATH') || 'autochek.db',
  entities: [User, Vehicle, VehicleImage, Valuation, LoanApplication, Offer, Notification],
  synchronize: false, // Use migrations instead
  logging: configService.get('NODE_ENV') === 'development',
  migrations: ['dist/database/migrations/*.js'],
  // migrationsRun: true, // Auto-run migrations on startup
});

// Keep backward compatibility
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'better-sqlite3',
  database: 'autochek.db',
  entities: [User, Vehicle, VehicleImage, Valuation, LoanApplication, Offer, Notification],
  synchronize: false,
  logging: false,
  migrations: ['dist/database/migrations/*.js'],
  migrationsRun: true,
};

