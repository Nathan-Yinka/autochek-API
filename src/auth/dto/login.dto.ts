import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    example: 'admin@test.com',
    description: 'Email address (use admin@test.com for admin, tester@test.com for user)',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: '12345',
    description: 'Password is 12345 for both admin and user',
  })
  @IsString()
  password: string;
}

