import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dtos/pagination-query.dto';

class GetUsersBaseDto {
  @ApiPropertyOptional({
    description: 'Filter users created at or after this date',
    type: String,
    format: 'date-time',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter users created at or before this date',
    type: String,
    format: 'date-time',
    example: '2026-12-31T23:59:59.999Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;
}

export class GetUsersRequestDto extends IntersectionType(
  GetUsersBaseDto,
  PaginationDto,
) {}
