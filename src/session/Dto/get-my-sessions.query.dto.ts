import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dtos/pagination-query.dto';

export enum MySessionsFilterEnum {
  ALL = 'all',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PENDING = 'pending',
}

export class GetMySessionsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: MySessionsFilterEnum,
    description: 'Filter sessions by process group',
    default: MySessionsFilterEnum.ALL,
  })
  @IsOptional()
  @IsEnum(MySessionsFilterEnum)
  filter?: MySessionsFilterEnum = MySessionsFilterEnum.ALL;

  @ApiPropertyOptional({
    description: 'Search by title, description, or join code',
    example: 'logo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
