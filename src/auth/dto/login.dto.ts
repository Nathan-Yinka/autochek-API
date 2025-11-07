import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    example: 'admin@test.com',
    description: 'Email address (use admin@test.com for admin, john.doe@example.com for user)',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: '12345',
    description: 'Password (use 12345 for admin, password123 for user)',
  })
  @IsString()
  password: string;
}

