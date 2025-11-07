import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleImage } from './entities/vehicle-image.entity';
import { LoanApplication } from '../loans/entities/loan-application.entity';
import { Offer } from '../offers/entities/offer.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { LoanPolicyService } from '../common/services/loan-policy.service';
import { VehicleImageService } from './services/vehicle-image.service';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repository: jest.Mocked<Repository<Vehicle>>;

  const mockVehicle = {
    id: '1',
    vin: '1HGCM82633A123456',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    mileage: 25000,
    ownerId: 'user-123',
    isLoanAvailable: true,
    listingPrice: 5000000,
    loanValue: 4750000,
    requiredDownPaymentPct: 0.40,
  };

  const mockLoansRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    }),
  };

  const mockOffersRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    }),
  };

  const mockLoanPolicyService = {
    getDefaultApr: jest.fn().mockReturnValue(0.25),
    getLtvCap: jest.fn().mockReturnValue(1.10),
    getMaxTermMonths: jest.fn().mockReturnValue(72),
  };

  const mockVehicleImageService = {
    addImages: jest.fn().mockResolvedValue([]),
    deleteImage: jest.fn().mockResolvedValue(undefined),
    deleteImagesByVehicleId: jest.fn().mockResolvedValue(undefined),
    setPrimaryImage: jest.fn().mockResolvedValue({}),
    getVehicleImages: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(VehicleImage),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LoanApplication),
          useValue: mockLoansRepository,
        },
        {
          provide: getRepositoryToken(Offer),
          useValue: mockOffersRepository,
        },
        {
          provide: LoanPolicyService,
          useValue: mockLoanPolicyService,
        },
        {
          provide: VehicleImageService,
          useValue: mockVehicleImageService,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    repository = module.get(getRepositoryToken(Vehicle));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new vehicle', async () => {
      const createVehicleDto: CreateVehicleDto = {
        vin: '1HGCM82633A123456',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        mileage: 25000,
      };
      const userId = 'user-123';

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockVehicle as any);
      repository.save.mockResolvedValue(mockVehicle as any);
      // Mock findOne again for the reload after creation
      repository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        ...mockVehicle,
        vehicleImages: [],
        images: [],
      } as any);

      const result = await service.create(createVehicleDto, userId);

      expect(result).toBeDefined();
      expect(repository.save).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith({
        ...createVehicleDto,
        ownerId: userId,
      });
    });

    it('should throw ConflictException if VIN already exists', async () => {
      const createVehicleDto: CreateVehicleDto = {
        vin: '1HGCM82633A123456',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        mileage: 25000,
      };
      const userId = 'user-123';

      repository.findOne.mockResolvedValue(mockVehicle as any);

      await expect(service.create(createVehicleDto, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by id', async () => {
      repository.findOne.mockResolvedValue(mockVehicle as any);

      const result = await service.findOne('1');

      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});
