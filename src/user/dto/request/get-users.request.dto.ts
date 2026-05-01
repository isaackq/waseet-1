import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { RolesEnum } from 'src/user/enums/role.enum';

class GetUsersBaseDto {
  @ApiPropertyOptional({
    description:
      'Search by first name, middle name, last name, identification name, email, or phone number',
    type: String,
    example: 'isaac',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by one role assigned to the user',
    enum: RolesEnum,
    example: RolesEnum.FREELANCER,
  })
  @IsEnum(RolesEnum)
  @IsOptional()
  role?: RolesEnum;

  @ApiPropertyOptional({
    description: 'Filter by account active status',
    type: Boolean,
    example: true,
  })
  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

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
