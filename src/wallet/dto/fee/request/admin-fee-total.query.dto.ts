import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class AdminFeeTotalQueryDto {
  @ApiProperty({
    description: 'Month number',
    example: 5,
    minimum: 1,
    maximum: 12,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Full year',
    example: 2026,
    minimum: 2000,
    maximum: 3000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(3000)
  year: number;
}
