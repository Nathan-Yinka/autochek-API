import { DataSource } from 'typeorm';
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

async function seed() {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [User, Vehicle, VehicleImage, Valuation, LoanApplication, Offer, Notification],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('🗄️  Database initialized');

  const userRepo = dataSource.getRepository(User);
  const vehicleRepo = dataSource.getRepository(Vehicle);
  const valuationRepo = dataSource.getRepository(Valuation);
  const loanRepo = dataSource.getRepository(LoanApplication);
  const offerRepo = dataSource.getRepository(Offer);

  console.log('👤 Seeding users...');
  const adminPassword = await bcrypt.hash('12345', 10);
  const userPassword = await bcrypt.hash('password123', 10);

  const admin = userRepo.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: adminPassword,
    phone: '+2348000000000',
    role: UserRole.ADMIN,
  });

  const user1 = userRepo.create({
    firstName: 'Test',
    lastName: 'User',
    email: 'tester@test.com',
    password: adminPassword,
    phone: '+2348012345678',
    role: UserRole.USER,
  });

  await userRepo.save([admin, user1]);
  console.log('✅ Users seeded');

  console.log('🚗 Seeding vehicles...');
  const vehicle1 = vehicleRepo.create({
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
    currency: Currency.NGN,
    requiredDownPaymentPct: 0.30,
    region: 'Lagos',
    status: VehicleStatus.LISTED,
    isLoanAvailable: true,
    minLoanValue: 500000,
    maxLoanPeriodMonths: 60,
  });

  const vehicle2 = vehicleRepo.create({
    vin: '5FRYD4H66GB592800',
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
    currency: Currency.NGN,
    requiredDownPaymentPct: 0.40,
    region: 'Abuja',
    status: VehicleStatus.LISTED,
    isLoanAvailable: true,
    minLoanValue: 500000,
    maxLoanPeriodMonths: 48,
  });

  const vehicle3 = vehicleRepo.create({
    vin: '5FRYD4H66GB592800',
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
    currency: Currency.NGN,
    requiredDownPaymentPct: 0.35,
    region: 'Lagos',
    status: VehicleStatus.INSPECTED,
    isLoanAvailable: true,
    minLoanValue: 1000000,
    maxLoanPeriodMonths: 72,
  });

  await vehicleRepo.save([vehicle1, vehicle2, vehicle3]);
  console.log('✅ Vehicles seeded');

  // Seed vehicle images
  console.log('📸 Seeding vehicle images...');
  const vehicleImageRepo = dataSource.getRepository(VehicleImage);

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
  console.log('✅ Vehicle images seeded');

  console.log('💰 Seeding valuations...');
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
  console.log('✅ Valuations seeded');

  console.log('📋 Seeding loan applications...');
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
  console.log('✅ Loan applications seeded');

  console.log('🎁 Seeding offers...');
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
  console.log('✅ Offers seeded');

  console.log('\n✨ Seeding completed successfully!\n');
  console.log('Sample credentials:');
  console.log('\n🔑 Admin:');
  console.log('  Email: admin@test.com');
  console.log('  Password: 12345');
  console.log('  Role: ADMIN');
  console.log('\n👤 User:');
  console.log('  Email: tester@test.com');
  console.log('  Password: 12345');
  console.log('  Role: USER');

  await dataSource.destroy();
}

seed()
  .then(() => {
    console.log('Seed data created successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding data:', error);
    process.exit(1);
  });
