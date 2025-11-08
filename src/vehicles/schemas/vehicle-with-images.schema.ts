import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const VehicleWithImagesSchema: SchemaObject = {
  type: 'object',
  required: ['vin', 'make', 'model', 'year', 'mileage'],
  properties: {
    // REQUIRED FIELDS
    vin: { 
      type: 'string', 
      
      description: 'Vehicle Identification Number' 
    },
    make: { 
      type: 'string', 
      
      description: 'Vehicle manufacturer' 
    },
    model: { 
      type: 'string', 
      
      description: 'Vehicle model' 
    },
    year: { 
      type: 'number', 
      
      description: 'Manufacturing year' 
    },
    mileage: { 
      type: 'number', 
      
      description: 'Current mileage' 
    },

    // VEHICLE TYPE & CLASSIFICATION
    vehicleType: { 
      type: 'string', 
      
      enum: ['local_used', 'foreign_used', 'brand_new'],
      description: 'Vehicle type and origin' 
    },
    trim: { 
      type: 'string', 
      
      description: 'Vehicle trim level' 
    },
    condition: { 
      type: 'string', 
      
      description: 'Vehicle condition description' 
    },

    // TECHNICAL SPECIFICATIONS
    engine: { 
      type: 'string', 
      
      description: 'Engine specification' 
    },
    transmission: { 
      type: 'string', 
      
      description: 'Transmission type' 
    },
    driveType: { 
      type: 'string', 
      
      enum: ['manual', 'automatic'],
      description: 'Drive type' 
    },
    fuelType: { 
      type: 'string', 
      
      description: 'Fuel type (petrol, diesel, hybrid, electric)' 
    },

    // APPEARANCE
    exteriorColor: { 
      type: 'string', 
      
      description: 'Exterior body color' 
    },
    interiorColor: { 
      type: 'string', 
      
      description: 'Interior cabin color' 
    },

    // LOCATION
    address: { 
      type: 'string', 
      
      description: 'Physical location of vehicle' 
    },
    region: { 
      type: 'string', 
      
      description: 'Geographic region' 
    },

    // PRICING
    listingPrice: { 
      type: 'number', 
      
      description: 'Asking price in NGN' 
    },
    currency: { 
      type: 'string', 
      
      description: 'Currency of listing price' 
    },
    requiredDownPaymentPct: { 
      type: 'number', 
      
      description: 'Required down payment percentage (0.40 = 40%)' 
    },

    // VALUATION (can be auto-filled from /evaluate endpoint)
    retailValue: { 
      type: 'number', 
      
      description: 'Retail market value (from VIN API evaluation)' 
    },
    loanValue: { 
      type: 'number', 
      
      description: 'Loan value - REQUIRED if isLoanAvailable=true (from VIN API evaluation with mileage adjustment)' 
    },

    // LOAN CONFIGURATION
    isLoanAvailable: { 
      type: 'boolean', 
      
      description: 'Whether loan financing is available for this vehicle' 
    },
    minLoanValue: { 
      type: 'number', 
      
      description: 'Minimum loan amount in NGN - REQUIRED if isLoanAvailable=true' 
    },
    maxLoanPeriodMonths: { 
      type: 'number', 
      
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
      
      description: 'Vehicle manufacturer' 
    },
    model: { 
      type: 'string', 
      
      description: 'Vehicle model' 
    },
    year: { 
      type: 'number', 
      
      description: 'Manufacturing year' 
    },
    mileage: { 
      type: 'number', 
      
      description: 'Current mileage' 
    },

    // VEHICLE TYPE & CLASSIFICATION
    vehicleType: { 
      type: 'string', 
      
      enum: ['local_used', 'foreign_used', 'brand_new'],
      description: 'Vehicle type' 
    },
    trim: { 
      type: 'string', 
      
      description: 'Trim level' 
    },
    condition: { 
      type: 'string', 
      
      description: 'Condition description' 
    },

    // TECHNICAL SPECIFICATIONS
    engine: { 
      type: 'string', 
      
      description: 'Engine specification' 
    },
    transmission: { 
      type: 'string', 
      
      description: 'Transmission type' 
    },
    driveType: { 
      type: 'string', 
      
      enum: ['manual', 'automatic'],
      description: 'Drive type' 
    },
    fuelType: { 
      type: 'string', 
      
      description: 'Fuel type' 
    },

    // APPEARANCE
    exteriorColor: { 
      type: 'string', 
      
      description: 'Exterior color' 
    },
    interiorColor: { 
      type: 'string', 
      
      description: 'Interior color' 
    },

    // LOCATION
    address: { 
      type: 'string', 
      
      description: 'Physical location' 
    },
    region: { 
      type: 'string', 
      
      description: 'Geographic region' 
    },

    // PRICING
    listingPrice: { 
      type: 'number', 
      
      description: 'Asking price' 
    },
    currency: { 
      type: 'string', 
      
      description: 'Currency' 
    },
    requiredDownPaymentPct: { 
      type: 'number', 
      
      description: 'Required down payment percentage' 
    },

    // VALUATION
    retailValue: { 
      type: 'number', 
      
      description: 'Retail market value' 
    },
    loanValue: { 
      type: 'number', 
      
      description: 'Loan value' 
    },

    // LOAN CONFIGURATION
    isLoanAvailable: { 
      type: 'boolean', 
      
      description: 'Loan availability' 
    },
    minLoanValue: { 
      type: 'number', 
      
      description: 'Minimum loan amount' 
    },
    maxLoanPeriodMonths: { 
      type: 'number', 
      
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
