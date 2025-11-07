import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const VehicleWithImagesSchema: SchemaObject = {
  type: 'object',
  required: ['vin', 'make', 'model', 'year', 'mileage'],
  properties: {
    // REQUIRED FIELDS
    vin: { 
      type: 'string', 
      example: '1HGCM82633A123456', 
      description: 'Vehicle Identification Number' 
    },
    make: { 
      type: 'string', 
      example: 'Toyota', 
      description: 'Vehicle manufacturer' 
    },
    model: { 
      type: 'string', 
      example: 'Camry', 
      description: 'Vehicle model' 
    },
    year: { 
      type: 'number', 
      example: 2020, 
      description: 'Manufacturing year' 
    },
    mileage: { 
      type: 'number', 
      example: 25000, 
      description: 'Current mileage' 
    },

    // VEHICLE TYPE & CLASSIFICATION
    vehicleType: { 
      type: 'string', 
      example: 'foreign_used', 
      enum: ['local_used', 'foreign_used', 'brand_new'],
      description: 'Vehicle type and origin' 
    },
    trim: { 
      type: 'string', 
      example: 'LE', 
      description: 'Vehicle trim level' 
    },
    condition: { 
      type: 'string', 
      example: 'Excellent condition', 
      description: 'Vehicle condition description' 
    },

    // TECHNICAL SPECIFICATIONS
    engine: { 
      type: 'string', 
      example: 'V6 3.5L', 
      description: 'Engine specification' 
    },
    transmission: { 
      type: 'string', 
      example: 'Automatic', 
      description: 'Transmission type' 
    },
    driveType: { 
      type: 'string', 
      example: 'automatic', 
      enum: ['manual', 'automatic'],
      description: 'Drive type' 
    },
    fuelType: { 
      type: 'string', 
      example: 'petrol', 
      description: 'Fuel type (petrol, diesel, hybrid, electric)' 
    },

    // APPEARANCE
    exteriorColor: { 
      type: 'string', 
      example: 'Silver', 
      description: 'Exterior body color' 
    },
    interiorColor: { 
      type: 'string', 
      example: 'Black', 
      description: 'Interior cabin color' 
    },

    // LOCATION
    address: { 
      type: 'string', 
      example: '123 Victoria Island, Lagos', 
      description: 'Physical location of vehicle' 
    },
    region: { 
      type: 'string', 
      example: 'Lagos', 
      description: 'Geographic region' 
    },

    // PRICING
    listingPrice: { 
      type: 'number', 
      example: 5000000, 
      description: 'Asking price in NGN' 
    },
    currency: { 
      type: 'string', 
      example: 'NGN', 
      default: 'NGN',
      description: 'Currency of listing price' 
    },
    requiredDownPaymentPct: { 
      type: 'number', 
      example: 0.40, 
      default: 0.40, 
      description: 'Required down payment percentage (0.40 = 40%)' 
    },

    // VALUATION (can be auto-filled from /evaluate endpoint)
    retailValue: { 
      type: 'number', 
      example: 5000000, 
      description: 'Retail market value (from VIN API evaluation)' 
    },
    loanValue: { 
      type: 'number', 
      example: 4750000, 
      description: 'Loan value - REQUIRED if isLoanAvailable=true (from VIN API evaluation with mileage adjustment)' 
    },

    // LOAN CONFIGURATION
    isLoanAvailable: { 
      type: 'boolean', 
      example: true, 
      default: true,
      description: 'Whether loan financing is available for this vehicle' 
    },
    minLoanValue: { 
      type: 'number', 
      example: 500000, 
      description: 'Minimum loan amount in NGN - REQUIRED if isLoanAvailable=true' 
    },
    maxLoanPeriodMonths: { 
      type: 'number', 
      example: 60, 
      description: 'Maximum loan period in months - REQUIRED if isLoanAvailable=true' 
    },

    // IMAGES
    images: {
      type: 'array',
      items: {
        type: 'string',
        format: 'binary',
      },
      description: 'Vehicle images (max 10 files, 5MB each)',
    },
  },
};

export const VehicleUpdateSchema: SchemaObject = {
  type: 'object',
  properties: {
    // BASIC INFO
    make: { 
      type: 'string', 
      example: 'Toyota', 
      description: 'Vehicle manufacturer' 
    },
    model: { 
      type: 'string', 
      example: 'Camry', 
      description: 'Vehicle model' 
    },
    year: { 
      type: 'number', 
      example: 2020, 
      description: 'Manufacturing year' 
    },
    mileage: { 
      type: 'number', 
      example: 25000, 
      description: 'Current mileage' 
    },

    // VEHICLE TYPE & CLASSIFICATION
    vehicleType: { 
      type: 'string', 
      example: 'foreign_used', 
      enum: ['local_used', 'foreign_used', 'brand_new'],
      description: 'Vehicle type' 
    },
    trim: { 
      type: 'string', 
      example: 'LE', 
      description: 'Trim level' 
    },
    condition: { 
      type: 'string', 
      example: 'Excellent condition', 
      description: 'Condition description' 
    },

    // TECHNICAL SPECIFICATIONS
    engine: { 
      type: 'string', 
      example: 'V6 3.5L', 
      description: 'Engine specification' 
    },
    transmission: { 
      type: 'string', 
      example: 'Automatic', 
      description: 'Transmission type' 
    },
    driveType: { 
      type: 'string', 
      example: 'automatic', 
      enum: ['manual', 'automatic'],
      description: 'Drive type' 
    },
    fuelType: { 
      type: 'string', 
      example: 'petrol', 
      description: 'Fuel type' 
    },

    // APPEARANCE
    exteriorColor: { 
      type: 'string', 
      example: 'Silver', 
      description: 'Exterior color' 
    },
    interiorColor: { 
      type: 'string', 
      example: 'Black', 
      description: 'Interior color' 
    },

    // LOCATION
    address: { 
      type: 'string', 
      example: '123 Victoria Island, Lagos', 
      description: 'Physical location' 
    },
    region: { 
      type: 'string', 
      example: 'Lagos', 
      description: 'Geographic region' 
    },

    // PRICING
    listingPrice: { 
      type: 'number', 
      example: 5000000, 
      description: 'Asking price' 
    },
    currency: { 
      type: 'string', 
      example: 'NGN', 
      description: 'Currency' 
    },
    requiredDownPaymentPct: { 
      type: 'number', 
      example: 0.40, 
      description: 'Required down payment percentage' 
    },

    // VALUATION
    retailValue: { 
      type: 'number', 
      example: 5000000, 
      description: 'Retail market value' 
    },
    loanValue: { 
      type: 'number', 
      example: 4750000, 
      description: 'Loan value' 
    },

    // LOAN CONFIGURATION
    isLoanAvailable: { 
      type: 'boolean', 
      example: true, 
      description: 'Loan availability' 
    },
    minLoanValue: { 
      type: 'number', 
      example: 500000, 
      description: 'Minimum loan amount' 
    },
    maxLoanPeriodMonths: { 
      type: 'number', 
      example: 60, 
      description: 'Maximum loan period' 
    },

    // IMAGES
    images: {
      type: 'array',
      items: {
        type: 'string',
        format: 'binary',
      },
      description: 'New vehicle images to add (max 10 files, 5MB each)',
    },
  },
};
