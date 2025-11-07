import { Controller, Get, Post, Body, Param, Patch, UseGuards, ParseUUIDPipe, Delete, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';
import { LoanApplication } from './entities/loan-application.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';

@ApiTags('loans')
@Controller('loans')
@ApiBearerAuth()
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @ApiEndpoint(
    'Submit loan application (guest or logged-in)',
    'Loan application submitted successfully',
    201,
    [{ status: 400, description: 'Bad request' }],
  )
  async create(
    @CurrentUser() user: User | undefined,
    @Body() createLoanApplicationDto: CreateLoanApplicationDto,
  ): Promise<LoanApplication> {
    const userId = user?.id || null;
    const isGuest = !user;
    return this.loansService.create(userId, createLoanApplicationDto, isGuest);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint('Get user loan applications', 'Loan applications retrieved successfully')
  async findAll(@CurrentUser() user: User): Promise<LoanApplication[]> {
    return this.loansService.getUserLoans(user.id);
  }

  @Get('unclaimed/mine')
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint(
    'Get unclaimed guest applications matching user email',
    'Unclaimed applications retrieved successfully',
    200,
  )
  async findUnclaimed(@CurrentUser() user: User): Promise<LoanApplication[]> {
    return this.loansService.getUnclaimedApplicationsByEmail(user.email);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiEndpoint(
    'Get all loan applications (Admin only)',
    'All loan applications retrieved successfully',
    200,
    [{ status: 403, description: 'Admin access required' }],
  )
  async findAllForAdmin(): Promise<LoanApplication[]> {
    return this.loansService.findAll();
  }

  @Get(':id')
  @ApiEndpoint(
    'Get loan application by ID (public)',
    'Loan application retrieved successfully',
    200,
    [{ status: 404, description: 'Loan application not found' }],
  )
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LoanApplication> {
    return this.loansService.findOne(id);
  }

  @Post('claim/:id')
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint(
    'Claim guest application',
    'Application claimed successfully',
    200,
    [
      { status: 400, description: 'Cannot claim this application' },
      { status: 404, description: 'Application not found' },
    ],
  )
  async claimApplication(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LoanApplication> {
    return this.loansService.claimGuestApplication(user.id, id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiEndpoint(
    'Update loan application status (Admin only)',
    'Loan status updated successfully',
    200,
    [
      { status: 403, description: 'Admin access required' },
      { status: 404, description: 'Loan application not found' },
    ],
  )
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLoanStatusDto: UpdateLoanStatusDto,
  ): Promise<LoanApplication> {
    return this.loansService.updateStatus(id, updateLoanStatusDto);
  }

  @Delete(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint(
    'Delete loan application (user can delete their own, admin can delete any)',
    'Loan application deleted successfully',
    200,
    [
      { status: 403, description: 'Not authorized to delete this application' },
      { status: 404, description: 'Loan application not found' },
      { status: 400, description: 'Cannot delete application with active offer' },
    ],
  )
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.loansService.deleteApplication(id, user.id, user.role);
  }
}
