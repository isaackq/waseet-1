import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DeliverableType } from 'src/deliverable/enums/deliverable-type.enum';

export class CreateDisputeEvidenceDto {
  @ApiProperty({
    enum: DeliverableType,
    description: 'Evidence type',
    example: DeliverableType.DOCUMENT,
  })
  @IsNotEmpty()
  @IsEnum(DeliverableType)
  type: DeliverableType;

  @ApiProperty({
    description: 'Evidence title',
    example: 'Original project requirements',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Explanation of how this evidence supports the case',
    example: 'This file shows the requested scope and accepted version.',
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  description: string;
}
