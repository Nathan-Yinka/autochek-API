import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    example: 'tester@test.com',
    description: 'Email address (use tester@test.com for user, admin@test.com for admin)',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: '12345',
    description: 'Password is 12345 for both user and admin',
  })
  @IsString()
  password: string;
}

