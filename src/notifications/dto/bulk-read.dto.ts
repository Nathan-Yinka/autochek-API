import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkReadDto {
  @ApiProperty({ 
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    description: 'Array of notification IDs to mark as read',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  notificationIds: string[];
}

