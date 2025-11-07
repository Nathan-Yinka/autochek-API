import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface RapidAPIVinResponse {
  uid: string;
  mileage_adjustment: number;
  loan_value: number;
  trade_in_value: number;
  adjusted_trade_in_value: number;
  make: string;
  make_code: string;
  model: string;
  model_code: string;
  trim: string;
  trim_code: string;
  year: number;
  retail_value: number;
  msrp_value: number;
  average_trade_in: number;
  weight: number;
  engine?: string;
  transmission?: string;
  fuel_type?: string;
  exterior_color?: string;
  interior_color?: string;
}

export interface ValuationResult {
  retailValue: number;
  loanValue: number;
  source: string;
  providerRef: string;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  engine?: string;
  transmission?: string;
  fuelType?: string;
  exteriorColor?: string;
  interiorColor?: string;
}

/**
 * Service for integrating with RapidAPI VIN Lookup service
 * Provides vehicle valuation data from external market sources
 */
@Injectable()
export class RapidAPIService {
  private readonly logger = new Logger(RapidAPIService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiHost: string;
  private readonly apiUrl: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RAPIDAPI_KEY') || '';
    this.apiHost = this.configService.get<string>('RAPIDAPI_HOST') || 'vin-lookup2.p.rapidapi.com';
    this.apiUrl = `https://${this.apiHost}/vehicle-lookup`;
    this.enabled = this.configService.get<boolean>('RAPIDAPI_ENABLED') !== false; // Enabled by default

    // Configure axios instance with default headers and timeout
    this.axiosInstance = axios.create({
      timeout: 10000, // 10 seconds timeout
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': this.apiHost,
      },
    });
  }

  /**
   * Fetch vehicle valuation from RapidAPI VIN Lookup service
   * Returns null if API is disabled, fails, or returns invalid data
   * 
   * @param vin Vehicle Identification Number
   * @returns ValuationResult or null if failed
   */
  async fetchValuation(vin: string): Promise<ValuationResult | null> {
    // Check if API is enabled
    if (!this.enabled) {
      this.logger.debug('RapidAPI is disabled, skipping external API call');
      return null;
    }

    // Check if API key is configured
    if (!this.apiKey) {
      this.logger.warn('RapidAPI key not configured, skipping external API call');
      return null;
    }

    try {
      this.logger.log(`Fetching valuation from RapidAPI for VIN: ${vin}`);

      const response = await this.axiosInstance.get<RapidAPIVinResponse>(this.apiUrl, {
        params: { vin },
      });

      // Validate response data
      if (!this.isValidResponse(response.data)) {
        this.logger.warn(`Invalid response from RapidAPI for VIN: ${vin}`);
        return null;
      }

      const result = this.transformResponse(response.data);
      
      this.logger.log(`Successfully fetched valuation from RapidAPI for VIN: ${vin}`);
      
      return result;
    } catch (error) {
      this.handleApiError(error, vin);
      return null;
    }
  }

  /**
   * Validate that the API response contains required fields
   */
  private isValidResponse(data: any): data is RapidAPIVinResponse {
    return (
      data &&
      typeof data.retail_value === 'number' &&
      typeof data.loan_value === 'number' &&
      data.retail_value > 0 &&
      data.loan_value > 0
    );
  }

  /**
   * Transform RapidAPI response to our internal format
   * Converts USD values to NGN (using approximate rate)
   */
  private transformResponse(data: RapidAPIVinResponse): ValuationResult {
    // Conversion rate: 1 USD = ~1500 NGN (approximate, could be configurable)
    const usdToNgnRate = this.configService.get<number>('USD_TO_NGN_RATE') || 1500;

    // Convert USD values to NGN
    const retailValue = Math.round(data.retail_value * usdToNgnRate);
    const loanValue = Math.round(data.loan_value * usdToNgnRate);

    return {
      retailValue,
      loanValue,
      source: 'rapidapi:vin-lookup-jack-roe',
      providerRef: data.uid,
      make: data.make || undefined,
      model: data.model || undefined,
      year: data.year || undefined,
      trim: data.trim || undefined,
      engine: data.engine || undefined,
      transmission: data.transmission || undefined,
      fuelType: data.fuel_type || undefined,
      exteriorColor: data.exterior_color || undefined,
      interiorColor: data.interior_color || undefined,
    };
  }

  /**
   * Handle and log API errors appropriately
   */
  private handleApiError(error: any, vin: string): void {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // API returned error response
        this.logger.error(
          `RapidAPI returned error ${error.response.status} for VIN ${vin}: ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        // Request was made but no response received
        this.logger.error(`No response from RapidAPI for VIN ${vin}: ${error.message}`);
      } else {
        // Request setup error
        this.logger.error(`Error setting up RapidAPI request for VIN ${vin}: ${error.message}`);
      }
    } else {
      // Non-axios error
      this.logger.error(`Unexpected error calling RapidAPI for VIN ${vin}:`, error);
    }
  }

  /**
   * Check if the RapidAPI service is properly configured and enabled
   */
  isConfigured(): boolean {
    return this.enabled && !!this.apiKey;
  }

  /**
   * Get current configuration status (useful for health checks)
   */
  getStatus(): {
    enabled: boolean;
    configured: boolean;
    host: string;
  } {
    return {
      enabled: this.enabled,
      configured: !!this.apiKey,
      host: this.apiHost,
    };
  }
}

