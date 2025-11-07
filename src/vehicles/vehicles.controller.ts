import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
  UseInterceptors,
  UploadedFiles,
  Patch,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { VehicleWithImagesSchema, VehicleUpdateSchema } from './schemas/vehicle-with-images.schema';

// Multer config for image uploads
const imageUploadConfig = {
  storage: diskStorage({
    destination: './uploads/vehicles',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};

@ApiTags('vehicles')
@Controller('vehicles')
@ApiBearerAuth()
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
  ) {}


  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10, imageUploadConfig))
  @ApiConsumes('multipart/form-data')
  @ApiEndpoint('Create vehicle with images', 'Vehicle created successfully', 201, [
    { status: 409, description: 'Vehicle with this VIN already exists' },
  ])
  @ApiBody({ schema: VehicleWithImagesSchema })
  async create(
    @Body() createVehicleDto: CreateVehicleDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: User,
  ): Promise<any> {
    return this.vehiclesService.create(createVehicleDto, user.id, files);
  }

  @Get()
  @ApiEndpoint('Get all vehicles with filtering', 'Vehicles retrieved successfully', 200, [
    { status: 400, description: 'Invalid filter parameters' },
  ])
  async findAll(
    @Query() filterDto: VehicleFilterDto,
    @CurrentUser() user?: User,
  ): Promise<PaginatedResponse<any>> {
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;

    // Handle "owner" special value
    let ownerId = filterDto.ownerId;
    if (ownerId === 'owner' && user) {
      ownerId = user.id;
    }

    const filters = {
      status: filterDto.status,
      ownerId,
      search: filterDto.search,
      make: filterDto.make,
      vehicleType: filterDto.vehicleType,
      region: filterDto.region,
      minYear: filterDto.minYear,
      maxYear: filterDto.maxYear,
      minPrice: filterDto.minPrice,
      maxPrice: filterDto.maxPrice,
      isLoanAvailable: filterDto.isLoanAvailable,
    };

    const result = await this.vehiclesService.findAll(page, limit, filters);

    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
        hasNextPage: page < Math.ceil(result.total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  @Get(':id')
  @ApiEndpoint('Get vehicle by ID', 'Vehicle retrieved successfully', 200, [
    { status: 404, description: 'Vehicle not found' },
  ])
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    const vehicle = await this.vehiclesService.findOne(id);
    return this.vehiclesService['enhanceVehicleWithPaymentEstimate'](vehicle);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @UseInterceptors(FilesInterceptor('images', 10, imageUploadConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: VehicleUpdateSchema })
  @ApiEndpoint('Update vehicle with images', 'Vehicle updated successfully', 200, [
    { status: 404, description: 'Vehicle not found' },
    { status: 403, description: 'Not authorized to update this vehicle' },
    { status: 400, description: 'Cannot modify vehicle with active loans/offers' },
  ])
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: User,
  ): Promise<any> {
    // Service handles authorization check
    return this.vehiclesService.updateVehicle(id, updateVehicleDto, files);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @UseInterceptors(FilesInterceptor('images', 10, imageUploadConfig))
  @ApiConsumes('multipart/form-data')
  @ApiEndpoint('Add images to existing vehicle', 'Images added successfully', 200, [
    { status: 404, description: 'Vehicle not found' },
    { status: 403, description: 'Not authorized' },
  ])
  async addImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
    return this.vehiclesService.addImagesToVehicle(id, files);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiEndpoint('Remove specific image from vehicle', 'Image deleted successfully', 200, [
    { status: 404, description: 'Vehicle or image not found' },
    { status: 403, description: 'Not authorized' },
  ])
  async removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<any> {
    return this.vehiclesService.deleteImageFromVehicle(id, imageId);
  }

  @Patch(':id/images/:imageId/set-primary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiEndpoint('Set image as primary/cover image', 'Primary image set successfully', 200, [
    { status: 404, description: 'Vehicle or image not found' },
  ])
  async setPrimaryImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<any> {
    return this.vehiclesService.setPrimaryImage(id, imageId);
  }

  @Patch(':id/images/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiEndpoint('Reorder vehicle images', 'Images reordered successfully', 200, [
    { status: 404, description: 'Vehicle not found' },
    { status: 400, description: 'Invalid image IDs provided' },
  ])
  async reorderImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reorderDto: ReorderImagesDto,
  ): Promise<any> {
    return this.vehiclesService.reorderImages(id, reorderDto.imageIds);
  }

  @Delete(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiEndpoint('Delete vehicle', 'Vehicle deleted successfully', 200, [
    { status: 404, description: 'Vehicle not found' },
    { status: 403, description: 'Not authorized' },
    { status: 400, description: 'Cannot delete vehicle with active loans/offers' },
  ])
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.vehiclesService.deleteVehicle(id);
    return { message: 'Vehicle deleted successfully' };
  }
}
