import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Test' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'User' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'tester@test.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone?: string;
}
