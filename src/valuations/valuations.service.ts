import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Valuation } from './entities/valuation.entity';
import { CreateValuationDto } from './dto/create-valuation.dto';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { RapidAPIService, ValuationResult } from './services/rapidapi.service';
import { ValuationCalculatorService } from './services/valuation-calculator.service';

@Injectable()
export class ValuationsService {
  private readonly logger = new Logger(ValuationsService.name);

  constructor(
    @InjectRepository(Valuation)
    private valuationsRepository: Repository<Valuation>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    private rapidAPIService: RapidAPIService,
    private calculatorService: ValuationCalculatorService,
  ) {}

  /**
   * Create a new valuation for a vehicle
   * Attempts to use external API first, falls back to internal calculation
   */
  async create(createValuationDto: CreateValuationDto): Promise<Valuation> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { vin: createValuationDto.vin },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found. Please ingest vehicle data first.');
    }

    this.logger.log(`Creating valuation for vehicle: ${vehicle.vin}`);

    // Fetch valuation (tries external API first, then falls back to calculation)
    const valuationData = await this.fetchValuation(createValuationDto.vin, vehicle);

    // Save valuation to history table
    const valuation = this.valuationsRepository.create({
      vehicleId: vehicle.id,
      retailValue: valuationData.retailValue,
      loanValue: valuationData.loanValue,
      source: valuationData.source,
      fetchedAt: new Date(),
      providerRef: valuationData.providerRef,
    });

    const saved = await this.valuationsRepository.save(valuation);

    // Update vehicle with latest valuation snapshot
    vehicle.retailValue = valuationData.retailValue;
    vehicle.loanValue = valuationData.loanValue;
    vehicle.valuationSource = valuationData.source;
    vehicle.valuationFetchedAt = new Date();
    await this.vehicleRepository.save(vehicle);

    this.logger.log(`Valuation created successfully for vehicle: ${vehicle.vin} (Source: ${valuationData.source})`);

    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * Fetch valuation using two-tier approach:
   * 1. Try external RapidAPI first (real market data)
   * 2. Fall back to internal calculation if API fails
   */
  private async fetchValuation(vin: string, vehicle: Vehicle): Promise<ValuationResult> {
    // TIER 1: Try RapidAPI first
    this.logger.debug(`Attempting to fetch valuation from RapidAPI for VIN: ${vin}`);
    const apiResult = await this.rapidAPIService.fetchValuation(vin);

    if (apiResult) {
      this.logger.log(`Successfully retrieved valuation from RapidAPI for VIN: ${vin}`);
      return apiResult;
    }

    // TIER 2: Fall back to internal calculation
    this.logger.warn(`RapidAPI unavailable for VIN: ${vin}, using internal calculation`);
    return this.calculatorService.calculateValuation(vehicle);
  }

  async findAll(): Promise<Valuation[]> {
    return this.valuationsRepository.find({
      relations: ['vehicle'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Valuation> {
    const valuation = await this.valuationsRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });

    if (!valuation) {
      throw new NotFoundException('Valuation not found');
    }

    return valuation;
  }

  /**
   * Delete a specific valuation by ID
   */
  async deleteOne(id: string): Promise<{ message: string }> {
    const valuation = await this.valuationsRepository.findOne({
      where: { id },
    });

    if (!valuation) {
      throw new NotFoundException('Valuation not found');
    }

    await this.valuationsRepository.remove(valuation);

    this.logger.log(`Deleted valuation ${id}`);

    return {
      message: `Successfully deleted valuation ${id}`,
    };
  }

  async getLatestValuationForVin(vin: string): Promise<number> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { vin },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.getLatestValuationForVehicleId(vehicle.id);
  }

  async getLatestValuationForVehicleId(vehicleId: string): Promise<number> {
    const latestValuation = await this.valuationsRepository.findOne({
      where: { vehicleId },
      order: { createdAt: 'DESC' },
    });

    if (!latestValuation) {
      throw new NotFoundException('No valuation found for this vehicle. Please request a valuation first.');
    }

    return latestValuation.loanValue;
  }

  /**
   * Get valuation history for a specific VIN
   */
  async findByVin(vin: string): Promise<Valuation[]> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { vin },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found with this VIN');
    }

    const valuations = await this.valuationsRepository.find({
      where: { vehicleId: vehicle.id },
      order: { fetchedAt: 'DESC' },
    });

    if (valuations.length === 0) {
      throw new NotFoundException('No valuations found for this VIN');
    }

    return valuations;
  }

  /**
   * Delete all valuations for a specific VIN
   * Note: Does NOT clear vehicle snapshot (admin must manually update vehicle if needed)
   */
  async deleteByVin(vin: string): Promise<{ message: string; count: number }> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { vin },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found with this VIN');
    }

    const valuations = await this.valuationsRepository.find({
      where: { vehicleId: vehicle.id },
    });

    if (valuations.length === 0) {
      throw new NotFoundException('No valuations found for this VIN');
    }

    const count = valuations.length;
    await this.valuationsRepository.remove(valuations);

    this.logger.log(`Deleted ${count} valuations for VIN: ${vin}`);

    return {
      message: `Successfully deleted ${count} valuation(s) for VIN ${vin}. Note: Vehicle snapshot not cleared.`,
      count,
    };
  }
}
