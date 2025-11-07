import { Injectable } from '@nestjs/common';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { ValuationResult } from './rapidapi.service';

/**
 * Service for calculating vehicle valuations using internal logic
 * Used as fallback when external API is unavailable
 * 
 * Factors considered:
 * 1. Brand-based depreciation rates (12-18%)
 * 2. Age adjustment (diminishing returns for older vehicles)
 * 3. Mileage adjustment (compared to expected 15,000 km/year)
 * 4. Condition adjustment (excellent to poor)
 */
@Injectable()
export class ValuationCalculatorService {
  /**
   * Calculate vehicle valuation using internal algorithms
   * This is a fallback method when external API is unavailable
   */
  calculateValuation(vehicle: Vehicle): ValuationResult {
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicle.year;

    // Get base price by make/model
    const basePrice = this.getBasePrice(vehicle.make);

    // Calculate dynamic depreciation rate
    const depreciationRate = this.calculateDepreciationRate(vehicle, vehicleAge);
    
    // Apply depreciation over the years
    const depreciatedValue = basePrice * Math.pow(1 - depreciationRate, vehicleAge);

    // Apply mileage adjustment
    const mileageAdjustment = this.calculateMileageAdjustment(vehicle.mileage, vehicleAge);

    // Apply condition adjustment
    const conditionAdjustment = this.calculateConditionAdjustment(vehicle.condition);

    // Calculate final retail value
    const retailValue = Math.round(depreciatedValue * mileageAdjustment * conditionAdjustment);

    // Loan value is typically 95% of retail value
    const loanValue = Math.round(retailValue * 0.95);

    // Ensure minimum value
    const finalRetailValue = Math.max(retailValue, 500000); // Minimum 500K NGN
    const finalLoanValue = Math.max(loanValue, 475000); // Minimum 475K NGN

    return {
      retailValue: finalRetailValue,
      loanValue: finalLoanValue,
      source: 'simulated-depreciation-model-v2',
      providerRef: `sim-${Date.now()}`,
    };
  }

  /**
   * Get base price based on vehicle make
   * This is a simplified lookup and could be replaced with a database table
   */
  private getBasePrice(make: string): number {
    const makeLower = make.toLowerCase();
    
    // Premium/Luxury brands
    if (makeLower.includes('mercedes') || makeLower.includes('range rover')) {
      return 30000000; // 30M NGN
    }
    if (makeLower.includes('bmw') || makeLower.includes('audi') || makeLower.includes('lexus')) {
      return 25000000; // 25M NGN
    }
    
    // Mid-range brands
    if (makeLower.includes('ford') || makeLower.includes('chevrolet')) {
      return 18000000; // 18M NGN
    }
    if (makeLower.includes('toyota')) {
      return 15000000; // 15M NGN
    }
    if (makeLower.includes('honda') || makeLower.includes('nissan')) {
      return 12000000; // 12M NGN
    }
    if (makeLower.includes('hyundai') || makeLower.includes('kia')) {
      return 10000000; // 10M NGN
    }
    
    // Default for unknown brands
    return 20000000; // 20M NGN
  }

  /**
   * Calculate dynamic depreciation rate based on vehicle brand and age
   * 
   * Brand-based rates:
   * - Japanese brands (Toyota, Honda): 12% (reliable, hold value)
   * - Korean brands (Hyundai, Kia): 14%
   * - American brands (Ford, Chevrolet): 16%
   * - Luxury brands (BMW, Mercedes, Audi): 18% (depreciate faster)
   * - Default: 15%
   * 
   * Age adjustment (diminishing returns):
   * - Years 0-5: Full depreciation rate
   * - Years 6-10: 80% of rate (slower depreciation)
   * - Years 11+: 60% of rate (minimal depreciation)
   */
  private calculateDepreciationRate(vehicle: Vehicle, vehicleAge: number): number {
    const make = vehicle.make.toLowerCase();
    
    // Base depreciation by brand
    let baseRate = 0.15; // 15% default
    
    // Japanese brands (known for reliability)
    if (make.includes('toyota') || make.includes('honda') || make.includes('nissan') || make.includes('mazda')) {
      baseRate = 0.12; // 12% - hold value well
    }
    // Korean brands
    else if (make.includes('hyundai') || make.includes('kia')) {
      baseRate = 0.14; // 14%
    }
    // American brands
    else if (make.includes('ford') || make.includes('chevrolet') || make.includes('dodge')) {
      baseRate = 0.16; // 16%
    }
    // Luxury brands
    else if (make.includes('bmw') || make.includes('mercedes') || make.includes('audi') || 
             make.includes('lexus') || make.includes('range rover')) {
      baseRate = 0.18; // 18% - depreciate faster
    }

    // Age adjustment (older cars depreciate slower due to diminishing returns)
    if (vehicleAge > 10) {
      baseRate = baseRate * 0.6; // 40% reduction for very old cars
    } else if (vehicleAge > 5) {
      baseRate = baseRate * 0.8; // 20% reduction for older cars
    }

    return baseRate;
  }

  /**
   * Calculate mileage adjustment factor
   * 
   * Average expected mileage: 15,000 km/year
   * 
   * Adjustments:
   * - < 80% of expected: +5% value (low mileage bonus)
   * - 80-120% of expected: 0% (normal wear)
   * - 120-150% of expected: -10% value (high mileage)
   * - 150-200% of expected: -20% value (very high mileage)
   * - > 200% of expected: -30% value (extremely high mileage)
   */
  private calculateMileageAdjustment(mileage: number | undefined, vehicleAge: number): number {
    if (!mileage || vehicleAge === 0) return 1; // No adjustment if mileage unknown or new car

    const averageMileagePerYear = 15000; // km per year
    const expectedMileage = averageMileagePerYear * vehicleAge;
    const mileageRatio = mileage / expectedMileage;

    if (mileageRatio < 0.8) {
      return 1.05; // +5% for low mileage
    } else if (mileageRatio <= 1.2) {
      return 1.0; // Normal mileage
    } else if (mileageRatio <= 1.5) {
      return 0.90; // -10% for high mileage
    } else if (mileageRatio <= 2.0) {
      return 0.80; // -20% for very high mileage
    } else {
      return 0.70; // -30% for extremely high mileage
    }
  }

  /**
   * Calculate condition adjustment factor
   * 
   * Adjustments based on condition description:
   * - Excellent/New/Mint: +10%
   * - Very Good/Great: +5%
   * - Good: 0% (baseline)
   * - Fair/Average: -10%
   * - Poor/Bad: -25%
   * - Salvage/Damaged: -50%
   */
  private calculateConditionAdjustment(condition: string | undefined): number {
    if (!condition) return 1; // No adjustment if condition unknown

    const conditionLower = condition.toLowerCase();

    // Excellent condition
    if (conditionLower.includes('excellent') || conditionLower.includes('new') || conditionLower.includes('mint')) {
      return 1.10; // +10%
    }
    // Very good condition
    else if (conditionLower.includes('very good') || conditionLower.includes('great')) {
      return 1.05; // +5%
    }
    // Good condition (baseline)
    else if (conditionLower.includes('good')) {
      return 1.0; // No adjustment
    }
    // Fair condition
    else if (conditionLower.includes('fair') || conditionLower.includes('average')) {
      return 0.90; // -10%
    }
    // Poor condition
    else if (conditionLower.includes('poor') || conditionLower.includes('bad')) {
      return 0.75; // -25%
    }
    // Salvage or damaged
    else if (conditionLower.includes('salvage') || conditionLower.includes('damaged')) {
      return 0.50; // -50%
    }

    return 1; // Default: no adjustment
  }
}

