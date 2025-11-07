import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/register.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Find users with filters (Admin only)
   * Default: Only USER role
   * Can filter by role or search by name/email
   */
  async findAllWithFilters(filterDto: UserFilterDto): Promise<PaginatedResponse<User>> {
    const page = parseInt(filterDto.page || '1', 10);
    const limit = parseInt(filterDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    // Role filter (default to USER)
    const roleFilter = filterDto.role?.toLowerCase();
    if (!roleFilter || roleFilter === UserRole.USER.toLowerCase()) {
      queryBuilder.andWhere('user.role = :role', { role: UserRole.USER });
    } else if (roleFilter === UserRole.ADMIN.toLowerCase()) {
      queryBuilder.andWhere('user.role = :role', { role: UserRole.ADMIN });
    } else if (roleFilter !== 'all') {
      // If not 'all' and not a valid role, default to USER
      queryBuilder.andWhere('user.role = :role', { role: UserRole.USER });
    }
    // If roleFilter === 'all', no role filter applied

    // Search filter (name or email)
    if (filterDto.search) {
      queryBuilder.andWhere(
        '(LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: `%${filterDto.search.toLowerCase()}%` },
      );
    }

    // Select fields (exclude password)
    queryBuilder.select([
      'user.id',
      'user.firstName',
      'user.lastName',
      'user.email',
      'user.phone',
      'user.role',
      'user.createdAt',
      'user.updatedAt',
    ]);

    // Pagination
    queryBuilder.skip(skip).take(limit);

    // Order by creation date (newest first)
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }
}
