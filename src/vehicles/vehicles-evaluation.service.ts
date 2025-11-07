import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RapidAPIService } from '../valuations/services/rapidapi.service';
import { MileageAdjustmentService } from '../valuations/services/mileage-adjustment.service';
import { LoanPolicyService } from '../common/services/loan-policy.service';
import { EvaluateVehicleDto } from './dto/evaluate-vehicle.dto';
import { Valuation } from '../valuations/entities/valuation.entity';
import { Vehicle } from './entities/vehicle.entity';

export interface VehicleEvaluationResult {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  engine?: string;
  transmission?: string;
  fuelType?: string;
  suggestedRetailValue: number;
  suggestedLoanValue: number;
  suggestedListingPrice: number;
  baselineRetailValue: number;
  baselineLoanValue: number;
  mileageAdjustment: {
    deltaMiles: number;
    adjLoan: number;
    adjRetail: number;
    explanation: string;
  };
  suggestedDownPaymentPct: number;
  suggestedMinLoanValue: number;
  suggestedMaxLoanPeriod: number;
  source: string;
}

/**
 * Service for evaluating vehicles during listing
 * Calls VIN API, applies mileage adjustments, and SAVES to database
 */
@Injectable()
export class VehiclesEvaluationService {
  private readonly logger = new Logger(VehiclesEvaluationService.name);

  constructor(
    @InjectRepository(Valuation)
    private valuationRepository: Repository<Valuation>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    private rapidAPIService: RapidAPIService,
    private mileageAdjustmentService: MileageAdjustmentService,
    private loanPolicyService: LoanPolicyService,
  ) {}

  /**
   * Evaluate a vehicle by VIN and mileage
   * SAVES to database and returns suggested values
   */
  async evaluateVehicle(dto: EvaluateVehicleDto): Promise<VehicleEvaluationResult> {
    this.logger.log(`Evaluating vehicle: VIN=${dto.vin}, Mileage=${dto.mileage || 'unknown'}`);

    // 1. Try to fetch from VIN API
    const apiResult = await this.rapidAPIService.fetchValuation(dto.vin);

    if (!apiResult) {
      throw new NotFoundException(
        `Could not fetch valuation data for VIN: ${dto.vin} from external API. Please try manual entry.`,
      );
    }

    // 2. Apply mileage adjustment
    const adjustmentResult = this.mileageAdjustmentService.applyMileageAdjustment(
      apiResult.loanValue,
      apiResult.retailValue,
      dto.mileage,
      apiResult.year || new Date().getFullYear(),
    );

    // 3. Check if vehicle already exists
    const existingVehicle = await this.vehicleRepository.findOne({
      where: { vin: dto.vin },
    });

    // 4. Save valuation to history table (only if vehicle exists)
    // DO NOT update vehicle snapshot - just save to history
    if (existingVehicle) {
      const valuation = this.valuationRepository.create({
        vehicleId: existingVehicle.id,
        retailValue: adjustmentResult.adjustedRetailValue,
        loanValue: adjustmentResult.adjustedLoanValue,
        source: apiResult.source,
        fetchedAt: new Date(),
        providerRef: apiResult.providerRef,
      });

      await this.valuationRepository.save(valuation);

      this.logger.log(`Valuation saved to history for VIN: ${dto.vin} (vehicle snapshot NOT updated)`);
    } else {
      this.logger.log(`Valuation evaluated for VIN: ${dto.vin} (vehicle not yet created, valuation not saved)`);
    }

    // 5. Return results with all details
    return this.buildEvaluationResult(apiResult, adjustmentResult, dto.vin);
  }

  /**
   * Build evaluation result with all details
   */
  private buildEvaluationResult(
    apiResult: any,
    adjustmentResult: any,
    vin: string,
  ): VehicleEvaluationResult {
    const suggestedDownPaymentPct = 0.40;
    const suggestedMinLoanValue = 500000;
    const suggestedMaxLoanPeriod = this.loanPolicyService.getMaxTermMonths();

    return {
      // Basic vehicle details from API
      vin,
      make: apiResult.make,
      model: apiResult.model,
      year: apiResult.year,
      trim: apiResult.trim,
      engine: apiResult.engine,
      transmission: apiResult.transmission,
      fuelType: apiResult.fuelType,

      // Baseline values from API (before local adjustment)
      baselineRetailValue: apiResult.retailValue,
      baselineLoanValue: apiResult.loanValue,

      // Adjusted values (with local mileage adjustment)
      suggestedRetailValue: adjustmentResult.adjustedRetailValue,
      suggestedLoanValue: adjustmentResult.adjustedLoanValue,
      suggestedListingPrice: adjustmentResult.adjustedRetailValue,

      // Mileage adjustment details
      mileageAdjustment: {
        deltaMiles: adjustmentResult.deltaMiles,
        adjLoan: adjustmentResult.adjLoan,
        adjRetail: adjustmentResult.adjRetail,
        explanation: adjustmentResult.explanation,
      },

      // Suggested loan defaults
      suggestedDownPaymentPct,
      suggestedMinLoanValue,
      suggestedMaxLoanPeriod,

      source: apiResult.source,
    };
  }
}
