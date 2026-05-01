import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { DisputeStatus } from '../enums/dispute-status.enum';

export enum MyDisputesFilterEnum {
  ALL = 'all',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export class GetMyDisputesQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: MyDisputesFilterEnum,
    default: MyDisputesFilterEnum.ALL,
    description: 'Filter disputes by state group',
  })
  @IsOptional()
  @IsEnum(MyDisputesFilterEnum)
  filter?: MyDisputesFilterEnum = MyDisputesFilterEnum.ALL;

  @ApiPropertyOptional({
    description: 'Search by session id, reason, or admin decision',
    example: 'refund',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
