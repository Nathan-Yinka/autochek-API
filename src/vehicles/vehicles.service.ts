import { Injectable, ConflictException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { LoanApplication, LoanApplicationStatus } from '../loans/entities/loan-application.entity';
import { Offer, OfferStatus } from '../offers/entities/offer.entity';
import { LoanPolicyService } from '../common/services/loan-policy.service';
import { VehicleImageService } from './services/vehicle-image.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
    @InjectRepository(LoanApplication)
    private loansRepository: Repository<LoanApplication>,
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    private loanPolicyService: LoanPolicyService,
    private vehicleImageService: VehicleImageService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a new vehicle with images
   */
  async create(
    createVehicleDto: CreateVehicleDto,
    userId: string,
    imageFiles?: Express.Multer.File[],
  ): Promise<any> {
    const existingVehicle = await this.vehiclesRepository.findOne({
      where: { vin: createVehicleDto.vin },
    });

    if (existingVehicle) {
      throw new ConflictException('Vehicle with this VIN already exists');
    }

    // Create vehicle
    const vehicle = this.vehiclesRepository.create({
      ...createVehicleDto,
      ownerId: userId,
    });

    const savedVehicle = await this.vehiclesRepository.save(vehicle);

    // Add images if provided
    if (imageFiles && imageFiles.length > 0) {
      const imageUrls = imageFiles.map((file) => `/uploads/vehicles/${file.filename}`);
      const filenames = imageFiles.map((file) => file.filename);
      await this.vehicleImageService.addImages(savedVehicle.id, imageUrls, filenames);

      // Set first image as primary
      const images = await this.vehicleImageService.getVehicleImages(savedVehicle.id);
      if (images.length > 0) {
        await this.vehicleImageService.setPrimaryImage(images[0].id, savedVehicle.id);
      }
    }

    // Reload vehicle with images
    const vehicleWithImages = await this.findOne(savedVehicle.id);
    return this.enhanceVehicleWithPaymentEstimate(vehicleWithImages);
  }

  /**
   * Find all vehicles with filters and pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: string;
      ownerId?: string;
      search?: string;
      make?: string;
      vehicleType?: string;
      region?: string;
      minYear?: number;
      maxYear?: number;
      minPrice?: number;
      maxPrice?: number;
      isLoanAvailable?: string;
    },
  ): Promise<{ data: any[]; total: number }> {
    const query = this.vehiclesRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.owner', 'owner')
      .leftJoinAndSelect('vehicle.vehicleImages', 'vehicleImages')
      .orderBy('vehicle.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Apply filters (status, owner, search, etc.)
    if (filters?.status) {
      if (filters.status.toLowerCase() === 'all') {
        // Show all statuses
      } else {
        const statuses = filters.status.split(',').map((s) => s.trim().toUpperCase());
        query.andWhere('vehicle.status IN (:...statuses)', { statuses });
      }
    } else {
      query.andWhere('vehicle.status IN (:...statuses)', {
        statuses: [VehicleStatus.LISTED, VehicleStatus.INSPECTED],
      });
    }

    if (filters?.ownerId) {
      query.andWhere('vehicle.ownerId = :ownerId', { ownerId: filters.ownerId });
    }

    if (filters?.search) {
      query.andWhere(
        '(LOWER(vehicle.make) LIKE LOWER(:search) OR LOWER(vehicle.model) LIKE LOWER(:search) OR LOWER(vehicle.vin) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.make) {
      query.andWhere('LOWER(vehicle.make) = LOWER(:make)', { make: filters.make });
    }

    if (filters?.vehicleType) {
      query.andWhere('vehicle.vehicleType = :vehicleType', { vehicleType: filters.vehicleType });
    }

    if (filters?.region) {
      query.andWhere('LOWER(vehicle.region) = LOWER(:region)', { region: filters.region });
    }

    if (filters?.minYear) {
      query.andWhere('vehicle.year >= :minYear', { minYear: filters.minYear });
    }

    if (filters?.maxYear) {
      query.andWhere('vehicle.year <= :maxYear', { maxYear: filters.maxYear });
    }

    if (filters?.minPrice) {
      query.andWhere('vehicle.listingPrice >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters?.maxPrice) {
      query.andWhere('vehicle.listingPrice <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters?.isLoanAvailable) {
      const loanAvailable = filters.isLoanAvailable.toLowerCase() === 'true';
      query.andWhere('vehicle.isLoanAvailable = :isLoanAvailable', { isLoanAvailable: loanAvailable });
    }

    const [vehicles, total] = await query.getManyAndCount();

    // Enhance each vehicle with payment estimates and formatted images
    const data = vehicles.map((vehicle) => this.enhanceVehicleWithPaymentEstimate(vehicle));

    return { data, total };
  }

  /**
   * Find one vehicle by ID
   */
  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { id },
      relations: ['owner', 'vehicleImages'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  /**
   * Find vehicle by VIN
   */
  async findByVin(vin: string): Promise<Vehicle | null> {
    return this.vehiclesRepository.findOne({
      where: { vin },
      relations: ['vehicleImages'],
    });
  }

  /**
   * Update vehicle (business logic moved from controller)
   */
  async updateVehicle(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
    newImageFiles?: Express.Multer.File[],
  ): Promise<any> {
    const vehicle = await this.findOne(id);
    await this.checkIfVehicleCanBeModified(id);

    // Update vehicle fields
    Object.assign(vehicle, updateVehicleDto);
    const updatedVehicle = await this.vehiclesRepository.save(vehicle);

    // Add new images if provided
    if (newImageFiles && newImageFiles.length > 0) {
      const imageUrls = newImageFiles.map((file) => `/uploads/vehicles/${file.filename}`);
      const filenames = newImageFiles.map((file) => file.filename);
      await this.vehicleImageService.addImages(updatedVehicle.id, imageUrls, filenames);
    }

    // Reload with images
    const vehicleWithImages = await this.findOne(id);
    return this.enhanceVehicleWithPaymentEstimate(vehicleWithImages);
  }

  /**
   * Delete vehicle (business logic moved from controller)
   */
  async deleteVehicle(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.checkIfVehicleCanBeModified(id);

    // Delete all images
    await this.vehicleImageService.deleteImagesByVehicleId(id);

    // Delete vehicle
    await this.vehiclesRepository.remove(vehicle);
  }

  /**
   * Add images to existing vehicle
   */
  async addImagesToVehicle(id: string, imageFiles: Express.Multer.File[]): Promise<any> {
    const vehicle = await this.findOne(id);
    await this.checkIfVehicleCanBeModified(id);

    const imageUrls = imageFiles.map((file) => `/uploads/vehicles/${file.filename}`);
    const filenames = imageFiles.map((file) => file.filename);

    await this.vehicleImageService.addImages(vehicle.id, imageUrls, filenames);

    const updatedVehicle = await this.findOne(id);
    return this.enhanceVehicleWithPaymentEstimate(updatedVehicle);
  }

  /**
   * Delete specific image from vehicle
   */
  async deleteImageFromVehicle(vehicleId: string, imageId: string): Promise<any> {
    await this.findOne(vehicleId); // Ensure vehicle exists
    await this.checkIfVehicleCanBeModified(vehicleId);

    await this.vehicleImageService.deleteImage(imageId, vehicleId);

    const updatedVehicle = await this.findOne(vehicleId);
    return this.enhanceVehicleWithPaymentEstimate(updatedVehicle);
  }

  /**
   * Set primary image
   */
  async setPrimaryImage(vehicleId: string, imageId: string): Promise<any> {
    await this.findOne(vehicleId);
    await this.vehicleImageService.setPrimaryImage(imageId, vehicleId);

    const updatedVehicle = await this.findOne(vehicleId);
    return this.enhanceVehicleWithPaymentEstimate(updatedVehicle);
  }

  /**
   * Reorder images
   */
  async reorderImages(vehicleId: string, imageIds: string[]): Promise<any> {
    await this.findOne(vehicleId);
    await this.vehicleImageService.reorderImages(vehicleId, imageIds);

    const updatedVehicle = await this.findOne(vehicleId);
    return this.enhanceVehicleWithPaymentEstimate(updatedVehicle);
  }

  /**
   * Check if vehicle can be modified
   */
  private async checkIfVehicleCanBeModified(vehicleId: string): Promise<void> {
    const activeLoansCount = await this.loansRepository
      .createQueryBuilder('loan')
      .where('loan.vehicleId = :vehicleId', { vehicleId })
      .andWhere('loan.status IN (:...statuses)', {
        statuses: [
          LoanApplicationStatus.SUBMITTED,
          LoanApplicationStatus.UNDER_REVIEW,
          LoanApplicationStatus.PENDING_OFFER,
        ],
      })
      .getCount();

    if (activeLoansCount > 0) {
      throw new BadRequestException('Cannot modify vehicle with active loan applications');
    }

    const activeOfferCount = await this.offersRepository
      .createQueryBuilder('offer')
      .innerJoin('offer.application', 'application')
      .where('application.vehicleId = :vehicleId', { vehicleId })
      .andWhere('offer.status IN (:...statuses)', {
        statuses: [OfferStatus.ISSUED, OfferStatus.ACCEPTED],
      })
      .getCount();

    if (activeOfferCount > 0) {
      throw new BadRequestException('Cannot modify vehicle with active offers');
    }
  }

  /**
   * Enhance vehicle data with payment estimates and formatted images
   */
  private enhanceVehicleWithPaymentEstimate(vehicle: Vehicle): any {
    const enhanced: any = {
      ...vehicle,
      images: vehicle.vehicleImages
        ? vehicle.vehicleImages
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((img) => {
              const port = this.configService.get<number>('PORT') || 3000;
              const baseUrl = `http://localhost:${port}`;
              return {
                id: img.id,
                url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`,
                isPrimary: img.isPrimary,
                displayOrder: img.displayOrder,
                caption: img.caption,
              };
            })
        : [],
    };

    // Remove the raw vehicleImages relation (we formatted it as images)
    delete enhanced.vehicleImages;

    // Calculate requiredDownPayment
    if (vehicle.listingPrice && vehicle.requiredDownPaymentPct) {
      enhanced.requiredDownPayment = Math.round(vehicle.listingPrice * vehicle.requiredDownPaymentPct);
    } else {
      enhanced.requiredDownPayment = null;
    }

    // Calculate payment estimate if loan is available
    if (
      vehicle.isLoanAvailable &&
      vehicle.listingPrice &&
      vehicle.loanValue &&
      vehicle.requiredDownPaymentPct
    ) {
      const defaultApr = this.loanPolicyService.getDefaultApr();
      const defaultTermMonths = vehicle.maxLoanPeriodMonths || this.loanPolicyService.getMaxTermMonths();

      const requiredDownPayment = vehicle.listingPrice * vehicle.requiredDownPaymentPct;
      const initialNeeded = vehicle.listingPrice - requiredDownPayment;
      const ltvCap = this.loanPolicyService.getLtvCap();
      const maxFinance = vehicle.loanValue * ltvCap;
      const financedAmount = Math.min(initialNeeded, maxFinance);

      const monthlyPayment = this.calculateMonthlyPayment(financedAmount, defaultApr, defaultTermMonths);

      enhanced.estimatedMonthlyPayment = {
        amount: Math.round(monthlyPayment),
        term: defaultTermMonths,
        downPayment: Math.round(requiredDownPayment),
        financedAmount: Math.round(financedAmount),
        apr: defaultApr,
        note: `Estimate at ${Math.round(defaultApr * 100)}% APR for ${defaultTermMonths} months`,
      };
    } else {
      enhanced.estimatedMonthlyPayment = null;
    }

    return enhanced;
  }

  /**
   * Calculate monthly payment
   */
  private calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
    const monthlyRate = annualRate / 12;

    if (monthlyRate === 0) {
      return principal / termMonths;
    }

    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    return monthlyPayment;
  }
}
