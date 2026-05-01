import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { DeliverableStatus } from '../enums/deliverable-status.enum';
import { DeliverableType } from '../enums/deliverable-type.enum';

export class GetMyDeliverablesQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: DeliverableType,
    description: 'Filter by deliverable type',
  })
  @IsOptional()
  @IsEnum(DeliverableType)
  type?: DeliverableType;

  @ApiPropertyOptional({
    enum: DeliverableStatus,
    description: 'Filter by deliverable status',
  })
  @IsOptional()
  @IsEnum(DeliverableStatus)
  status?: DeliverableStatus;

  @ApiPropertyOptional({
    description: 'Search by deliverable name or description',
    example: 'documentation',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
