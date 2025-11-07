import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValuationsService } from './valuations.service';
import { ValuationsController } from './valuations.controller';
import { Valuation } from './entities/valuation.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { RapidAPIService } from './services/rapidapi.service';
import { ValuationCalculatorService } from './services/valuation-calculator.service';
import { MileageAdjustmentService } from './services/mileage-adjustment.service';
import { LoanPolicyService } from '../common/services/loan-policy.service';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Valuation, Vehicle]),
    forwardRef(() => VehiclesModule),
  ],
  controllers: [ValuationsController],
  providers: [
    ValuationsService,
    RapidAPIService,
    ValuationCalculatorService,
    MileageAdjustmentService,
    LoanPolicyService,
  ],
  exports: [ValuationsService, MileageAdjustmentService, RapidAPIService],
})
export class ValuationsModule {}
