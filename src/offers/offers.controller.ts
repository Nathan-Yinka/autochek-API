import { Controller, Get, Post, Body, Param, Patch, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferStatusDto } from './dto/update-offer-status.dto';
import { DeclineOfferDto } from './dto/decline-offer.dto';
import { Offer } from './entities/offer.entity';
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
  async create(@Body() createOfferDto: CreateOfferDto, @CurrentUser() user: User): Promise<Offer> {
    return this.offersService.create(createOfferDto, user.id);
  }

  @Get()
  @ApiEndpoint('Get user offers', 'Offers retrieved successfully')
  async findAll(@CurrentUser() user: User): Promise<Offer[]> {
    return this.offersService.findUserOffers(user.id);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiEndpoint(
    'Get all offers (Admin only)',
    'All offers retrieved successfully',
    200,
    [{ status: 403, description: 'Admin access required' }],
  )
  async findAllForAdmin(): Promise<Offer[]> {
    return this.offersService.findAll();
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  @ApiEndpoint(
    'Get offers for a specific user (Admin only)',
    'User offers retrieved successfully',
    200,
    [{ status: 403, description: 'Admin access required' }],
  )
  async findUserOffersForAdmin(@Param('userId', ParseUUIDPipe) userId: string): Promise<Offer[]> {
    return this.offersService.findUserOffers(userId);
  }

  @Get(':id')
  @ApiEndpoint(
    'Get offer by ID',
    'Offer retrieved successfully',
    200,
    [{ status: 404, description: 'Offer not found' }],
  )
  async findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<Offer> {
    return this.offersService.findOne(id, user.id);
  }

  @Get('loan/:loanId')
  @ApiEndpoint(
    'Get offers by loan application ID',
    'Loan offers retrieved successfully',
  )
  async findByLoanId(@Param('loanId', ParseUUIDPipe) loanId: string): Promise<Offer[]> {
    return this.offersService.findByLoanApplicationId(loanId);
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
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOfferStatusDto: UpdateOfferStatusDto,
  ): Promise<Offer> {
    return this.offersService.updateStatus(id, updateOfferStatusDto);
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
  async acceptOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Offer> {
    return this.offersService.acceptOffer(id, user.id);
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
  async declineOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() declineOfferDto: DeclineOfferDto,
    @CurrentUser() user: User,
  ): Promise<Offer> {
    return this.offersService.declineOffer(id, user.id, declineOfferDto.note);
  }
}
