import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';

//For Query in the URL
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Number of items per page',
    type: Number,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Page number',
    type: Number,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page: number = 1; //the default value for the page
}
