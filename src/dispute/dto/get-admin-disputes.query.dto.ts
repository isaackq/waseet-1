import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { DisputeStatus } from '../enums/dispute-status.enum';

export class GetAdminDisputesQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by reason, admin decision, resolution, or dispute id',
    example: 'refund',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by dispute status',
    enum: DisputeStatus,
    example: DisputeStatus.UNDER_REVIEW,
  })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;
}
