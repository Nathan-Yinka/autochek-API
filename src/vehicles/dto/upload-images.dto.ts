import { ApiProperty } from '@nestjs/swagger';

export class UploadImagesDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  images: any[];
}

