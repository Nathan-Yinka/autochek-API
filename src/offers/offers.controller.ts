import { Controller, Get, Post, Body, Param, Patch, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferStatusDto } from './dto/update-offer-status.dto';
import { DeclineOfferDto } from './dto/decline-offer.dto';
import { OfferResponseDto } from './dto/offer-response.dto';
import { OfferMapper } from './mappers/offer.mapper';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';

@ApiTags('offers')
@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiEndpoint(
    'Create loan offer (Admin only)',
    'Offer created successfully',
    201,
    [
      { status: 403, description: 'Admin access required' },
      { status: 404, description: 'Loan application not found' },
    ],
  )
  @ApiResponse({ 
    status: 201, 
    description: 'Offer created successfully',
    type: OfferResponseDto 
  })
  async create(@Body() createOfferDto: CreateOfferDto, @CurrentUser() user: User): Promise<OfferResponseDto> {
    const offer = await this.offersService.create(createOfferDto, user.id);
    return OfferMapper.toResponseDto(offer);
  }

  @Get()
  @ApiEndpoint('Get user offers', 'Offers retrieved successfully')
  @ApiResponse({ 
    status: 200, 
    description: 'Offers retrieved successfully',
    type: [OfferResponseDto]
  })
  async findAll(@CurrentUser() user: User): Promise<OfferResponseDto[]> {
    const offers = await this.offersService.findUserOffers(user.id);
    return OfferMapper.toResponseDtoArray(offers);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiEndpoint(
    'Get all offers (Admin only)',
    'All offers retrieved successfully',
    200,
    [{ status: 403, description: 'Admin access required' }],
  )
  @ApiResponse({ 
    status: 200, 
    description: 'All offers retrieved successfully',
    type: [OfferResponseDto]
  })
  async findAllForAdmin(): Promise<OfferResponseDto[]> {
    const offers = await this.offersService.findAll();
    return OfferMapper.toResponseDtoArray(offers);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  @ApiEndpoint(
    'Get offers for a specific user (Admin only)',
    'User offers retrieved successfully',
    200,
    [{ status: 403, description: 'Admin access required' }],
  )
  @ApiResponse({ 
    status: 200, 
    description: 'User offers retrieved successfully',
    type: [OfferResponseDto]
  })
  async findUserOffersForAdmin(@Param('userId', ParseUUIDPipe) userId: string): Promise<OfferResponseDto[]> {
    const offers = await this.offersService.findUserOffers(userId);
    return OfferMapper.toResponseDtoArray(offers);
  }

  @Get(':id')
  @ApiEndpoint(
    'Get offer by ID',
    'Offer retrieved successfully',
    200,
    [{ status: 404, description: 'Offer not found' }],
  )
  @ApiResponse({ 
    status: 200, 
    description: 'Offer retrieved successfully',
    type: OfferResponseDto
  })
  async findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<OfferResponseDto> {
    const offer = await this.offersService.findOne(id, user.id);
    return OfferMapper.toResponseDto(offer);
  }

  @Get('loan/:loanId')
  @ApiEndpoint(
    'Get offers by loan application ID',
    'Loan offers retrieved successfully',
  )
  @ApiResponse({ 
    status: 200, 
    description: 'Loan offers retrieved successfully',
    type: [OfferResponseDto]
  })
  async findByLoanId(@Param('loanId', ParseUUIDPipe) loanId: string): Promise<OfferResponseDto[]> {
    const offers = await this.offersService.findByLoanApplicationId(loanId);
    return OfferMapper.toResponseDtoArray(offers);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiEndpoint(
    'Update offer status (Admin only)',
    'Offer status updated successfully',
    200,
    [
      { status: 403, description: 'Admin access required' },
      { status: 404, description: 'Offer not found' },
      { status: 400, description: 'Offer has expired or invalid status transition' },
    ],
  )
  @ApiResponse({ 
    status: 200, 
    description: 'Offer status updated successfully',
    type: OfferResponseDto
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOfferStatusDto: UpdateOfferStatusDto,
  ): Promise<OfferResponseDto> {
    const offer = await this.offersService.updateStatus(id, updateOfferStatusDto);
    return OfferMapper.toResponseDto(offer);
  }

  @Patch(':id/accept')
  @ApiEndpoint(
    'Accept offer',
    'Offer accepted successfully',
    200,
    [
      { status: 404, description: 'Offer not found' },
      { status: 400, description: 'Offer has expired or cannot be accepted' },
    ],
  )
  @ApiResponse({ 
    status: 200, 
    description: 'Offer accepted successfully',
    type: OfferResponseDto
  })
  async acceptOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<OfferResponseDto> {
    const offer = await this.offersService.acceptOffer(id, user.id);
    return OfferMapper.toResponseDto(offer);
  }

    @Patch(':id/decline')
  @ApiEndpoint(
    'Decline offer with optional reason',
    'Offer declined successfully',
    200,
    [
      { status: 404, description: 'Offer not found' },
      { status: 400, description: 'Offer has expired or cannot be declined' },
    ],
  )
  @ApiResponse({ 
    status: 200, 
    description: 'Offer declined successfully',
    type: OfferResponseDto
  })
  async declineOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() declineOfferDto: DeclineOfferDto,
    @CurrentUser() user: User,
  ): Promise<OfferResponseDto> {
    const offer = await this.offersService.declineOffer(id, user.id, declineOfferDto.note);
    return OfferMapper.toResponseDto(offer);
  }
}
