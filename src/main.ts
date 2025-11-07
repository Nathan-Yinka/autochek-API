import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService);

  app.use(helmet());
  app.enableCors();

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable ClassSerializerInterceptor globally to exclude sensitive fields (like password)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Autochek API')
    .setDescription('Vehicle valuation and financing services API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('vehicles', 'Vehicle data ingestion endpoints')
    .addTag('valuations', 'Vehicle valuation endpoints')
    .addTag('loans', 'Loan application endpoints')
    .addTag('offers', 'Loan offer endpoints')
    .addTag('notifications', 'Notification endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`API Base URL: http://localhost:${port}/api/v1`);
}

bootstrap();
