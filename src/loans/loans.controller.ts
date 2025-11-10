import { Controller, Get, Post, Body, Param, Patch, UseGuards, ParseUUIDPipe, Delete, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';
import { LoanApplicationResponseDto } from './dto/loan-application-response.dto';
import { LoanApplicationMapper } from './mappers/loan-application.mapper';
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
  @ApiResponse({ 
    status: 201, 
    description: 'Loan application submitted successfully',
    type: LoanApplicationResponseDto 
  })
  async create(
    @CurrentUser() user: User | undefined,
    @Body() createLoanApplicationDto: CreateLoanApplicationDto,
  ): Promise<LoanApplicationResponseDto> {
    const userId = user?.id || null;
    const isGuest = !user;
    const loanApplication = await this.loansService.create(userId, createLoanApplicationDto, isGuest);
    return LoanApplicationMapper.toResponseDto(loanApplication);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint('Get user loan applications', 'Loan applications retrieved successfully')
  @ApiResponse({ 
    status: 200, 
    description: 'Loan applications retrieved successfully',
    type: [LoanApplicationResponseDto]
  })
  async findAll(@CurrentUser() user: User): Promise<LoanApplicationResponseDto[]> {
    const loanApplications = await this.loansService.getUserLoans(user.id);
    return LoanApplicationMapper.toResponseDtoArray(loanApplications);
  }

  @Get('unclaimed/mine')
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint(
    'Get unclaimed guest applications matching user email',
    'Unclaimed applications retrieved successfully',
    200,
  )
  @ApiResponse({ 
    status: 200, 
    description: 'Unclaimed applications retrieved successfully',
    type: [LoanApplicationResponseDto]
  })
  async findUnclaimed(@CurrentUser() user: User): Promise<LoanApplicationResponseDto[]> {
    const loanApplications = await this.loansService.getUnclaimedApplicationsByEmail(user.email);
    return LoanApplicationMapper.toResponseDtoArray(loanApplications);
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
  @ApiResponse({ 
    status: 200, 
    description: 'All loan applications retrieved successfully',
    type: [LoanApplicationResponseDto]
  })
  async findAllForAdmin(): Promise<LoanApplicationResponseDto[]> {
    const loanApplications = await this.loansService.findAll();
    return LoanApplicationMapper.toResponseDtoArray(loanApplications);
  }

  @Get(':id')
  @ApiEndpoint(
    'Get loan application by ID (public)',
    'Loan application retrieved successfully',
    200,
    [{ status: 404, description: 'Loan application not found' }],
  )
  @ApiResponse({ 
    status: 200, 
    description: 'Loan application retrieved successfully',
    type: LoanApplicationResponseDto
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LoanApplicationResponseDto> {
    const loanApplication = await this.loansService.findOne(id);
    return LoanApplicationMapper.toResponseDto(loanApplication);
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
  @ApiResponse({ 
    status: 200, 
    description: 'Application claimed successfully',
    type: LoanApplicationResponseDto
  })
  async claimApplication(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LoanApplicationResponseDto> {
    const loanApplication = await this.loansService.claimGuestApplication(user.id, id);
    return LoanApplicationMapper.toResponseDto(loanApplication);
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
  @ApiResponse({ 
    status: 200, 
    description: 'Loan status updated successfully',
    type: LoanApplicationResponseDto
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLoanStatusDto: UpdateLoanStatusDto,
  ): Promise<LoanApplicationResponseDto> {
    const loanApplication = await this.loansService.updateStatus(id, updateLoanStatusDto);
    return LoanApplicationMapper.toResponseDto(loanApplication);
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
