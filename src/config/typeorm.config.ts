import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'better-sqlite3',
  database: configService.get('DATABASE_PATH') || 'autochek.db',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false, // Disable auto-sync when using migrations
  logging: configService.get('NODE_ENV') === 'development',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;

