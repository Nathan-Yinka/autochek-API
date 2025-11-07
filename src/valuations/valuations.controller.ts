import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe, Delete, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ValuationsService } from './valuations.service';
import { Valuation } from './entities/valuation.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { VehiclesEvaluationService } from '../vehicles/vehicles-evaluation.service';
import { EvaluateVehicleDto } from '../vehicles/dto/evaluate-vehicle.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('valuations')
@Controller('valuations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ValuationsController {
  constructor(
    private readonly valuationsService: ValuationsService,
    private readonly evaluationService: VehiclesEvaluationService,
  ) {}

  @Post('evaluate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiEndpoint(
    'Evaluate vehicle by VIN and mileage (saves to DB and returns suggested values)',
    'Vehicle evaluated and valuation saved successfully',
    200,
    [{ status: 404, description: 'VIN not found in external API' }],
  )
  async evaluate(@Body() evaluateDto: EvaluateVehicleDto): Promise<any> {
    return this.evaluationService.evaluateVehicle(evaluateDto);
  }

  @Get()
  @ApiEndpoint('Get all valuations', 'Valuations retrieved successfully')
  async findAll(): Promise<Valuation[]> {
    return this.valuationsService.findAll();
  }

  @Get('vin/:vin')
  @ApiEndpoint(
    'Get valuation history for a specific VIN',
    'Valuation history retrieved successfully',
    200,
    [{ status: 404, description: 'No valuations found for this VIN' }],
  )
  async findByVin(@Param('vin') vin: string): Promise<Valuation[]> {
    return this.valuationsService.findByVin(vin);
  }

  @Get(':id')
  @ApiEndpoint(
    'Get valuation by ID',
    'Valuation retrieved successfully',
    200,
    [{ status: 404, description: 'Valuation not found' }],
  )
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Valuation> {
    return this.valuationsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiEndpoint(
    'Delete specific valuation by ID',
    'Valuation deleted successfully',
    200,
    [{ status: 404, description: 'Valuation not found' }],
  )
  async deleteOne(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.valuationsService.deleteOne(id);
  }

  @Delete('vin/:vin')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiEndpoint(
    'Delete all valuations for a specific VIN',
    'Valuations deleted successfully',
    200,
    [{ status: 404, description: 'No valuations found for this VIN' }],
  )
  async deleteByVin(@Param('vin') vin: string): Promise<{ message: string; count: number }> {
    return this.valuationsService.deleteByVin(vin);
  }
}
