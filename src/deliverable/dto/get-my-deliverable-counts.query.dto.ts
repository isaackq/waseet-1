import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsEnum, IsOptional } from 'class-validator';
import { DeliverableType } from '../enums/deliverable-type.enum';

export class GetMyDeliverableCountsQueryDto {
  @ApiPropertyOptional({
    enum: DeliverableType,
    isArray: true,
    description:
      'Only return counts for these deliverable types. Pass as comma-separated values.',
    example: 'DOCUMENT,PDF,ZIP_FILE',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
    return undefined;
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(DeliverableType, { each: true })
  types?: DeliverableType[];
}
