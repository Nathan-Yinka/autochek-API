import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service for managing loan policy configuration
 * All business rules are externalized to environment variables
 */
@Injectable()
export class LoanPolicyService {
  constructor(private configService: ConfigService) {}

  /**
   * Get Loan-to-Value cap (e.g., 1.10 = 110%)
   */
  getLtvCap(): number {
    return this.configService.get<number>('LTV_CAP') || 1.10;
  }

  /**
   * Get minimum loan term in months
   */
  getMinTermMonths(): number {
    return this.configService.get<number>('MIN_TERM_MONTHS') || 12;
  }

  /**
   * Get maximum loan term in months
   */
  getMaxTermMonths(): number {
    return this.configService.get<number>('MAX_TERM_MONTHS') || 72;
  }

  /**
   * Get valuation time-to-live in days
   */
  getValuationTtlDays(): number {
    return this.configService.get<number>('VALUATION_TTL_DAYS') || 14;
  }

  /**
   * Get default APR for implied payment calculations
   */
  getDefaultApr(): number {
    return this.configService.get<number>('DEFAULT_APR') || 0.25;
  }

  /**
   * Get expected miles per year for mileage adjustment
   */
  getExpectedMilesPerYear(): number {
    return this.configService.get<number>('EXPECTED_MILES_PER_YEAR') || 12000;
  }

  /**
   * Get loan value adjustment per 1k miles
   */
  getLoanAdjPer1k(): number {
    return this.configService.get<number>('LOAN_ADJ_PER_1K') || 12;
  }

  /**
   * Get retail value adjustment per 1k miles
   */
  getRetailAdjPer1k(): number {
    return this.configService.get<number>('RETAIL_ADJ_PER_1K') || 18;
  }

  /**
   * Get mileage adjustment cap percentage (e.g., 0.20 = ±20%)
   */
  getMileageAdjCapPct(): number {
    return this.configService.get<number>('MILEAGE_ADJ_CAP_PCT') || 0.20;
  }

  /**
   * Check if a term is within acceptable range
   */
  isTermValid(termMonths: number): boolean {
    return termMonths >= this.getMinTermMonths() && termMonths <= this.getMaxTermMonths();
  }

  /**
   * Check if a valuation is still fresh
   */
  isValuationFresh(fetchedAt: Date): boolean {
    const ttlMs = this.getValuationTtlDays() * 24 * 60 * 60 * 1000;
    const age = Date.now() - fetchedAt.getTime();
    return age <= ttlMs;
  }

  /**
   * Get all policy values for debugging/admin view
   */
  getAllPolicies(): Record<string, any> {
    return {
      ltvCap: this.getLtvCap(),
      minTermMonths: this.getMinTermMonths(),
      maxTermMonths: this.getMaxTermMonths(),
      valuationTtlDays: this.getValuationTtlDays(),
      defaultApr: this.getDefaultApr(),
      expectedMilesPerYear: this.getExpectedMilesPerYear(),
      loanAdjPer1k: this.getLoanAdjPer1k(),
      retailAdjPer1k: this.getRetailAdjPer1k(),
      mileageAdjCapPct: this.getMileageAdjCapPct(),
    };
  }
}

