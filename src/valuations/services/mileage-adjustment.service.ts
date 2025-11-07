import { Injectable } from '@nestjs/common';
import { LoanPolicyService } from '../../common/services/loan-policy.service';

export interface MileageAdjustmentResult {
  adjustedLoanValue: number;
  adjustedRetailValue: number;
  deltaMiles: number;
  adjLoan: number;
  adjRetail: number;
}

/**
 * Service for calculating mileage-based adjustments to vehicle valuations
 * 
 * Formula:
 * 1. Calculate expected mileage based on vehicle age
 * 2. Find delta between actual and expected
 * 3. Apply adjustment per 1k miles
 * 4. Cap adjustment at ±20% of baseline value
 * 5. Return adjusted values
 */
@Injectable()
export class MileageAdjustmentService {
  constructor(private loanPolicyService: LoanPolicyService) {}

  /**
   * Apply mileage adjustment to baseline valuations
   * 
   * @param baselineLoanValue - From VIN API (assumes average mileage)
   * @param baselineRetailValue - From VIN API (assumes average mileage)
   * @param actualMileage - Actual vehicle mileage
   * @param year - Vehicle year
   * @returns Adjusted values with adjustment details
   */
  applyMileageAdjustment(
    baselineLoanValue: number,
    baselineRetailValue: number,
    actualMileage: number | undefined,
    year: number,
  ): MileageAdjustmentResult {
    // If no mileage provided, return baseline values (no adjustment)
    if (!actualMileage) {
      return {
        adjustedLoanValue: baselineLoanValue,
        adjustedRetailValue: baselineRetailValue,
        deltaMiles: 0,
        adjLoan: 0,
        adjRetail: 0,
      };
    }

    const currentYear = new Date().getFullYear();
    const vehicleAgeYears = Math.max(0, currentYear - year);

    // Get policy configuration
    const expectedMilesPerYear = this.loanPolicyService.getExpectedMilesPerYear();
    const loanAdjPer1k = this.loanPolicyService.getLoanAdjPer1k();
    const retailAdjPer1k = this.loanPolicyService.getRetailAdjPer1k();
    const mileageAdjCapPct = this.loanPolicyService.getMileageAdjCapPct();

    // Calculate expected mileage
    const expectedMileage = vehicleAgeYears * expectedMilesPerYear;

    // Calculate delta
    const deltaMiles = actualMileage - expectedMileage;

    // Calculate raw adjustments
    // Negative sign: higher mileage = negative adjustment (lower value)
    const adjLoanRaw = -(deltaMiles / 1000) * loanAdjPer1k;
    const adjRetailRaw = -(deltaMiles / 1000) * retailAdjPer1k;

    // Calculate caps (±20% of baseline)
    const capLoan = mileageAdjCapPct * baselineLoanValue;
    const capRetail = mileageAdjCapPct * baselineRetailValue;

    // Apply caps (clamp adjustment)
    const adjLoan = this.clamp(adjLoanRaw, -capLoan, capLoan);
    const adjRetail = this.clamp(adjRetailRaw, -capRetail, capRetail);

    // Calculate final adjusted values
    const adjustedLoanValue = Math.max(0, baselineLoanValue + adjLoan);
    const adjustedRetailValue = Math.max(0, baselineRetailValue + adjRetail);

    return {
      adjustedLoanValue: Math.round(adjustedLoanValue),
      adjustedRetailValue: Math.round(adjustedRetailValue),
      deltaMiles,
      adjLoan: Math.round(adjLoan),
      adjRetail: Math.round(adjRetail),
    };
  }

  /**
   * Clamp a value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Get human-readable explanation of mileage adjustment
   */
  getMileageAdjustmentExplanation(
    deltaMiles: number,
    adjLoan: number,
    adjRetail: number,
    currency: string = 'NGN',
  ): string {
    const currencySymbol = currency === 'NGN' ? '₦' : currency;

    if (deltaMiles === 0) {
      return 'Average mileage - no adjustment';
    }

    if (deltaMiles < 0) {
      // Low mileage (bonus)
      return `Low mileage (+${Math.abs(Math.round(deltaMiles)).toLocaleString()} miles below expected): Loan value +${currencySymbol}${Math.abs(adjLoan).toLocaleString()}, Retail value +${currencySymbol}${Math.abs(adjRetail).toLocaleString()}`;
    } else {
      // High mileage (penalty)
      return `High mileage (+${Math.round(deltaMiles).toLocaleString()} miles above expected): Loan value -${currencySymbol}${Math.abs(adjLoan).toLocaleString()}, Retail value -${currencySymbol}${Math.abs(adjRetail).toLocaleString()}`;
    }
  }
}

