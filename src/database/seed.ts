import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Currency } from '../common/enums/currency.enum';
import { Vehicle, VehicleStatus, VehicleType, DriveType } from '../vehicles/entities/vehicle.entity';
import { VehicleImage } from '../vehicles/entities/vehicle-image.entity';
import { Valuation } from '../valuations/entities/valuation.entity';
import { LoanApplication, LoanApplicationStatus, EligibilityStatus } from '../loans/entities/loan-application.entity';
import { Offer, OfferStatus } from '../offers/entities/offer.entity';
import { Notification } from '../notifications/entities/notification.entity';

const logger = new Logger('SeedScript');

async function seed() {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: process.env.DATABASE_PATH || 'autochek.db',
    entities: [User, Vehicle, VehicleImage, Valuation, LoanApplication, Offer, Notification],
    synchronize: false, // Don't auto-sync, use migrations
  });

  await dataSource.initialize();
  logger.log('Database initialized');

  const userRepo = dataSource.getRepository(User);
  const vehicleRepo = dataSource.getRepository(Vehicle);
  const valuationRepo = dataSource.getRepository(Valuation);
  const loanRepo = dataSource.getRepository(LoanApplication);
  const offerRepo = dataSource.getRepository(Offer);
  const vehicleImageRepo = dataSource.getRepository(VehicleImage);

  logger.log('Seeding users...');
  
  // Check if users already exist
  let admin = await userRepo.findOne({ where: { email: 'admin@test.com' } });
  let user1 = await userRepo.findOne({ where: { email: 'tester@test.com' } });

  if (!admin || !user1) {
    const adminPassword = await bcrypt.hash('12345', 10);

    if (!admin) {
      admin = userRepo.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: adminPassword,
        phone: '+2348000000000',
        role: UserRole.ADMIN,
      });
      await userRepo.save(admin);
      logger.log('[OK] Admin user created');
    }

    if (!user1) {
      user1 = userRepo.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'tester@test.com',
        password: adminPassword,
        phone: '+2348012345678',
        role: UserRole.USER,
      });
      await userRepo.save(user1);
      logger.log('[OK] Test user created');
    }
  } else {
    logger.log('[SKIP] Users already exist, skipping...');
  }

  logger.log('Seeding vehicles...');
  
  // Check if vehicles already exist
  const vehicleCount = await vehicleRepo.count();
  let vehicle1, vehicle2, vehicle3;

  if (vehicleCount >= 3) {
    // Load existing vehicles
    const vehicles = await vehicleRepo.find({ take: 3, order: { createdAt: 'ASC' } });
    vehicle1 = vehicles[0];
    vehicle2 = vehicles[1];
    vehicle3 = vehicles[2];
    logger.log('[SKIP] Vehicles already exist, skipping...');
  } else if (vehicleCount === 0) {
    vehicle1 = vehicleRepo.create({
    vin: '5FRYD4H66GB592800',
    make: 'Toyota',
    model: 'Camry',
    trim: 'LE',
    year: 2020,
    mileage: 25000,
    vehicleType: VehicleType.FOREIGN_USED,
    exteriorColor: 'Blue',
    interiorColor: 'Black',
    engine: 'V6 3.5L',
    transmission: 'Automatic',
    driveType: DriveType.AUTOMATIC,
    fuelType: 'petrol',
    condition: 'Excellent condition',
    address: '45 Victoria Island, Lagos',
    ownerId: user1.id,
    listingPrice: 5500000,
    loanValue: 5200000,
    retailValue: 5500000,
    currency: Currency.NGN,
    requiredDownPaymentPct: 0.30,
    region: 'Lagos',
    status: VehicleStatus.LISTED,
    isLoanAvailable: true,
    minLoanValue: 500000,
    maxLoanPeriodMonths: 60,
  });

  vehicle2 = vehicleRepo.create({
    vin: '1HGCV1F30JA012345',
    make: 'Honda',
    model: 'Accord',
    trim: 'Sport',
    year: 2019,
    mileage: 35000,
    vehicleType: VehicleType.FOREIGN_USED,
    exteriorColor: 'Silver',
    interiorColor: 'Gray',
    engine: '4-cylinder 2.0L',
    transmission: 'Automatic',
    driveType: DriveType.AUTOMATIC,
    fuelType: 'petrol',
    condition: 'Very good condition',
    address: '12 Central Area, Abuja',
    ownerId: admin.id,
    listingPrice: 4800000,
    loanValue: 4500000,
    retailValue: 4800000,
    currency: Currency.NGN,
    requiredDownPaymentPct: 0.40,
    region: 'Abuja',
    status: VehicleStatus.LISTED,
    isLoanAvailable: true,
    minLoanValue: 500000,
    maxLoanPeriodMonths: 48,
  });

  vehicle3 = vehicleRepo.create({
    vin: '1FM5K8D82LGB12345',
    make: 'Ford',
    model: 'Explorer',
    trim: 'XLT',
    year: 2021,
    mileage: 15000,
    vehicleType: VehicleType.BRAND_NEW,
    exteriorColor: 'Black',
    interiorColor: 'Beige',
    engine: 'V6 3.0L EcoBoost',
    transmission: 'Automatic',
    driveType: DriveType.AUTOMATIC,
    fuelType: 'petrol',
    condition: 'Like new',
    address: '89 Lekki Phase 1, Lagos',
    ownerId: user1.id,
    listingPrice: 7200000,
    loanValue: 6800000,
    retailValue: 7200000,
    currency: Currency.NGN,
    requiredDownPaymentPct: 0.35,
    region: 'Lagos',
    status: VehicleStatus.INSPECTED,
    isLoanAvailable: true,
    minLoanValue: 1000000,
    maxLoanPeriodMonths: 72,
  });

    const savedVehicles = await vehicleRepo.save([vehicle1, vehicle2, vehicle3]);
    vehicle1 = savedVehicles[0];
    vehicle2 = savedVehicles[1];
    vehicle3 = savedVehicles[2];
    logger.log('[OK] Vehicles seeded');
  } else {
    logger.log('[WARN] Found ' + vehicleCount + ' vehicles, expected 0 or 3+. Skipping...');
    const vehicles = await vehicleRepo.find({ take: 3, order: { createdAt: 'ASC' } });
    vehicle1 = vehicles[0] || null;
    vehicle2 = vehicles[1] || null;
    vehicle3 = vehicles[2] || null;
  }

  // Seed vehicle images
  logger.log('Seeding vehicle images...');
  
  const imageCount = await vehicleImageRepo.count();
  
  if (imageCount === 0) {
    const allImages = [
    ...['toyota-camry-1.jpg', 'toyota-camry-2.jpg', 'toyota-camry-3.jpg'].map((name, idx) => ({
      vehicleId: vehicle1.id,
      url: `/uploads/vehicles/${name}`,
      filename: name,
      displayOrder: idx,
      isPrimary: idx === 0,
    })),
    ...['honda-accord-1.jpg', 'honda-accord-2.jpg'].map((name, idx) => ({
      vehicleId: vehicle2.id,
      url: `/uploads/vehicles/${name}`,
      filename: name,
      displayOrder: idx,
      isPrimary: idx === 0,
    })),
    ...['ford-explorer-1.jpg', 'ford-explorer-2.jpg', 'ford-explorer-3.jpg'].map((name, idx) => ({
      vehicleId: vehicle3.id,
      url: `/uploads/vehicles/${name}`,
      filename: name,
      displayOrder: idx,
      isPrimary: idx === 0,
    })),
  ];

    await vehicleImageRepo.save(allImages.map(img => vehicleImageRepo.create(img)));
    logger.log('[OK] Vehicle images seeded');
  } else {
    logger.log('[SKIP] Vehicle images already exist, skipping...');
  }

  logger.log('Seeding valuations...');
  
  const valuationCount = await valuationRepo.count();
  
  if (valuationCount === 0) {
    const valuation1 = valuationRepo.create({
    vehicleId: vehicle1.id,
    retailValue: 5500000,
    loanValue: 5200000,
    source: 'simulated-rapidapi',
    fetchedAt: new Date(),
    providerRef: 'sim-001',
  });

  const valuation2 = valuationRepo.create({
    vehicleId: vehicle2.id,
    retailValue: 4800000,
    loanValue: 4500000,
    source: 'simulated-rapidapi',
    fetchedAt: new Date(),
    providerRef: 'sim-002',
  });

  const valuation3 = valuationRepo.create({
    vehicleId: vehicle3.id,
    retailValue: 7200000,
    loanValue: 6800000,
    source: 'simulated-rapidapi',
    fetchedAt: new Date(),
    providerRef: 'sim-003',
  });

    await valuationRepo.save([valuation1, valuation2, valuation3]);
    logger.log('[OK] Valuations seeded');
  } else {
    logger.log('[SKIP] Valuations already exist, skipping...');
  }

  logger.log('Seeding loan applications...');
  
  const loanCount = await loanRepo.count();
  
  if (loanCount === 0) {
    const loan1 = loanRepo.create({
    userId: user1.id,
    vehicleId: vehicle1.id,
    applicantName: 'Test User',
    applicantEmail: 'tester@test.com',
    applicantPhone: '+2348012345678',
    bvn: '12345678901',
    nin: '12345678901234',
    dateOfBirth: '1990-01-15',
    residentialAddress: '123 Main Street, Lagos, Nigeria',
    listingPrice: 5500000,
    snapshotRetailValue: 5500000,
    snapshotLoanValue: 5200000,
    valuationFetchedAt: new Date(),
    requestedLoanAmount: 4500000,
    requestedDownPaymentPct: 0.15,
    requestedDownPaymentAmount: 825000,
    requestedTermMonths: 48,
    requestedApr: 0.18,
    ltvCap: 1.10,
    plannedDownAmount: 825000,
    maxFinance: 5720000,
    validatedLoanAmount: 4500000,
    requiredExtraDown: 0,
    eligibilityStatus: EligibilityStatus.ELIGIBLE,
    eligibilityReasons: JSON.stringify(['Meets all eligibility criteria']),
    status: LoanApplicationStatus.APPROVED,
  });

  const loan2 = loanRepo.create({
    userId: user1.id,
    vehicleId: vehicle2.id,
    applicantName: 'Test User',
    applicantEmail: 'tester@test.com',
    applicantPhone: '+2348098765432',
    bvn: '98765432109',
    nin: '98765432109876',
    dateOfBirth: '1985-05-20',
    residentialAddress: '456 Oak Avenue, Abuja, Nigeria',
    listingPrice: 4800000,
    snapshotRetailValue: 4800000,
    snapshotLoanValue: 4500000,
    valuationFetchedAt: new Date(),
    requestedLoanAmount: 3800000,
    requestedDownPaymentPct: 0.20,
    requestedDownPaymentAmount: 960000,
    requestedTermMonths: 36,
    requestedApr: 0.16,
    ltvCap: 1.10,
    plannedDownAmount: 960000,
    maxFinance: 4950000,
    validatedLoanAmount: 3800000,
    requiredExtraDown: 0,
    eligibilityStatus: EligibilityStatus.ELIGIBLE,
    eligibilityReasons: JSON.stringify(['Meets all eligibility criteria']),
    status: LoanApplicationStatus.PENDING_OFFER,
  });

    await loanRepo.save([loan1, loan2]);
    logger.log('[OK] Loan applications seeded');

    logger.log('Seeding offers...');
    
    const offerCount = await offerRepo.count();
    
    if (offerCount === 0) {
      const offer1 = offerRepo.create({
    loanApplicationId: loan1.id,
    adminId: admin.id,
    lenderCode: 'BACKOFFICE',
    offeredLoanAmount: 4500000,
    apr: 0.18,
    termMonths: 48,
    monthlyPayment: 123456,
    totalInterest: 1425888,
    ltvAtOffer: 0.865,
    status: OfferStatus.ISSUED,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    notes: 'Standard offer for approved application',
  });

      await offerRepo.save([offer1]);
      logger.log('[OK] Offers seeded');
    } else {
      logger.log('[SKIP] Offers already exist, skipping...');
    }
  } else {
    logger.log('[SKIP] Loan applications already exist, skipping...');
  }

  logger.log('\nSeeding completed successfully!\n');
  logger.log('Sample credentials:');
  logger.log('\nAdmin:');
  logger.log('  Email: admin@test.com');
  logger.log('  Password: 12345');
  logger.log('  Role: ADMIN');
  logger.log('\nUser:');
  logger.log('  Email: tester@test.com');
  logger.log('  Password: 12345');
  logger.log('  Role: USER');

  await dataSource.destroy();
}

seed()
  .then(() => {
    logger.log('Seed data created successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Error seeding data', error.stack || error.message || error);
    process.exit(1);
  });
