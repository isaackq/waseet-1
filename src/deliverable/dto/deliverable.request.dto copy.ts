import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { DeliverableType } from '../enums/deliverable-type.enum';

export class DeliverableRequestDto {
  @ApiProperty({
    description: 'Session ID this deliverable belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Name of the deliverable',
    example: 'Final Website Design',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Description of the deliverable',
    example: 'Complete website design with all pages and assets',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Type of deliverable',
    enum: DeliverableType,
    example: DeliverableType.DOCUMENT,
  })
  @IsNotEmpty()
  @IsEnum(DeliverableType)
  type: DeliverableType;

  @ApiProperty({
    description: 'Link URL (for LINK type)',
    example: 'https://example.com/project',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  linkUrl?: string;
}
