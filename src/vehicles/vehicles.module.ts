import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { VehiclesEvaluationService } from './vehicles-evaluation.service';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleImage } from './entities/vehicle-image.entity';
import { LoanApplication } from '../loans/entities/loan-application.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Valuation } from '../valuations/entities/valuation.entity';
import { VehicleImageService } from './services/vehicle-image.service';
import { LoanPolicyService } from '../common/services/loan-policy.service';
import { RapidAPIService } from '../valuations/services/rapidapi.service';
import { MileageAdjustmentService } from '../valuations/services/mileage-adjustment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, VehicleImage, LoanApplication, Offer, Valuation])],
  controllers: [VehiclesController],
  providers: [
    VehiclesService,
    VehicleImageService,
    VehiclesEvaluationService,
    LoanPolicyService,
    RapidAPIService,
    MileageAdjustmentService,
  ],
  exports: [VehiclesService, VehicleImageService, VehiclesEvaluationService],
})
export class VehiclesModule {}
