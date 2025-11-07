import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderImagesDto {
  @ApiProperty({
    description: 'Array of image IDs in the desired order',
    example: [
      '550e8400-e29b-41d4-a716-446655440003',
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
    type: [String],
  })
  @IsArray({ message: 'imageIds must be an array' })
  @ArrayMinSize(1, { message: 'At least one image ID is required' })
  @IsUUID('4', { each: true, message: 'Each image ID must be a valid UUID' })
  imageIds: string[];
}

